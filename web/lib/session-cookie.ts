import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, encodeSession, tokenExpiry, type Session } from './session';

// Only callable from Server Actions and Route Handlers: Server Components can't set cookies.
export async function createSession(session: Session): Promise<void> {
  const expiresAt = tokenExpiry(session.token);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await encodeSession(session, expiresAt), {
    httpOnly: true, // invisible to browser JavaScript, so an XSS can't steal the token
    secure: process.env.NODE_ENV === 'production', // https only (localhost is http)
    sameSite: 'lax', // not sent on cross-site POSTs (CSRF)
    expires: expiresAt,
    path: '/',
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
