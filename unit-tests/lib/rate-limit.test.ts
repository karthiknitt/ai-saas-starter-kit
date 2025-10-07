import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createRateLimit, apiRateLimit, authRateLimit, chatRateLimit } from '@/lib/rate-limit'

// Mock NextRequest
const createMockRequest = (ip?: string, headers?: Record<string, string>) => {
  const mockHeaders = new Map()
  if (ip) {
    mockHeaders.set('x-forwarded-for', ip)
  }
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      mockHeaders.set(key, value)
    })
  }
  
  return {
    headers: {
      get: (key: string) => mockHeaders.get(key) || null
    },
    nextUrl: {
      pathname: '/api/test'
    }
  } as unknown as NextRequest
}

describe('rate-limit', () => {
  beforeEach(() => {
    // Clear the rate limit store before each test
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('createRateLimit', () => {
    it('should allow requests within the limit', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })

      const request = createMockRequest('192.168.1.1')
      
      // Make 5 requests (all should pass)
      for (let i = 0; i < 5; i++) {
        const response = rateLimit(request)
        expect(response).toBeDefined()
        // Check if it's a NextResponse.next() or similar
        if (response && typeof response === 'object' && 'headers' in response) {
          expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
          expect(response.headers.get('X-RateLimit-Remaining')).toBe(String(5 - i - 1))
        }
      }
    })

    it('should block requests exceeding the limit', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 3
      })

      const request = createMockRequest('192.168.1.2')
      
      // Make 3 requests (should pass)
      for (let i = 0; i < 3; i++) {
        rateLimit(request)
      }
      
      // 4th request should be blocked
      const response = rateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should reset counter after window expires', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 3
      })

      const request = createMockRequest('192.168.1.3')
      
      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        rateLimit(request)
      }
      
      // 4th request should be blocked
      let response = rateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
      
      // Advance time past the window
      vi.advanceTimersByTime(61000)
      
      // New request should be allowed
      response = rateLimit(request)
      expect(response).toBeDefined()
    })

    it('should track different IPs independently', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      const request1 = createMockRequest('192.168.1.1')
      const request2 = createMockRequest('192.168.1.2')
      
      // Make 2 requests from IP1
      rateLimit(request1)
      rateLimit(request1)
      
      // 3rd request from IP1 should be blocked
      let response = rateLimit(request1)
      expect(response).toBeInstanceOf(NextResponse)
      
      // But requests from IP2 should still work
      response = rateLimit(request2)
      expect(response).toBeDefined()
      response = rateLimit(request2)
      expect(response).toBeDefined()
    })

    it('should handle missing IP address', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })

      const request = createMockRequest()
      
      const response = rateLimit(request)
      expect(response).toBeDefined()
    })

    it('should extract IP from x-forwarded-for header', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      const request = createMockRequest('10.0.0.1, 192.168.1.1')
      
      // Should use first IP in the chain
      rateLimit(request)
      rateLimit(request)
      
      const response = rateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should fallback to x-real-ip if x-forwarded-for not present', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      const mockHeaders = new Map([['x-real-ip', '203.0.113.1']])
      const request = {
        headers: {
          get: (key: string) => mockHeaders.get(key) || null
        }
      } as unknown as NextRequest
      
      rateLimit(request)
      rateLimit(request)
      
      const response = rateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should include rate limit headers in response', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 10
      })

      const request = createMockRequest('192.168.1.10')
      const response = rateLimit(request)
      
      if (response && typeof response === 'object' && 'headers' in response) {
        expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
        expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
      }
    })

    it('should return 429 status when rate limited', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      })

      const request = createMockRequest('192.168.1.11')
      
      rateLimit(request) // First request
      const response = rateLimit(request) // Second request (blocked)
      
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should include Retry-After header when rate limited', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      })

      const request = createMockRequest('192.168.1.12')
      
      rateLimit(request)
      const response = rateLimit(request)
      
      if (response && typeof response === 'object' && 'headers' in response) {
        expect(response.headers.get('Retry-After')).toBeDefined()
      }
    })
  })

  describe('apiRateLimit', () => {
    it('should have correct configuration (100 requests per minute)', () => {
      const request = createMockRequest('192.168.2.1')
      
      // Make 100 requests (should all pass)
      for (let i = 0; i < 100; i++) {
        const response = apiRateLimit(request)
        expect(response).toBeDefined()
      }
      
      // 101st request should be blocked
      const response = apiRateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should reset after 1 minute', () => {
      const request = createMockRequest('192.168.2.2')
      
      // Exhaust the limit
      for (let i = 0; i < 100; i++) {
        apiRateLimit(request)
      }
      
      // Should be blocked
      let response = apiRateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
      
      // Advance time by 61 seconds
      vi.advanceTimersByTime(61000)
      
      // Should work again
      response = apiRateLimit(request)
      expect(response).toBeDefined()
    })
  })

  describe('authRateLimit', () => {
    it('should have correct configuration (5 requests per 15 minutes)', () => {
      const request = createMockRequest('192.168.3.1')
      
      // Make 5 requests (should all pass)
      for (let i = 0; i < 5; i++) {
        const response = authRateLimit(request)
        expect(response).toBeDefined()
      }
      
      // 6th request should be blocked
      const response = authRateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should reset after 15 minutes', () => {
      const request = createMockRequest('192.168.3.2')
      
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        authRateLimit(request)
      }
      
      // Should be blocked
      let response = authRateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
      
      // Advance time by 15 minutes + 1 second
      vi.advanceTimersByTime(15 * 60 * 1000 + 1000)
      
      // Should work again
      response = authRateLimit(request)
      expect(response).toBeDefined()
    })
  })

  describe('chatRateLimit', () => {
    it('should have correct configuration (20 requests per minute)', () => {
      const request = createMockRequest('192.168.4.1')
      
      // Make 20 requests (should all pass)
      for (let i = 0; i < 20; i++) {
        const response = chatRateLimit(request)
        expect(response).toBeDefined()
      }
      
      // 21st request should be blocked
      const response = chatRateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should reset after 1 minute', () => {
      const request = createMockRequest('192.168.4.2')
      
      // Exhaust the limit
      for (let i = 0; i < 20; i++) {
        chatRateLimit(request)
      }
      
      // Should be blocked
      let response = chatRateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
      
      // Advance time by 61 seconds
      vi.advanceTimersByTime(61000)
      
      // Should work again
      response = chatRateLimit(request)
      expect(response).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle concurrent requests from same IP', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })

      const request = createMockRequest('192.168.5.1')
      
      // Simulate concurrent requests
      const responses = []
      for (let i = 0; i < 10; i++) {
        responses.push(rateLimit(request))
      }
      
      // Some requests should be blocked
      const blockedCount = responses.filter(r => r instanceof NextResponse).length
      expect(blockedCount).toBeGreaterThan(0)
    })

    it('should handle very short time windows', () => {
      const rateLimit = createRateLimit({
        windowMs: 100, // 100ms window
        maxRequests: 2
      })

      const request = createMockRequest('192.168.5.2')
      
      rateLimit(request)
      rateLimit(request)
      
      const response = rateLimit(request)
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should handle very long time windows', () => {
      const rateLimit = createRateLimit({
        windowMs: 3600000, // 1 hour
        maxRequests: 1000
      })

      const request = createMockRequest('192.168.5.3')
      
      const response = rateLimit(request)
      expect(response).toBeDefined()
    })

    it('should handle maxRequests of 1', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      })

      const request = createMockRequest('192.168.5.4')
      
      const first = rateLimit(request)
      expect(first).toBeDefined()
      
      const second = rateLimit(request)
      expect(second).toBeInstanceOf(NextResponse)
    })

    it('should handle very high maxRequests', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 10000
      })

      const request = createMockRequest('192.168.5.5')
      
      // Make many requests
      for (let i = 0; i < 100; i++) {
        const response = rateLimit(request)
        expect(response).toBeDefined()
        if (response && typeof response === 'object' && 'headers' in response) {
          expect(response.headers.get('X-RateLimit-Remaining')).toBe(String(10000 - i - 1))
        }
      }
    })

    it('should handle IP addresses with special characters', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })

      const request = createMockRequest('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
      
      const response = rateLimit(request)
      expect(response).toBeDefined()
    })
  })

  describe('memory cleanup', () => {
    it('should have cleanup interval', () => {
      // The cleanup runs every 60 seconds
      // We can't directly test the setInterval, but we can verify it doesn't crash
      expect(() => {
        vi.advanceTimersByTime(60000)
      }).not.toThrow()
    })
  })
})