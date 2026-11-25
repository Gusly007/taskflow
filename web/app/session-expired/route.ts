// lib/api.ts sends here when the API answers 401 to a logged-in user.
// A Route Handler can delete the cookie, which a Server Component can't.
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login?expired=1', request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
