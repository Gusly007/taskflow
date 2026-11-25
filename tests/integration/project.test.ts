import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/db';
import { migrator } from '../../src/db/migrator';
import { createUser, createTask, type TaskJson, type TestUser } from '../helpers';

interface ProjectJson {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  role: string;
}

let owner: TestUser;
let editor: TestUser;
let viewer: TestUser;
let outsider: TestUser;
let project: ProjectJson;

beforeAll(async () => {
  await migrator.up();
});

afterAll(async () => {
  await sequelize.close();
});

const auth = (user: TestUser) => ({ Authorization: `Bearer ${user.token}` });

const createProject = async (user: TestUser, data: Record<string, unknown> = {}): Promise<ProjectJson> => {
  const res = await request(app)
    .post('/api/projects')
    .set(auth(user))
    .send({ name: 'Website', ...data });
  return res.body.data;
};

const addMember = (projectId: number, user: TestUser, role: string, as: TestUser = owner) =>
  request(app).post(`/api/projects/${projectId}/members`).set(auth(as)).send({ userId: user.userId, role });

const listTaskTitles = async (user: TestUser, query = ''): Promise<string[]> => {
  const res = await request(app).get(`/api/tasks${query}`).set(auth(user));
  return (res.body.data as TaskJson[]).map((t) => t.title).sort();
};

beforeEach(async () => {
  await sequelize.truncate({ cascade: true });
  owner = await createUser({ email: 'owner@test.com' });
  editor = await createUser({ email: 'editor@test.com' });
  viewer = await createUser({ email: 'viewer@test.com' });
  outsider = await createUser({ email: 'outsider@test.com' });
  project = await createProject(owner, { description: 'New landing page' });
  await addMember(project.id, editor, 'editor');
  await addMember(project.id, viewer, 'viewer');
});

