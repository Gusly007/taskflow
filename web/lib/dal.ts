// Data Access Layer: the one place that decides who is logged in.
// cache() runs it once per request even if the layout, the page and lib/api.ts all call it.
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, decodeSession, type Session } from './session';

export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
});

// For pages and actions that need a user: sends visitors to /login.
// proxy.ts already redirects, but it is only an optimistic check: this one is the real guard.
export const verifySession = cache(async (): Promise<Session> => {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
});
