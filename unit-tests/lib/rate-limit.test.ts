import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createRateLimit } from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createMockRequest = (ip?: string): NextRequest => {
    const headers = new Headers()
    if (ip) {
      headers.set('x-forwarded-for', ip)
    }
    
    return new NextRequest('https://example.com/api/test', {
      headers
    })
  }

  describe('createRateLimit', () => {
    it('should create a rate limit middleware', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 10
      })

      expect(rateLimit).toBeInstanceOf(Function)
    })

    it('should allow requests within the limit', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })

      const request = createMockRequest('192.168.1.1')
      const response = rateLimit(request)

      expect(response.status).not.toBe(429)
    })

    it('should block requests exceeding the limit', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 3
      })

      const request = createMockRequest('192.168.1.2')
      
      // Make 3 allowed requests
      rateLimit(request)
      rateLimit(request)
      rateLimit(request)

      // 4th request should be blocked
      const response = rateLimit(request)
      expect(response.status).toBe(429)
    })

    it('should return proper rate limit headers on success', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 10
      })

      const request = createMockRequest('192.168.1.3')
      const response = rateLimit(request)

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    })

    it('should return error with retry-after header when rate limited', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      const request = createMockRequest('192.168.1.4')
      
      rateLimit(request)
      rateLimit(request)
      const response = rateLimit(request)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')

      const body = await response.json()
      expect(body).toHaveProperty('error', 'Too many requests')
      expect(body).toHaveProperty('retryAfter')
    })

    it('should reset counter after time window', () => {
      const windowMs = 60000
      const rateLimit = createRateLimit({
        windowMs,
        maxRequests: 2
      })

      const request = createMockRequest('192.168.1.5')
      
      // Use up the limit
      rateLimit(request)
      rateLimit(request)
      
      // This should be blocked
      let response = rateLimit(request)
      expect(response.status).toBe(429)

      // Advance time past the window
      vi.advanceTimersByTime(windowMs + 1000)

      // Should be allowed again
      response = rateLimit(request)
      expect(response.status).not.toBe(429)
    })

    it('should track different IPs separately', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      const request1 = createMockRequest('192.168.1.10')
      const request2 = createMockRequest('192.168.1.11')
      
      // Use up limit for IP 1
      rateLimit(request1)
      rateLimit(request1)
      
      // IP 1 should be blocked
      let response = rateLimit(request1)
      expect(response.status).toBe(429)

      // IP 2 should still be allowed
      response = rateLimit(request2)
      expect(response.status).not.toBe(429)
    })

    it('should handle x-real-ip header as fallback', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      const headers = new Headers()
      headers.set('x-real-ip', '192.168.1.20')
      
      const request = new NextRequest('https://example.com/api/test', { headers })
      
      rateLimit(request)
      rateLimit(request)
      
      const response = rateLimit(request)
      expect(response.status).toBe(429)
    })

    it('should handle anonymous users when no IP available', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      const request = new NextRequest('https://example.com/api/test')
      
      rateLimit(request)
      rateLimit(request)
      
      const response = rateLimit(request)
      expect(response.status).toBe(429)
    })

    it('should handle comma-separated x-forwarded-for header', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      const headers = new Headers()
      headers.set('x-forwarded-for', '192.168.1.30, 10.0.0.1, 172.16.0.1')
      
      const request = new NextRequest('https://example.com/api/test', { headers })
      
      rateLimit(request)
      rateLimit(request)
      
      // Should use first IP in the list
      const response = rateLimit(request)
      expect(response.status).toBe(429)
    })

    it('should decrement remaining count correctly', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })

      const request = createMockRequest('192.168.1.40')
      
      let response = rateLimit(request)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4')
      
      response = rateLimit(request)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('3')
      
      response = rateLimit(request)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('2')
    })

    it('should handle concurrent requests from same IP', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })

      const request = createMockRequest('192.168.1.50')
      
      // Simulate concurrent requests
      const responses = Array(6).fill(null).map(() => rateLimit(request))
      
      // Last request should be rate limited
      expect(responses[5].status).toBe(429)
    })

    it('should provide accurate retry-after time', async () => {
      const windowMs = 60000
      const rateLimit = createRateLimit({
        windowMs,
        maxRequests: 1
      })

      const request = createMockRequest('192.168.1.60')
      
      rateLimit(request)
      
      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000)
      
      const response = rateLimit(request)
      const body = await response.json()
      
      // Should have ~30 seconds remaining
      expect(body.retryAfter).toBeGreaterThan(25)
      expect(body.retryAfter).toBeLessThanOrEqual(30)
    })

    it('should handle very short time windows', () => {
      const rateLimit = createRateLimit({
        windowMs: 1000, // 1 second
        maxRequests: 2
      })

      const request = createMockRequest('192.168.1.70')
      
      rateLimit(request)
      rateLimit(request)
      
      let response = rateLimit(request)
      expect(response.status).toBe(429)

      // Wait 1.1 seconds
      vi.advanceTimersByTime(1100)

      response = rateLimit(request)
      expect(response.status).not.toBe(429)
    })

    it('should handle very large time windows', () => {
      const rateLimit = createRateLimit({
        windowMs: 3600000, // 1 hour
        maxRequests: 100
      })

      const request = createMockRequest('192.168.1.80')
      const response = rateLimit(request)

      expect(response.status).not.toBe(429)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
    })
  })

  describe('edge cases', () => {
    it('should handle maxRequests of 0', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 0
      })

      const request = createMockRequest('192.168.1.90')
      const response = rateLimit(request)

      expect(response.status).toBe(429)
    })

    it('should handle maxRequests of 1', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      })

      const request = createMockRequest('192.168.1.100')
      
      let response = rateLimit(request)
      expect(response.status).not.toBe(429)
      
      response = rateLimit(request)
      expect(response.status).toBe(429)
    })

    it('should handle very high maxRequests', () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1000000
      })

      const request = createMockRequest('192.168.1.110')
      const response = rateLimit(request)

      expect(response.status).not.toBe(429)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('1000000')
    })
  })
})