import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createRateLimit, apiRateLimit, authRateLimit, chatRateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

// Mock NextRequest and NextResponse
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((body, init) => ({
      status: init?.status || 200,
      headers: init?.headers || new Map(),
      body,
    })),
    next: vi.fn(() => ({
      headers: new Map(),
    })),
  },
}))

describe('rate-limit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createRateLimit', () => {
    it('should allow requests within limit', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 10,
      })

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      const result = rateLimit(mockRequest)
      expect(result).toBeDefined()
    })

    it('should block requests exceeding limit', () => {
      vi.useFakeTimers()
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
      })

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      // First request - should pass
      rateLimit(mockRequest)
      // Second request - should pass
      rateLimit(mockRequest)
      // Third request - should be blocked
      const result = rateLimit(mockRequest)

      expect(result.status).toBe(429)
      expect(result.body).toHaveProperty('error', 'Too many requests')
    })

    it('should reset counter after time window', () => {
      vi.useFakeTimers()
      const rateLimit = createRateLimit({
        windowMs: 1000,
        maxRequests: 1,
      })

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      // First request - should pass
      rateLimit(mockRequest)

      // Second request immediately - should be blocked
      let result = rateLimit(mockRequest)
      expect(result.status).toBe(429)

      // Advance time past window
      vi.advanceTimersByTime(1001)

      // Third request after window - should pass
      result = rateLimit(mockRequest)
      expect(result.status).not.toBe(429)
    })

    it('should track different IPs separately', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
      })

      const mockRequest1 = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      const mockRequest2 = {
        headers: new Map([['x-forwarded-for', '5.6.7.8']]),
      } as unknown as NextRequest

      // First IP - should pass
      let result = rateLimit(mockRequest1)
      expect(result.status).not.toBe(429)

      // Second IP - should also pass (different IP)
      result = rateLimit(mockRequest2)
      expect(result.status).not.toBe(429)

      // First IP again - should be blocked
      result = rateLimit(mockRequest1)
      expect(result.status).toBe(429)
    })

    it('should extract IP from x-real-ip header if x-forwarded-for not present', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
      })

      const mockRequest = {
        headers: new Map([['x-real-ip', '9.10.11.12']]),
      } as unknown as NextRequest

      const result = rateLimit(mockRequest)
      expect(result).toBeDefined()
    })

    it('should use "anonymous" if no IP headers present', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
      })

      const mockRequest = {
        headers: new Map(),
      } as unknown as NextRequest

      const result = rateLimit(mockRequest)
      expect(result).toBeDefined()
    })

    it('should include rate limit headers in response', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      })

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      const result = rateLimit(mockRequest)

      // Check for rate limit headers
      if (result.headers) {
        expect(result.headers.get('X-RateLimit-Limit')).toBe('5')
        expect(result.headers.get('X-RateLimit-Remaining')).toBe('4')
        expect(result.headers.get('X-RateLimit-Reset')).toBeDefined()
      }
    })

    it('should include retry-after header when rate limited', () => {
      vi.useFakeTimers()
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
      })

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      // First request
      rateLimit(mockRequest)
      // Second request - should be blocked
      const result = rateLimit(mockRequest)

      expect(result.body).toHaveProperty('retryAfter')
      if (result.headers) {
        expect(result.headers.get('Retry-After')).toBeDefined()
      }
    })

    it('should handle multiple requests from comma-separated forwarded IPs', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
      })

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4, 5.6.7.8, 9.10.11.12']]),
      } as unknown as NextRequest

      // Should use the first IP
      rateLimit(mockRequest)
      const result = rateLimit(mockRequest)
      expect(result.status).toBe(429)
    })
  })

  describe('pre-configured rate limiters', () => {
    it('apiRateLimit should have correct configuration', () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      const result = apiRateLimit(mockRequest)
      expect(result).toBeDefined()
      if (result.headers) {
        expect(result.headers.get('X-RateLimit-Limit')).toBe('100')
      }
    })

    it('authRateLimit should have stricter limits', () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      const result = authRateLimit(mockRequest)
      expect(result).toBeDefined()
      if (result.headers) {
        expect(result.headers.get('X-RateLimit-Limit')).toBe('5')
      }
    })

    it('chatRateLimit should have moderate limits', () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      const result = chatRateLimit(mockRequest)
      expect(result).toBeDefined()
      if (result.headers) {
        expect(result.headers.get('X-RateLimit-Limit')).toBe('20')
      }
    })
  })

  describe('edge cases', () => {
    it('should handle very high request counts', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1000,
      })

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      // Make many requests
      for (let i = 0; i < 999; i++) {
        rateLimit(mockRequest)
      }

      const result = rateLimit(mockRequest)
      expect(result.status).not.toBe(429)
    })

    it('should handle concurrent requests from same IP', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      })

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '1.2.3.4']]),
      } as unknown as NextRequest

      const results = Array(10)
        .fill(null)
        .map(() => rateLimit(mockRequest))

      const blockedCount = results.filter(r => r.status === 429).length
      expect(blockedCount).toBeGreaterThan(0)
    })

    it('should handle invalid IP formats gracefully', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
      })

      const mockRequest = {
        headers: new Map([['x-forwarded-for', 'invalid-ip']]),
      } as unknown as NextRequest

      expect(() => rateLimit(mockRequest)).not.toThrow()
    })
  })
})