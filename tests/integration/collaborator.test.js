const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/db');
const { createUser, createTask } = require('../helpers');

let owner, ownerToken, collaboratorUser, collaboratorToken, task;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true });

  owner = await createUser({ email: 'owner@test.com' });
  ownerToken = owner.token;

  collaboratorUser = await createUser({ email: 'collab@test.com' });
  collaboratorToken = collaboratorUser.token;

  task = await createTask(ownerToken, { title: 'Shared Task' });
});

const ownerAuth = () => ({ Authorization: `Bearer ${ownerToken}` });
const collabAuth = () => ({ Authorization: `Bearer ${collaboratorToken}` });

describe('Collaborator API', () => {

  // ==================== ADD ====================

  describe('POST /api/tasks/:id/collaborators', () => {
    it('owner adds a viewer collaborator', async () => {
      const res = await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ userId: collaboratorUser.userId, role: 'viewer' });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('viewer');
      expect(res.body.data.userId).toBe(collaboratorUser.userId);
    });

    it('owner adds an editor collaborator', async () => {
      const res = await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ userId: collaboratorUser.userId, role: 'editor' });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('editor');
    });

    it('defaults to viewer if role is not specified', async () => {
      const res = await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ userId: collaboratorUser.userId });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('viewer');
    });

    it('returns 403 if non-owner tries to add collaborator', async () => {
      const res = await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(collabAuth())
        .send({ userId: collaboratorUser.userId, role: 'viewer' });

      expect(res.status).toBe(403);
    });

    it('returns 400 if owner tries to add themselves', async () => {
      const res = await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ userId: owner.userId, role: 'viewer' });

      expect(res.status).toBe(400);
    });

    it('returns 409 if user is already a collaborator', async () => {
      await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ userId: collaboratorUser.userId, role: 'viewer' });

      const res = await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ userId: collaboratorUser.userId, role: 'editor' });

      expect(res.status).toBe(409);
    });

    it('returns 400 if userId is missing', async () => {
      const res = await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ role: 'viewer' });

      expect(res.status).toBe(400);
    });

    it('returns 400 if role is invalid', async () => {
      const res = await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ userId: collaboratorUser.userId, role: 'admin' });

      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .send({ userId: collaboratorUser.userId });

      expect(res.status).toBe(401);
    });
  });

  // ==================== LIST ====================

  describe('GET /api/tasks/:id/collaborators', () => {
    it('returns list of collaborators', async () => {
      await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ userId: collaboratorUser.userId, role: 'viewer' });

      const res = await request(app).get(`/api/tasks/${task.id}/collaborators`).set(ownerAuth());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].userId).toBe(collaboratorUser.userId);
    });

    it('returns empty array when no collaborators', async () => {
      const res = await request(app).get(`/api/tasks/${task.id}/collaborators`).set(ownerAuth());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get(`/api/tasks/${task.id}/collaborators`);

      expect(res.status).toBe(401);
    });
  });

  // ==================== UPDATE ROLE ====================

  describe('PATCH /api/tasks/:id/collaborators/:userId', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ userId: collaboratorUser.userId, role: 'viewer' });
    });

    it('owner changes collaborator role from viewer to editor', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task.id}/collaborators/${collaboratorUser.userId}`)
        .set(ownerAuth())
        .send({ role: 'editor' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('editor');
    });

    it('returns 403 if non-owner tries to update role', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task.id}/collaborators/${collaboratorUser.userId}`)
        .set(collabAuth())
        .send({ role: 'editor' });

      expect(res.status).toBe(403);
    });

    it('returns 404 if collaborator does not exist', async () => {
      const stranger = await createUser({ email: 'stranger@test.com' });

      const res = await request(app)
        .patch(`/api/tasks/${task.id}/collaborators/${stranger.userId}`)
        .set(ownerAuth())
        .send({ role: 'editor' });

      expect(res.status).toBe(404);
    });

    it('returns 400 if role is invalid', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task.id}/collaborators/${collaboratorUser.userId}`)
        .set(ownerAuth())
        .send({ role: 'superuser' });

      expect(res.status).toBe(400);
    });
  });

  // ==================== REMOVE ====================

  describe('DELETE /api/tasks/:id/collaborators/:userId', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/tasks/${task.id}/collaborators`)
        .set(ownerAuth())
        .send({ userId: collaboratorUser.userId, role: 'viewer' });
    });

    it('owner removes a collaborator', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${task.id}/collaborators/${collaboratorUser.userId}`)
        .set(ownerAuth());

      expect(res.status).toBe(200);

      const list = await request(app).get(`/api/tasks/${task.id}/collaborators`).set(ownerAuth());
      expect(list.body.data).toHaveLength(0);
    });

    it('returns 403 if non-owner tries to remove a collaborator', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${task.id}/collaborators/${collaboratorUser.userId}`)
        .set(collabAuth());

      expect(res.status).toBe(403);
    });

    it('returns 404 if collaborator does not exist', async () => {
      const stranger = await createUser({ email: 'stranger@test.com' });

      const res = await request(app)
        .delete(`/api/tasks/${task.id}/collaborators/${stranger.userId}`)
        .set(ownerAuth());

      expect(res.status).toBe(404);
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${task.id}/collaborators/${collaboratorUser.userId}`);

      expect(res.status).toBe(401);
    });
  });
});
