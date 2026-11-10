process.env.NODE_ENV = 'test';
process.env.DB_PASSWORD = 'test-password-not-used-in-sqlite';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
// Tests create many users: keep the auth rate limit out of the way (rateLimit.test.js lowers it).
process.env.AUTH_RATE_LIMIT_MAX = '10000';
