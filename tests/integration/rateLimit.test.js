// Lower the limit for this file only (env.js reads it when the app is loaded below).
process.env.AUTH_RATE_LIMIT_MAX = '3';

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/db');
const { migrator } = require('../../src/db/migrator');

const user = { name: 'Jean', email: 'jean@test.com', password: 'password123' };
const login = (password) => request(app).post('/api/auth/login').send({ email: user.email, password });

beforeAll(async () => {
  await migrator.up();
  await request(app).post('/api/auth/register').send(user); // 1st of 3 allowed registrations
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth rate limiting', () => {
  it('successful logins are not counted', async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await login(user.password);
      expect(res.status).toBe(200);
    }
  });

  it('blocks the IP with 429 after 3 failed logins, even with the right password', async () => {
    for (let i = 0; i < 3; i += 1) {
      const res = await login('wrong-password');
      expect(res.status).toBe(401);
    }

    const blocked = await login('wrong-password');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({
      status: 'error',
      statusCode: 429,
      message: 'Too many attempts, please try again later',
    });
    expect(blocked.headers).toHaveProperty('ratelimit');

    const evenGood = await login(user.password);
    expect(evenGood.status).toBe(429);
  });

  it('limits registrations per IP', async () => {
    const register = (n) =>
      request(app).post('/api/auth/register').send({ ...user, email: `spam${n}@test.com` });

    expect((await register(1)).status).toBe(201);
    expect((await register(2)).status).toBe(201);
    expect((await register(3)).status).toBe(429);
  });
});
