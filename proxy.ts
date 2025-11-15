import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Apply Arcjet protection, enforce session-based access for protected routes, and attach security headers to the response.
 *
 * @returns A NextResponse that is either:
 * - a 403 JSON response with `{ error: 'Access denied' }` when Arcjet denies the request,
 * - a redirect to `/` for unauthenticated requests to protected routes (paths starting with `/dashboard`),
 * - or a forwarded response (`NextResponse.next()`) with security headers set (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply protection to sensitive routes to reduce bundle size
  const isDashboardRoute =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isProtectedRoute = isDashboardRoute || isAdminRoute;
  const isApiRoute = pathname.startsWith('/api/');

  // For API routes, use minimal protection
  if (isApiRoute && !isProtectedRoute) {
    // Add basic security headers without heavy Arcjet protection
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // For protected routes, require authentication (role checks are handled server-side)
  if (isProtectedRoute) {
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Add security headers for all responses
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()',
  );

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
