import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  apiRateLimit,
  authRateLimit,
  chatRateLimit,
  createRateLimit,
} from '@/lib/rate-limit';

// Helper to create a mock NextRequest
function createMockRequest(ip: string = '192.168.1.1'): NextRequest {
  const headers = new Headers();
  headers.set('x-forwarded-for', ip);

  return {
    headers,
    url: 'http://localhost:3000/api/test',
    method: 'GET',
    nextUrl: new URL('http://localhost:3000/api/test'),
  } as NextRequest;
}

describe('rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('createRateLimit', () => {
    it('should allow requests within limit', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const request = createMockRequest('1.2.3.4');

      for (let i = 0; i < 5; i++) {
        const response = rateLimiter(request);
        expect(response.status).not.toBe(429);
        expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      }
    });

    it('should block requests exceeding limit', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 3,
      });

      const request = createMockRequest('1.2.3.5');

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const response = rateLimiter(request);
        expect(response.status).not.toBe(429);
      }

      // 4th request should be rate limited
      const blockedResponse = rateLimiter(request);
      expect(blockedResponse.status).toBe(429);
    });

    it('should include rate limit headers in successful responses', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 10,
      });

      const request = createMockRequest();
      const response = rateLimiter(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should include retry-after header in blocked responses', async () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
      });

      const request = createMockRequest('1.2.3.6');

      // Consume the limit
      rateLimiter(request);
      rateLimiter(request);

      // Should be blocked
      const blockedResponse = rateLimiter(request);
      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.headers.get('Retry-After')).toBeTruthy();
      expect(blockedResponse.headers.get('X-RateLimit-Remaining')).toBe('0');

      const body = await blockedResponse.json();
      expect(body).toHaveProperty('error', 'Too many requests');
      expect(body).toHaveProperty('retryAfter');
    });

    it('should reset counter after window expires', () => {
      const windowMs = 60000;
      const rateLimiter = createRateLimit({
        windowMs,
        maxRequests: 2,
      });

      const request = createMockRequest('1.2.3.7');

      // Use up the limit
      rateLimiter(request);
      rateLimiter(request);

      // Should be blocked
      const blockedResponse = rateLimiter(request);
      expect(blockedResponse.status).toBe(429);

      // Advance time past the window
      vi.advanceTimersByTime(windowMs + 1000);

      // Should allow requests again
      const newResponse = rateLimiter(request);
      expect(newResponse.status).not.toBe(429);
    });

    it('should track different IPs independently', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
      });

      const request1 = createMockRequest('1.2.3.8');
      const request2 = createMockRequest('9.8.7.6');

      // IP1 uses its limit
      rateLimiter(request1);
      rateLimiter(request1);

      // IP1 should be blocked
      const blocked1 = rateLimiter(request1);
      expect(blocked1.status).toBe(429);

      // IP2 should still be allowed
      const allowed2 = rateLimiter(request2);
      expect(allowed2.status).not.toBe(429);
    });

    it('should handle x-real-ip header when x-forwarded-for is not present', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
      });

      const headers = new Headers();
      headers.set('x-real-ip', '10.0.0.1');

      const request = {
        headers,
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        nextUrl: new URL('http://localhost:3000/api/test'),
      } as NextRequest;

      rateLimiter(request);
      const response = rateLimiter(request);

      expect(response.status).not.toBe(429);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should use "anonymous" for requests without IP headers', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
      });

      const headers = new Headers();
      const request = {
        headers,
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        nextUrl: new URL('http://localhost:3000/api/test'),
      } as NextRequest;

      rateLimiter(request);
      rateLimiter(request);

      const response = rateLimiter(request);
      expect(response.status).toBe(429);
    });

    it('should handle x-forwarded-for with multiple IPs (use first)', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
      });

      const headers = new Headers();
      headers.set('x-forwarded-for', '1.2.3.4, 5.6.7.8, 9.10.11.12');

      const request = {
        headers,
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        nextUrl: new URL('http://localhost:3000/api/test'),
      } as NextRequest;

      rateLimiter(request);
      rateLimiter(request);

      // Should be rate limited for the first IP
      const response = rateLimiter(request);
      expect(response.status).toBe(429);
    });

    it('should decrement remaining count correctly', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const request = createMockRequest('1.2.3.9');

      for (let i = 0; i < 5; i++) {
        const response = rateLimiter(request);
        const remaining = parseInt(
          response.headers.get('X-RateLimit-Remaining') || '0',
          10,
        );
        expect(remaining).toBe(4 - i);
      }
    });
  });

  describe('pre-configured rate limiters', () => {
    describe('apiRateLimit', () => {
      it('should have correct configuration (100 requests per minute)', () => {
        const request = createMockRequest('unique-test-ip-100');

        // Make 100 requests
        for (let i = 0; i < 100; i++) {
          const response = apiRateLimit(request);
          expect(response.status).not.toBe(429);
        }

        // 101st request should be blocked
        const blockedResponse = apiRateLimit(request);
        expect(blockedResponse.status).toBe(429);
      });

      it('should reset after 1 minute', () => {
        const request = createMockRequest('10.0.0.2');

        // Consume limit
        for (let i = 0; i < 100; i++) {
          apiRateLimit(request);
        }

        const blocked = apiRateLimit(request);
        expect(blocked.status).toBe(429);

        // Advance time by 61 seconds
        vi.advanceTimersByTime(61000);

        // Should allow requests again
        const allowed = apiRateLimit(request);
        expect(allowed.status).not.toBe(429);
      });
    });

    describe('authRateLimit', () => {
      it('should have stricter limits (5 requests per 15 minutes)', () => {
        const request = createMockRequest('10.0.1.1');

        // Make 5 requests
        for (let i = 0; i < 5; i++) {
          const response = authRateLimit(request);
          expect(response.status).not.toBe(429);
        }

        // 6th request should be blocked
        const blockedResponse = authRateLimit(request);
        expect(blockedResponse.status).toBe(429);
      });

      it('should have 15-minute window', () => {
        const request = createMockRequest('10.0.1.2');

        // Consume limit
        for (let i = 0; i < 5; i++) {
          authRateLimit(request);
        }

        const blocked = authRateLimit(request);
        expect(blocked.status).toBe(429);

        // Advance time by 16 minutes
        vi.advanceTimersByTime(16 * 60 * 1000);

        // Should allow requests again
        const allowed = authRateLimit(request);
        expect(allowed.status).not.toBe(429);
      });
    });

    describe('chatRateLimit', () => {
      it('should allow 20 requests per minute', () => {
        const request = createMockRequest('10.0.2.1');

        // Make 20 requests
        for (let i = 0; i < 20; i++) {
          const response = chatRateLimit(request);
          expect(response.status).not.toBe(429);
        }

        // 21st request should be blocked
        const blockedResponse = chatRateLimit(request);
        expect(blockedResponse.status).toBe(429);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive requests', () => {
      const rateLimiter = createRateLimit({
        windowMs: 1000,
        maxRequests: 10,
      });

      const request = createMockRequest('10.0.3.1');
      const results = [];

      for (let i = 0; i < 15; i++) {
        const response = rateLimiter(request);
        results.push(response.status);
      }

      const successCount = results.filter((status) => status !== 429).length;
      const blockedCount = results.filter((status) => status === 429).length;

      expect(successCount).toBe(10);
      expect(blockedCount).toBe(5);
    });

    it('should handle concurrent requests from same IP', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const request = createMockRequest('10.0.3.2');
      const responses = [];

      // Simulate concurrent requests
      for (let i = 0; i < 10; i++) {
        responses.push(rateLimiter(request));
      }

      const allowedCount = responses.filter((r) => r.status !== 429).length;
      expect(allowedCount).toBe(5);
    });

    it('should handle very short windows', () => {
      const rateLimiter = createRateLimit({
        windowMs: 100, // 100ms window
        maxRequests: 2,
      });

      const request = createMockRequest('10.0.3.3');

      rateLimiter(request);
      rateLimiter(request);

      const blocked = rateLimiter(request);
      expect(blocked.status).toBe(429);

      // Advance past the short window
      vi.advanceTimersByTime(150);

      const allowed = rateLimiter(request);
      expect(allowed.status).not.toBe(429);
    });

    it('should handle very high limits', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 10000,
      });

      const request = createMockRequest('10.0.3.4');

      // Make many requests
      for (let i = 0; i < 100; i++) {
        const response = rateLimiter(request);
        expect(response.status).not.toBe(429);
      }
    });

    it('should handle limit of 1', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
      });

      const request = createMockRequest('10.0.3.5');

      const first = rateLimiter(request);
      expect(first.status).not.toBe(429);

      const second = rateLimiter(request);
      expect(second.status).toBe(429);
    });
  });

  describe('header values', () => {
    it('should provide accurate reset time', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const request = createMockRequest('10.0.4.1');
      const now = Date.now();

      const response = rateLimiter(request);
      const resetTime = parseInt(
        response.headers.get('X-RateLimit-Reset') || '0',
        10,
      );

      expect(resetTime).toBeGreaterThanOrEqual(now);
      expect(resetTime).toBeLessThanOrEqual(now + 60000);
    });

    it('should update remaining count in headers', () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 3,
      });

      const request = createMockRequest('10.0.4.2');

      const responses = [
        rateLimiter(request),
        rateLimiter(request),
        rateLimiter(request),
      ];

      expect(responses[0].headers.get('X-RateLimit-Remaining')).toBe('2');
      expect(responses[1].headers.get('X-RateLimit-Remaining')).toBe('1');
      expect(responses[2].headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });

  describe('response body', () => {
    it('should return proper error structure when rate limited', async () => {
      const rateLimiter = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
      });

      const request = createMockRequest('10.0.5.1');

      rateLimiter(request); // Use up the limit
      const blockedResponse = rateLimiter(request);

      const body = await blockedResponse.json();

      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Too many requests');
      expect(body).toHaveProperty('retryAfter');
      expect(typeof body.retryAfter).toBe('number');
      expect(body.retryAfter).toBeGreaterThan(0);
    });

    it('should calculate retryAfter correctly', async () => {
      const windowMs = 60000;
      const rateLimiter = createRateLimit({
        windowMs,
        maxRequests: 1,
      });

      const request = createMockRequest('10.0.5.2');

      rateLimiter(request);

      // Advance time a bit
      vi.advanceTimersByTime(10000);

      const blockedResponse = rateLimiter(request);
      const body = await blockedResponse.json();

      // retryAfter should be approximately 50 seconds (60 - 10)
      expect(body.retryAfter).toBeGreaterThan(45);
      expect(body.retryAfter).toBeLessThanOrEqual(51);
    });
  });
});
