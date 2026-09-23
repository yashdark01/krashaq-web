import { NextResponse, type NextRequest } from 'next/server';
import { isPublicRoute } from '@/lib/auth/route-access';

const accessCookie = 'access_token';
const sessionHintCookie = 'session_hint';
const previewAuthBypass = process.env.NODE_ENV !== 'production';

/**
 * Next 16 request-admission middleware. The Gateway still verifies JWT
 * signatures and active server sessions for every protected API request.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const publicRoute = isPublicRoute(pathname);
  const hasSession = previewAuthBypass || Boolean(
    request.cookies.get(accessCookie)?.value ||
    request.cookies.get(sessionHintCookie)?.value,
  );
  if (!hasSession && !publicRoute) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  if (hasSession && publicRoute)
    return NextResponse.redirect(new URL('/dashboard', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!v1(?:/|$)|_next/static|_next/image|favicon.ico).*)'],
};
