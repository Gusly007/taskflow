import 'dotenv/config';

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const PORT = Number(process.env.PORT) || 3000;
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = Number(process.env.DB_PORT) || 5432;
export const DB_NAME = process.env.DB_NAME || 'task_manager';
export const DB_USER = process.env.DB_USER || 'postgres';
export const DB_PASSWORD = required('DB_PASSWORD');
export const JWT_SECRET = required('JWT_SECRET');
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export const NODE_ENV = process.env.NODE_ENV || 'development';
// Max login/register attempts per IP and per window (failed logins only for /login).
export const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX) || 10;
export const AUTH_RATE_LIMIT_WINDOW_MINUTES = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES) || 15;
// Number of reverse proxies in front of the API (Render, Fly, nginx...). 0 = none.
// Needed so rate limiting sees the real client IP instead of the proxy's.
export const TRUST_PROXY = Number(process.env.TRUST_PROXY) || 0;
