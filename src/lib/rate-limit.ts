import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
}

/**
 * Creates a rate-limiting middleware configured with the provided window and quota.
 *
 * @param config - Rate limit settings. `windowMs` is the time window in milliseconds; `maxRequests` is the maximum requests allowed per client within that window.
 * @returns A middleware function that enforces per-client rate limits using an in-memory store. The middleware attaches `X-RateLimit-*` headers to successful responses and, when the quota is exceeded, returns a 429 JSON response containing `error` and `retryAfter` and sets `Retry-After` and rate-limit headers.
 */
export function createRateLimit(config: RateLimitConfig) {
  return function rateLimitMiddleware(request: NextRequest) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'anonymous';
    const now = Date.now();
    const windowMs = config.windowMs;
    const maxRequests = config.maxRequests;

    // Get or create rate limit entry for this IP
    let entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset existing one
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(ip, entry);
    }

    // Check if rate limit exceeded
    if (entry.count >= maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);

      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: resetIn,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': resetIn.toString(),
          },
        },
      );
    }

    // Increment counter
    entry.count++;

    // Create response with rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set(
      'X-RateLimit-Remaining',
      (maxRequests - entry.count).toString(),
    );
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    return response;
  };
}

// Pre-configured rate limiters for different use cases
export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
});

export const chatRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 chat requests per minute
});

// Cleanup old entries periodically (simple cleanup)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60 * 1000); // Cleanup every minute