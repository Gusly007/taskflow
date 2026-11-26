import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/db';
import { migrator } from '../../src/db/migrator';
import { createUser, createTask, type TaskJson, type TestUser } from '../helpers';

// Every task the API sends carries the caller's `role` on it and `isOverdue`,
// so the front can show or hide actions without re-implementing the rules.

type TaskView = TaskJson & { role: string; isOverdue: boolean };

let me: TestUser;
let other: TestUser;
const as = (user: TestUser) => ({ Authorization: `Bearer ${user.token}` });

const createProject = async (owner: TestUser, name: string): Promise<number> =>
  (await request(app).post('/api/projects').set(as(owner)).send({ name })).body.data.id;
const addMember = (owner: TestUser, projectId: number, userId: number, role: string) =>
  request(app).post(`/api/projects/${projectId}/members`).set(as(owner)).send({ userId, role });
const share = (owner: TestUser, taskId: number, userId: number, role: string) =>
  request(app).post(`/api/tasks/${taskId}/collaborators`).set(as(owner)).send({ userId, role });
const byTitle = (res: request.Response): Record<string, TaskView> =>
  Object.fromEntries(res.body.data.map((task: TaskView) => [task.title, task]));

beforeAll(async () => {
  await migrator.up();
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true });
  me = await createUser({ email: 'me@test.com' });
  other = await createUser({ email: 'other@test.com' });
});

describe('Task views: role and isOverdue', () => {
  it('gives my role on each task of GET /api/tasks, whatever the way I got access', async () => {
    await createTask(me.token, { title: 'Mine' });

    const sharedEditor = await createTask(other.token, { title: 'Shared as editor' });
    await share(other, sharedEditor.id, me.userId, 'editor');
    const sharedViewer = await createTask(other.token, { title: 'Shared as viewer' });
    await share(other, sharedViewer.id, me.userId, 'viewer');

    const viewerProject = await createProject(other, 'Viewer project');
    await addMember(other, viewerProject, me.userId, 'viewer');
    await createTask(other.token, { title: 'In a project where I am viewer', projectId: viewerProject });
    // Viewer through the project, editor as a collaborator: the higher role wins.
    const both = await createTask(other.token, { title: 'Viewer by project, editor by sharing', projectId: viewerProject });
    await share(other, both.id, me.userId, 'editor');

    const editorProject = await createProject(other, 'Editor project');
    await addMember(other, editorProject, me.userId, 'editor');
    await createTask(other.token, { title: 'In a project where I am editor', projectId: editorProject });

    // Owning the project makes me editor (not owner) of the tasks others created in it.
    const myProject = await createProject(me, 'My project');
    await addMember(me, myProject, other.userId, 'editor');
    await createTask(other.token, { title: 'Created by someone else in my project', projectId: myProject });

    const res = await request(app).get('/api/tasks?limit=100').set(as(me));

    expect(res.status).toBe(200);
    const roles = Object.fromEntries(Object.entries(byTitle(res)).map(([title, task]) => [title, task.role]));
    expect(roles).toEqual({
      Mine: 'owner',
      'Shared as editor': 'editor',
      'Shared as viewer': 'viewer',
      'In a project where I am viewer': 'viewer',
      'Viewer by project, editor by sharing': 'editor',
      'In a project where I am editor': 'editor',
      'Created by someone else in my project': 'editor',
    });
  });

  it('marks as overdue only the tasks due before today that are not done', async () => {
    await createTask(me.token, { title: 'Late', dueDate: '2020-01-01' });
    await createTask(me.token, { title: 'Late but in review', dueDate: '2020-01-01', status: 'in-review' });
    await createTask(me.token, { title: 'Late but done', dueDate: '2020-01-01', status: 'done' });
    await createTask(me.token, { title: 'Future', dueDate: '2999-01-01' });
    await createTask(me.token, { title: 'No due date' });

    const tasks = byTitle(await request(app).get('/api/tasks/mine').set(as(me)));

    expect(Object.fromEntries(Object.entries(tasks).map(([title, task]) => [title, task.isOverdue]))).toEqual({
      Late: true,
      'Late but in review': true,
      'Late but done': false,
      Future: false,
      'No due date': false,
    });
    expect(Object.values(tasks).every((task) => task.role === 'owner')).toBe(true);
  });

  it('includes role and isOverdue in POST, GET /:id and PUT answers', async () => {
    const created = await request(app).post('/api/tasks').set(as(me)).send({ title: 'T', dueDate: '2020-01-01' });
    expect(created.body.data).toMatchObject({ role: 'owner', isOverdue: true });

    await share(me, created.body.data.id, other.userId, 'viewer');
    const seenByViewer = await request(app).get(`/api/tasks/${created.body.data.id}`).set(as(other));
    expect(seenByViewer.body.data).toMatchObject({ title: 'T', role: 'viewer', isOverdue: true });

    const updated = await request(app).put(`/api/tasks/${created.body.data.id}`).set(as(me)).send({ status: 'done' });
    expect(updated.body.data).toMatchObject({ status: 'done', role: 'owner', isOverdue: false });
  });

  it('keeps the usual fields next to the new ones', async () => {
    const task = await createTask(me.token, { title: 'Fields', priority: 'high' });

    const res = await request(app).get(`/api/tasks/${task.id}`).set(as(me));

    expect(Object.keys(res.body.data).sort()).toEqual(
      ['createdAt', 'description', 'dueDate', 'id', 'isOverdue', 'priority', 'projectId', 'role', 'status', 'title', 'updatedAt', 'userId'],
    );
  });
});
