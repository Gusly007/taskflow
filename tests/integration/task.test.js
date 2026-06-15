const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/db');
const { createUser, createTask } = require('../helpers');

let token;
let userId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true });
  const user = await createUser();
  token = user.token;
  userId = user.userId;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('Task API', () => {
  const validTask = { title: 'Test Task', description: 'A test description', status: 'todo' };

  // ==================== CREATE ====================

  describe('POST /api/tasks', () => {
    it('creates a task and assigns userId from token', async () => {
      const res = await request(app).post('/api/tasks').set(auth()).send(validTask);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(validTask.title);
      expect(res.body.data.description).toBe(validTask.description);
      expect(res.body.data.status).toBe('todo');
      expect(res.body.data.userId).toBe(userId);
    });

    it('returns 400 if title is missing', async () => {
      const res = await request(app).post('/api/tasks').set(auth()).send({ description: 'No title' });

      expect(res.status).toBe(400);
    });

    it('returns 400 if status is invalid', async () => {
      const res = await request(app).post('/api/tasks').set(auth()).send({ title: 'Task', status: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/tasks').send(validTask);

      expect(res.status).toBe(401);
    });
  });

  // ==================== GET ALL ====================

  describe('GET /api/tasks', () => {
    it('returns owned tasks', async () => {
      await createTask(token, { title: 'Task 1' });
      await createTask(token, { title: 'Task 2' });

      const res = await request(app).get('/api/tasks').set(auth());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('returns empty array when user has no tasks', async () => {
      const res = await request(app).get('/api/tasks').set(auth());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('returns collaborated tasks alongside owned tasks', async () => {
      const user2 = await createUser({ email: 'user2@test.com' });
      const task = await createTask(user2.token, { title: 'User2 Task' });

      await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ userId, role: 'viewer' });

      const res = await request(app).get('/api/tasks').set(auth());

      expect(res.status).toBe(200);
      expect(res.body.data.some((t) => t.id === task.id)).toBe(true);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/tasks');

      expect(res.status).toBe(401);
    });
  });

  // ==================== GET MINE ====================

  describe('GET /api/tasks/mine', () => {
    it('returns only owned tasks, not collaborated ones', async () => {
      const ownedTask = await createTask(token, { title: 'My Task' });

      const user2 = await createUser({ email: 'user2@test.com' });
      const collaboratedTask = await createTask(user2.token, { title: 'User2 Task' });

      await request(app)
        .post(`/api/tasks/${collaboratedTask.id}/collaborators`)
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ userId, role: 'viewer' });

      const res = await request(app).get('/api/tasks/mine').set(auth());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(ownedTask.id);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/tasks/mine');

      expect(res.status).toBe(401);
    });
  });

  // ==================== GET BY ID ====================

  describe('GET /api/tasks/:id', () => {
    it('returns task for owner', async () => {
      const task = await createTask(token);

      const res = await request(app).get(`/api/tasks/${task.id}`).set(auth());

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(task.title);
    });

    it('returns task for collaborator (viewer)', async () => {
      const user2 = await createUser({ email: 'user2@test.com' });
      const task = await createTask(user2.token);

      await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ userId, role: 'viewer' });

      const res = await request(app).get(`/api/tasks/${task.id}`).set(auth());

      expect(res.status).toBe(200);
    });

    it('returns 404 if task does not exist', async () => {
      const res = await request(app).get('/api/tasks/99999').set(auth());

      expect(res.status).toBe(404);
    });

    it('returns 403 if user has no access', async () => {
      const user2 = await createUser({ email: 'user2@test.com' });
      const task = await createTask(user2.token);

      const res = await request(app).get(`/api/tasks/${task.id}`).set(auth());

      expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
      const task = await createTask(token);
      const res = await request(app).get(`/api/tasks/${task.id}`);

      expect(res.status).toBe(401);
    });
  });

  // ==================== UPDATE ====================

  describe('PUT /api/tasks/:id', () => {
    it('allows owner to update', async () => {
      const task = await createTask(token);

      const res = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set(auth())
        .send({ title: 'Updated Title', status: 'done' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.status).toBe('done');
    });

    it('allows editor collaborator to update', async () => {
      const user2 = await createUser({ email: 'user2@test.com' });
      const task = await createTask(user2.token);

      await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ userId, role: 'editor' });

      const res = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set(auth())
        .send({ title: 'Edited by collaborator' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Edited by collaborator');
    });

    it('returns 403 for viewer collaborator trying to update', async () => {
      const user2 = await createUser({ email: 'user2@test.com' });
      const task = await createTask(user2.token);

      await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ userId, role: 'viewer' });

      const res = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set(auth())
        .send({ title: 'Attempt' });

      expect(res.status).toBe(403);
    });

    it('returns 403 if user has no access', async () => {
      const user2 = await createUser({ email: 'user2@test.com' });
      const task = await createTask(user2.token);

      const res = await request(app).put(`/api/tasks/${task.id}`).set(auth()).send({ title: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('returns 404 if task does not exist', async () => {
      const res = await request(app).put('/api/tasks/99999').set(auth()).send({ title: 'Nope' });

      expect(res.status).toBe(404);
    });

    it('returns 400 if title is empty string', async () => {
      const task = await createTask(token);

      const res = await request(app).put(`/api/tasks/${task.id}`).set(auth()).send({ title: '' });

      expect(res.status).toBe(400);
    });
  });

  // ==================== DELETE ====================

  describe('DELETE /api/tasks/:id', () => {
    it('allows owner to delete', async () => {
      const task = await createTask(token);

      const res = await request(app).delete(`/api/tasks/${task.id}`).set(auth());
      expect(res.status).toBe(204);

      const check = await request(app).get(`/api/tasks/${task.id}`).set(auth());
      expect(check.status).toBe(404);
    });

    it('returns 403 for collaborator trying to delete', async () => {
      const user2 = await createUser({ email: 'user2@test.com' });
      const task = await createTask(user2.token);

      await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ userId, role: 'editor' });

      const res = await request(app).delete(`/api/tasks/${task.id}`).set(auth());

      expect(res.status).toBe(403);
    });

    it('returns 403 if user has no access', async () => {
      const user2 = await createUser({ email: 'user2@test.com' });
      const task = await createTask(user2.token);

      const res = await request(app).delete(`/api/tasks/${task.id}`).set(auth());

      expect(res.status).toBe(403);
    });

    it('returns 404 if task does not exist', async () => {
      const res = await request(app).delete('/api/tasks/99999').set(auth());

      expect(res.status).toBe(404);
    });
  });
});
