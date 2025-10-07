import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock dependencies
vi.mock('better-auth/cookies', () => ({
  getSessionCookie: vi.fn(),
}))

vi.mock('@/lib/arcjet', () => ({
  aj: {
    protect: vi.fn(),
  },
}))

describe('Middleware', () => {
  let middleware: any
  let getSessionCookie: any
  let ajProtect: any

  beforeEach(async () => {
    vi.resetModules()
    
    const authModule = await import('better-auth/cookies')
    getSessionCookie = authModule.getSessionCookie
    
    const arcjetModule = await import('@/lib/arcjet')
    ajProtect = arcjetModule.aj.protect
    
    const middlewareModule = await import('../../middleware')
    middleware = middlewareModule.middleware
  })

  const createMockRequest = (pathname: string, headers?: Record<string, string>) => {
    const url = `https://example.com${pathname}`
    const headersObj = new Headers(headers || {})
    return new NextRequest(url, { headers: headersObj })
  }

  describe('Arcjet protection', () => {
    it('should call Arcjet protect for all requests', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('valid-session')

      const request = createMockRequest('/dashboard')
      await middleware(request)

      expect(ajProtect).toHaveBeenCalledWith(request)
    })

    it('should return 403 when Arcjet denies access', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => true })

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body).toEqual({ error: 'Access denied' })
    })

    it('should continue processing when Arcjet allows access', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('valid-session')

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).not.toBe(403)
    })
  })

  describe('authentication', () => {
    it('should redirect to home when accessing protected route without session', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue(null)

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toBe('https://example.com/')
    })

    it('should allow access to protected route with valid session', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('valid-session-cookie')

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).not.toBe(307)
    })

    it('should allow access to non-protected routes without session', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue(null)

      const request = createMockRequest('/')
      const response = await middleware(request)

      expect(response.status).not.toBe(307)
    })

    it('should identify dashboard paths as protected', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue(null)

      const paths = ['/dashboard', '/dashboard/settings', '/dashboard/profile']

      for (const path of paths) {
        const request = createMockRequest(path)
        const response = await middleware(request)
        expect(response.status).toBe(307)
      }
    })

    it('should not protect non-dashboard paths', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue(null)

      const paths = ['/', '/about', '/pricing', '/features']

      for (const path of paths) {
        const request = createMockRequest(path)
        const response = await middleware(request)
        expect(response.status).not.toBe(307)
      }
    })
  })

  describe('security headers', () => {
    it('should add X-Frame-Options header', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('session')

      const request = createMockRequest('/')
      const response = await middleware(request)

      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should add X-Content-Type-Options header', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('session')

      const request = createMockRequest('/')
      const response = await middleware(request)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should add Referrer-Policy header', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('session')

      const request = createMockRequest('/')
      const response = await middleware(request)

      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })

    it('should add Permissions-Policy header', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('session')

      const request = createMockRequest('/')
      const response = await middleware(request)

      expect(response.headers.get('Permissions-Policy')).toBe('geolocation=(), microphone=(), camera=()')
    })

    it('should add all security headers on every response', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('session')

      const request = createMockRequest('/some-page')
      const response = await middleware(request)

      expect(response.headers.get('X-Frame-Options')).toBeTruthy()
      expect(response.headers.get('X-Content-Type-Options')).toBeTruthy()
      expect(response.headers.get('Referrer-Policy')).toBeTruthy()
      expect(response.headers.get('Permissions-Policy')).toBeTruthy()
    })
  })

  describe('error handling', () => {
    it('should handle Arcjet errors gracefully', async () => {
      ajProtect.mockRejectedValue(new Error('Arcjet service error'))

      const request = createMockRequest('/')
      
      await expect(middleware(request)).rejects.toThrow('Arcjet service error')
    })

    it('should handle missing session cookie gracefully', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue(undefined)

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(307)
    })
  })

  describe('edge cases', () => {
    it('should handle requests with query parameters', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('session')

      const request = createMockRequest('/dashboard?tab=settings')
      const response = await middleware(request)

      expect(response.status).not.toBe(403)
    })

    it('should handle requests with hash fragments', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('session')

      const request = createMockRequest('/dashboard#section')
      const response = await middleware(request)

      expect(response.status).not.toBe(403)
    })

    it('should handle nested dashboard paths', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue(null)

      const request = createMockRequest('/dashboard/settings/profile')
      const response = await middleware(request)

      expect(response.status).toBe(307)
    })

    it('should handle paths that start with dashboard substring but are not protected', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue(null)

      const request = createMockRequest('/dashboards-info')
      const response = await middleware(request)

      // This should not redirect as it doesn't start with '/dashboard'
      expect(response.status).not.toBe(307)
    })
  })

  describe('configuration', () => {
    it('should have matcher config defined', async () => {
      const middlewareModule = await import('../../middleware')
      
      expect(middlewareModule.config).toBeDefined()
      expect(middlewareModule.config.matcher).toBeDefined()
      expect(Array.isArray(middlewareModule.config.matcher)).toBe(true)
    })

    it('should exclude API routes from matcher', async () => {
      const middlewareModule = await import('../../middleware')
      
      // The matcher regex should exclude /api routes
      const matcher = middlewareModule.config.matcher[0]
      expect(matcher).toContain('api')
    })

    it('should exclude static files from matcher', async () => {
      const middlewareModule = await import('../../middleware')
      
      // The matcher should exclude _next/static
      const matcher = middlewareModule.config.matcher[0]
      expect(matcher).toContain('_next/static')
    })
  })

  describe('integration scenarios', () => {
    it('should process request with Arcjet approval and valid session', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue('valid-session')

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).not.toBe(403)
      expect(response.status).not.toBe(307)
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should block request when Arcjet denies even with valid session', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => true })
      getSessionCookie.mockReturnValue('valid-session')

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(403)
    })

    it('should redirect when Arcjet allows but session is missing for protected route', async () => {
      ajProtect.mockResolvedValue({ isDenied: () => false })
      getSessionCookie.mockReturnValue(null)

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/')
    })
  })
})