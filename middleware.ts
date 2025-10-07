import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { aj } from '@/lib/arcjet';

/**
 * Middleware that enforces Arcjet access control, requires a session for /dashboard routes, and attaches security headers to responses.
 *
 * If Arcjet denies the request, responds with a 403 JSON body `{ error: 'Access denied' }`. If the request targets a `/dashboard` route and no session cookie is present, redirects to `/`. Otherwise returns the response for the request with the following headers set: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: geolocation=(), microphone=(), camera=()`.
 *
 * @returns A NextResponse that is either a 403 JSON error, a redirect to `/`, or the original response augmented with security headers.
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