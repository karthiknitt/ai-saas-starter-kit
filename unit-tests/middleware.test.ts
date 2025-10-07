import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock the dependencies
vi.mock('better-auth/cookies', () => ({
  getSessionCookie: vi.fn(),
}))

vi.mock('@/lib/arcjet', () => ({
  aj: {
    protect: vi.fn(),
  },
}))

describe('middleware', () => {
  let mockGetSessionCookie: ReturnType<typeof vi.fn>
  let mockAjProtect: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetModules()
    
    // Get mocked functions
    const { getSessionCookie } = await import('better-auth/cookies')
    const { aj } = await import('@/lib/arcjet')
    
    mockGetSessionCookie = getSessionCookie as ReturnType<typeof vi.fn>
    mockAjProtect = aj.protect as ReturnType<typeof vi.fn>
    
    // Default mock implementations
    mockAjProtect.mockResolvedValue({
      isDenied: () => false,
      isAllowed: () => true,
    })
    
    mockGetSessionCookie.mockReturnValue('session-cookie-value')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function createMockRequest(pathname: string = '/'): NextRequest {
    const url = `http://localhost:3000${pathname}`
    return {
      url,
      nextUrl: new URL(url),
      headers: new Headers(),
      method: 'GET',
    } as NextRequest
  }

  describe('arcjet protection', () => {
    it('should call arcjet protect for all requests', async () => {
      const { middleware } = await import('../middleware')
      const request = createMockRequest('/')

      await middleware(request)

      expect(mockAjProtect).toHaveBeenCalledWith(request)
    })

    it('should return 403 when arcjet denies request', async () => {
      mockAjProtect.mockResolvedValue({
        isDenied: () => true,
        isAllowed: () => false,
      })

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/')

      const response = await middleware(request)

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body).toEqual({ error: 'Access denied' })
    })

    it('should continue when arcjet allows request', async () => {
      mockAjProtect.mockResolvedValue({
        isDenied: () => false,
        isAllowed: () => true,
      })

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/')

      const response = await middleware(request)

      expect(response.status).not.toBe(403)
    })
  })

  describe('authentication for protected routes', () => {
    it('should check session for dashboard routes', async () => {
      mockGetSessionCookie.mockReturnValue(null)

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboard')

      await middleware(request)

      expect(mockGetSessionCookie).toHaveBeenCalledWith(request)
    })

    it('should redirect to home when accessing dashboard without session', async () => {
      mockGetSessionCookie.mockReturnValue(null)

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboard')

      const response = await middleware(request)

      expect(response.status).toBe(307) // Redirect
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('should allow dashboard access with valid session', async () => {
      mockGetSessionCookie.mockReturnValue('valid-session-cookie')

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboard')

      const response = await middleware(request)

      expect(response.status).not.toBe(307)
    })

    it('should allow dashboard sub-routes with session', async () => {
      mockGetSessionCookie.mockReturnValue('valid-session-cookie')

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboard/settings')

      const response = await middleware(request)

      expect(response.status).not.toBe(307)
    })

    it('should not check session for non-protected routes', async () => {
      const { middleware } = await import('../middleware')
      const request = createMockRequest('/')

      const response = await middleware(request)

      // Should proceed without redirect even with no session
      expect(response.status).not.toBe(307)
    })

    it('should allow public routes without session', async () => {
      mockGetSessionCookie.mockReturnValue(null)

      const { middleware } = await import('../middleware')
      const publicRoutes = ['/', '/about', '/pricing', '/contact']

      for (const route of publicRoutes) {
        const request = createMockRequest(route)
        const response = await middleware(request)
        
        expect(response.status).not.toBe(307)
      }
    })
  })

  describe('security headers', () => {
    it('should add X-Frame-Options header', async () => {
      const { middleware } = await import('../middleware')
      const request = createMockRequest('/')

      const response = await middleware(request)

      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should add X-Content-Type-Options header', async () => {
      const { middleware } = await import('../middleware')
      const request = createMockRequest('/')

      const response = await middleware(request)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should add Referrer-Policy header', async () => {
      const { middleware } = await import('../middleware')
      const request = createMockRequest('/')

      const response = await middleware(request)

      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })

    it('should add Permissions-Policy header', async () => {
      const { middleware } = await import('../middleware')
      const request = createMockRequest('/')

      const response = await middleware(request)

      const permissionsPolicy = response.headers.get('Permissions-Policy')
      expect(permissionsPolicy).toBeDefined()
      expect(permissionsPolicy).toContain('geolocation=()')
      expect(permissionsPolicy).toContain('microphone=()')
      expect(permissionsPolicy).toContain('camera=()')
    })

    it('should add all security headers to all responses', async () => {
      const { middleware } = await import('../middleware')
      const routes = ['/', '/about', '/dashboard', '/api/test']

      for (const route of routes) {
        const request = createMockRequest(route)
        const response = await middleware(request)
        
        expect(response.headers.get('X-Frame-Options')).toBe('DENY')
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
        expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
        expect(response.headers.get('Permissions-Policy')).toBeTruthy()
      }
    })
  })

  describe('middleware execution order', () => {
    it('should check arcjet before authentication', async () => {
      mockAjProtect.mockResolvedValue({
        isDenied: () => true,
        isAllowed: () => false,
      })

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboard')

      const response = await middleware(request)

      expect(mockAjProtect).toHaveBeenCalled()
      expect(response.status).toBe(403)
      // Session check should not be reached
    })

    it('should check authentication after arcjet passes', async () => {
      mockAjProtect.mockResolvedValue({
        isDenied: () => false,
        isAllowed: () => true,
      })
      mockGetSessionCookie.mockReturnValue(null)

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboard')

      const response = await middleware(request)

      expect(mockAjProtect).toHaveBeenCalled()
      expect(mockGetSessionCookie).toHaveBeenCalled()
    })

    it('should add security headers after all checks pass', async () => {
      mockGetSessionCookie.mockReturnValue('valid-session')

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboard')

      const response = await middleware(request)

      expect(response.headers.get('X-Frame-Options')).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty pathname', async () => {
      const { middleware } = await import('../middleware')
      const request = createMockRequest('')

      const response = await middleware(request)

      expect(response).toBeDefined()
    })

    it('should handle dashboard with trailing slash', async () => {
      mockGetSessionCookie.mockReturnValue(null)

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboard/')

      const response = await middleware(request)

      expect(response.status).toBe(307)
    })

    it('should handle case-sensitive dashboard path', async () => {
      mockGetSessionCookie.mockReturnValue(null)

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboard')

      const response = await middleware(request)

      expect(response.status).toBe(307)
    })

    it('should not treat /dashboards as protected', async () => {
      mockGetSessionCookie.mockReturnValue(null)

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboards')

      const response = await middleware(request)

      // Should not redirect since it's not /dashboard
      expect(response.status).not.toBe(307)
    })

    it('should handle very long paths', async () => {
      const longPath = '/dashboard/' + 'a'.repeat(1000)
      mockGetSessionCookie.mockReturnValue('valid-session')

      const { middleware } = await import('../middleware')
      const request = createMockRequest(longPath)

      const response = await middleware(request)

      expect(response).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle arcjet errors gracefully', async () => {
      mockAjProtect.mockRejectedValue(new Error('Arcjet service error'))

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/')

      await expect(middleware(request)).rejects.toThrow('Arcjet service error')
    })

    it('should handle getSessionCookie errors', async () => {
      mockGetSessionCookie.mockImplementation(() => {
        throw new Error('Cookie parsing error')
      })

      const { middleware } = await import('../middleware')
      const request = createMockRequest('/dashboard')

      await expect(middleware(request)).rejects.toThrow('Cookie parsing error')
    })
  })
})