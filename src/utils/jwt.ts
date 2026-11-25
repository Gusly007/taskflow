import jwt, { type SignOptions } from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env';

// What we put in the token, and what req.user contains after authMiddleware.
export interface TokenPayload {
  id: number;
}

export const generateToken = (payload: TokenPayload): string =>
  // The env var is a plain string ("1d", "12h"...); jsonwebtoken types only accept a known format.
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] });

// Throws if the token is invalid or expired, or was not issued by generateToken.
export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string' || typeof decoded.id !== 'number') {
    throw new Error('Invalid token payload');
  }
  return { id: decoded.id };
};
