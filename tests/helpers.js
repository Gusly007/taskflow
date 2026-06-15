const request = require('supertest');
const app = require('../src/app');

const createUser = async (overrides = {}) => {
  const data = {
    name: 'Test User',
    email: 'test@test.com',
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(data);
  return { token: res.body.token, userId: res.body.user.id };
};

const createTask = async (token, overrides = {}) => {
  const data = { title: 'Test Task', ...overrides };
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
  return res.body.data;
};

module.exports = { createUser, createTask };
