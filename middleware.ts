import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { aj } from '@/lib/arcjet';

/**
 * Apply Arcjet protection, enforce session-based access for protected routes, and attach security headers to the response.
 *
 * @returns A NextResponse that is either:
 * - a 403 JSON response with `{ error: 'Access denied' }` when Arcjet denies the request,
 * - a redirect to `/` for unauthenticated requests to protected routes (paths starting with `/dashboard`),
 * - or a forwarded response (`NextResponse.next()`) with security headers set (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
 */
export async function middleware(request: NextRequest) {
  // Apply Arcjet protection to all requests
  const decision = await aj.protect(request);

  if (decision.isDenied()) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Handle authentication for protected routes
  const sessionCookie = getSessionCookie(request);
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Add security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};