describe('Projects API', () => {
  // ==================== PROJECT CRUD ====================

  describe('POST /api/projects', () => {
    it('creates a project owned by the caller', async () => {
      const res = await request(app).post('/api/projects').set(auth(outsider)).send({ name: '  Mobile app  ' });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ name: 'Mobile app', description: null, ownerId: outsider.userId, role: 'owner' });
    });

    it('ignores an ownerId sent by the client', async () => {
      const res = await request(app).post('/api/projects').set(auth(outsider)).send({ name: 'X', ownerId: owner.userId });

      expect(res.body.data.ownerId).toBe(outsider.userId);
    });

    it('requires a name (400)', async () => {
      const res = await request(app).post('/api/projects').set(auth(owner)).send({ name: '  ' });

      expect(res.status).toBe(400);
    });

    it('requires authentication (401)', async () => {
      const res = await request(app).post('/api/projects').send({ name: 'X' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/projects', () => {
    it('lists owned and joined projects with the caller role', async () => {
      await createProject(editor, { name: 'Editor own project' });

      const res = await request(app).get('/api/projects').set(auth(editor));

      expect(res.status).toBe(200);
      const roles = Object.fromEntries((res.body.data as ProjectJson[]).map((p) => [p.name, p.role]));
      expect(roles).toEqual({ Website: 'editor', 'Editor own project': 'owner' });
    });

    it('returns an empty list for a user in no project', async () => {
      const res = await request(app).get('/api/projects').set(auth(outsider));

      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('is visible to a viewer, with their role', async () => {
      const res = await request(app).get(`/api/projects/${project.id}`).set(auth(viewer));

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('viewer');
    });

    it('returns 404 to an outsider', async () => {
      const res = await request(app).get(`/api/projects/${project.id}`).set(auth(outsider));

      expect(res.status).toBe(404);
    });

    it('returns 400 for a non-numeric id', async () => {
      const res = await request(app).get('/api/projects/abc').set(auth(owner));

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('lets the owner rename the project', async () => {
      const res = await request(app).put(`/api/projects/${project.id}`).set(auth(owner)).send({ name: 'Site v2' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Site v2');
    });

    it('refuses an editor (403)', async () => {
      const res = await request(app).put(`/api/projects/${project.id}`).set(auth(editor)).send({ name: 'Mine' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('deletes the project but keeps its tasks as personal tasks', async () => {
      const task = await createTask(editor.token, { title: 'In project', projectId: project.id });

      const res = await request(app).delete(`/api/projects/${project.id}`).set(auth(owner));

      expect(res.status).toBe(204);
      const after = await request(app).get(`/api/tasks/${task.id}`).set(auth(editor));
      expect(after.status).toBe(200);
      expect(after.body.data.projectId).toBeNull();
      // The project owner no longer sees it.
      const ownerView = await request(app).get(`/api/tasks/${task.id}`).set(auth(owner));
      expect(ownerView.status).toBe(404);
    });

    it('refuses a member (403)', async () => {
      const res = await request(app).delete(`/api/projects/${project.id}`).set(auth(editor));

      expect(res.status).toBe(403);
    });
  });

  // ==================== MEMBERS ====================

  describe('members', () => {
    it('lists members for any member', async () => {
      const res = await request(app).get(`/api/projects/${project.id}/members`).set(auth(viewer));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.map((m: { role: string }) => m.role).sort()).toEqual(['editor', 'viewer']);
    });

    it('returns 404 to an outsider listing members', async () => {
      const res = await request(app).get(`/api/projects/${project.id}/members`).set(auth(outsider));

      expect(res.status).toBe(404);
    });

    it('defaults the role to viewer', async () => {
      const res = await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set(auth(owner))
        .send({ userId: outsider.userId });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('viewer');
    });

    it('refuses a duplicate member (409), the owner (400), an unknown user (404), a bad role (400)', async () => {
      expect((await addMember(project.id, editor, 'viewer')).status).toBe(409);
      expect((await addMember(project.id, owner, 'viewer')).status).toBe(400);
      const unknown = await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set(auth(owner))
        .send({ userId: 99999 });
      expect(unknown.status).toBe(404);
      expect((await addMember(project.id, outsider, 'owner')).status).toBe(400);
    });

    it('only the owner adds members (403 for an editor)', async () => {
      const res = await addMember(project.id, outsider, 'viewer', editor);

      expect(res.status).toBe(403);
    });

    it('owner changes a member role', async () => {
      const res = await request(app)
        .patch(`/api/projects/${project.id}/members/${viewer.userId}`)
        .set(auth(owner))
        .send({ role: 'editor' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('editor');
    });

    it('returns 404 when changing the role of a non-member', async () => {
      const res = await request(app)
        .patch(`/api/projects/${project.id}/members/${outsider.userId}`)
        .set(auth(owner))
        .send({ role: 'editor' });

      expect(res.status).toBe(404);
    });

    it('owner removes a member, who then loses access', async () => {
      const res = await request(app).delete(`/api/projects/${project.id}/members/${viewer.userId}`).set(auth(owner));

      expect(res.status).toBe(200);
      const after = await request(app).get(`/api/projects/${project.id}`).set(auth(viewer));
      expect(after.status).toBe(404);
    });

    it('a member can leave the project', async () => {
      const res = await request(app).delete(`/api/projects/${project.id}/members/${viewer.userId}`).set(auth(viewer));

      expect(res.status).toBe(200);
    });

    it('a member cannot remove someone else (403)', async () => {
      const res = await request(app).delete(`/api/projects/${project.id}/members/${viewer.userId}`).set(auth(editor));

      expect(res.status).toBe(403);
    });

    it('the owner cannot leave their own project (400)', async () => {
      const res = await request(app).delete(`/api/projects/${project.id}/members/${owner.userId}`).set(auth(owner));

      expect(res.status).toBe(400);
    });
  });

  // ==================== TASKS IN PROJECTS ====================

  describe('tasks in a project', () => {
    let projectTask: TaskJson;

    beforeEach(async () => {
      projectTask = await createTask(owner.token, { title: 'Project task', projectId: project.id });
      await createTask(owner.token, { title: 'Owner personal task' });
    });

    it('GET /api/tasks returns the project tasks to every member, not the personal ones', async () => {
      await createTask(viewer.token, { title: 'Viewer personal task' });

      expect(await listTaskTitles(viewer)).toEqual(['Project task', 'Viewer personal task']);
      expect(await listTaskTitles(editor)).toEqual(['Project task']);
      expect(await listTaskTitles(outsider)).toEqual([]);
    });

    it('GET /api/tasks/mine still returns only owned tasks', async () => {
      const res = await request(app).get('/api/tasks/mine').set(auth(viewer));

      expect(res.body.data).toEqual([]);
    });

    it('?projectId filters on one project', async () => {
      expect(await listTaskTitles(owner, `?projectId=${project.id}`)).toEqual(['Project task']);
    });

    it('?projectId on a project the user is not in returns 404', async () => {
      const res = await request(app).get(`/api/tasks?projectId=${project.id}`).set(auth(outsider));

      expect(res.status).toBe(404);
    });

    it('?projectId must be a positive integer (400)', async () => {
      const res = await request(app).get('/api/tasks?projectId=abc').set(auth(owner));

      expect(res.status).toBe(400);
    });

    it('a project viewer sees the task but cannot edit it', async () => {
      const get = await request(app).get(`/api/tasks/${projectTask.id}`).set(auth(viewer));
      const put = await request(app).put(`/api/tasks/${projectTask.id}`).set(auth(viewer)).send({ status: 'done' });

      expect(get.status).toBe(200);
      expect(put.status).toBe(403);
    });

    it('a project editor edits the task but cannot delete it', async () => {
      const put = await request(app).put(`/api/tasks/${projectTask.id}`).set(auth(editor)).send({ status: 'done' });
      const del = await request(app).delete(`/api/tasks/${projectTask.id}`).set(auth(editor));

      expect(put.status).toBe(200);
      expect(put.body.data.status).toBe('done');
      expect(del.status).toBe(403);
    });

    it('an outsider gets 404 on a project task', async () => {
      const res = await request(app).get(`/api/tasks/${projectTask.id}`).set(auth(outsider));

      expect(res.status).toBe(404);
    });

    it('an editor creates a task in the project, a viewer cannot (403), an outsider gets 404', async () => {
      const ok = await request(app).post('/api/tasks').set(auth(editor)).send({ title: 'By editor', projectId: project.id });
      const ko = await request(app).post('/api/tasks').set(auth(viewer)).send({ title: 'By viewer', projectId: project.id });
      const nf = await request(app).post('/api/tasks').set(auth(outsider)).send({ title: 'By outsider', projectId: project.id });

      expect(ok.status).toBe(201);
      expect(ok.body.data).toMatchObject({ projectId: project.id, userId: editor.userId });
      expect(ko.status).toBe(403);
      expect(nf.status).toBe(404);
    });

    it('a task without projectId is personal (projectId null)', async () => {
      const res = await request(app).post('/api/tasks').set(auth(owner)).send({ title: 'Solo' });

      expect(res.body.data.projectId).toBeNull();
    });

    it('the task owner can move a task out of the project and back', async () => {
      const out = await request(app).put(`/api/tasks/${projectTask.id}`).set(auth(owner)).send({ projectId: null });
      expect(out.status).toBe(200);
      expect(out.body.data.projectId).toBeNull();
      expect(await listTaskTitles(viewer)).toEqual([]);

      const back = await request(app).put(`/api/tasks/${projectTask.id}`).set(auth(owner)).send({ projectId: project.id });
      expect(back.body.data.projectId).toBe(project.id);
    });

    it('a project editor cannot move a task out of the project (403)', async () => {
      const res = await request(app).put(`/api/tasks/${projectTask.id}`).set(auth(editor)).send({ projectId: null });

      expect(res.status).toBe(403);
    });

    it('cannot move a task into a project where the owner is only a viewer (403)', async () => {
      const other = await createProject(editor, { name: 'Other' });
      await addMember(other.id, owner, 'viewer', editor);

      const res = await request(app).put(`/api/tasks/${projectTask.id}`).set(auth(owner)).send({ projectId: other.id });

      expect(res.status).toBe(403);
    });

    it('a removed member no longer sees the project tasks', async () => {
      await request(app).delete(`/api/projects/${project.id}/members/${viewer.userId}`).set(auth(owner));

      expect(await listTaskTitles(viewer)).toEqual([]);
      const res = await request(app).get(`/api/tasks/${projectTask.id}`).set(auth(viewer));
      expect(res.status).toBe(404);
    });
  });
});
