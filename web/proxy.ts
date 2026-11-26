// Runs before every page (Next 16 renamed middleware.ts to proxy.ts).
// Optimistic check only: it reads the cookie, it doesn't ask the API. lib/dal.ts is the real guard.
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, decodeSession } from '@/lib/session';

const PROTECTED_PREFIXES = ['/tasks'];
const AUTH_PAGES = ['/login', '/register'];

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (isProtected && !session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname + search); // come back here after logging in
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && session) {
    return NextResponse.redirect(new URL('/tasks', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next's own files and anything with an extension (favicon.ico, images...).
  matcher: ['/((?!_next/static|_next/image|session-expired|.*\\..*).*)'],
};
