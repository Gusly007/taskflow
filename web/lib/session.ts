// The session cookie: holds the API's JWT and the logged-in user, signed with SESSION_SECRET.
// No 'server-only' import here because proxy.ts uses decodeSession too; the parts that
// touch cookies live in session-cookie.ts and dal.ts.
import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import type { User } from '@/features/auth/auth.types';

export const SESSION_COOKIE = 'taskflow_session';

export interface Session {
  token: string; // the API's JWT, sent as "Authorization: Bearer" by lib/api.ts
  user: User;
}

const secretKey = (): Uint8Array => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('Missing required environment variable: SESSION_SECRET');
  return new TextEncoder().encode(secret);
};

// The session must not outlive the API token: read the token's own "exp" (no need to verify it,
// the API does that on every request).
export const tokenExpiry = (token: string): Date => {
  const { exp } = decodeJwt(token);
  return exp ? new Date(exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
};

export const encodeSession = (session: Session, expiresAt: Date): Promise<string> =>
  new SignJWT({ token: session.token, user: session.user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());

// Returns null for a missing, tampered or expired cookie.
export const decodeSession = async (value: string | undefined): Promise<Session | null> => {
  if (!value) return null;
  try {
    const { payload } = await jwtVerify<Session>(value, secretKey(), { algorithms: ['HS256'] });
    return { token: payload.token, user: payload.user };
  } catch {
    return null;
  }
};
