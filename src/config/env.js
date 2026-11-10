require('dotenv').config();

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

module.exports = {
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'task_manager',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: required('DB_PASSWORD'),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Max login/register attempts per IP and per window (failed logins only for /login).
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  AUTH_RATE_LIMIT_WINDOW_MINUTES: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES) || 15,
  // Number of reverse proxies in front of the API (Render, Fly, nginx...). 0 = none.
  // Needed so rate limiting sees the real client IP instead of the proxy's.
  TRUST_PROXY: Number(process.env.TRUST_PROXY) || 0,
};
