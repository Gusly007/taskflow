const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/db');
const { migrator } = require('../../src/db/migrator');
const { createUser, createTask } = require('../helpers');

let token, other;
const auth = () => ({ Authorization: `Bearer ${token}` });
const list = (query = '', path = '/api/tasks') => request(app).get(`${path}${query}`).set(auth());
const titles = (res) => res.body.data.map((t) => t.title);

beforeAll(async () => {
  await migrator.up();
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true });
  token = (await createUser({ email: 'me@test.com' })).token;
  other = await createUser({ email: 'other@test.com' });

  // Dates far in the past / future so the "overdue" tests never depend on today's date.
  await createTask(token, { title: 'Old bug', priority: 'high', dueDate: '2020-01-10' }); // overdue
  await createTask(token, { title: 'Old done', priority: 'low', dueDate: '2020-01-05', status: 'done' }); // past but done
  await createTask(token, { title: 'Future report', priority: 'medium', dueDate: '2999-06-01', status: 'in-progress' });
  await createTask(token, { title: 'No date', priority: 'low' });
  await createTask(other.token, { title: 'Someone else' }); // never visible
});

describe('GET /api/tasks — filters, sort, pagination', () => {
  it('returns pagination meta with defaults', async () => {
    const res = await list();

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 4, totalPages: 1 });
    expect(titles(res)).not.toContain('Someone else');
  });

  it('filters by one status', async () => {
    const res = await list('?status=done');

    expect(titles(res)).toEqual(['Old done']);
    expect(res.body.meta.total).toBe(1);
  });

  it('filters by several statuses (comma-separated)', async () => {
    const res = await list('?status=todo,in-progress&sort=title');

    expect(titles(res)).toEqual(['Future report', 'No date', 'Old bug']);
  });

  it('filters by priority', async () => {
    const res = await list('?priority=low&sort=title');

    expect(titles(res)).toEqual(['No date', 'Old done']);
  });

  it('overdue=true returns past-due tasks that are not done', async () => {
    const res = await list('?overdue=true');

    expect(titles(res)).toEqual(['Old bug']);
  });

  it('overdue=false returns everything else', async () => {
    const res = await list('?overdue=false&sort=title');

    expect(titles(res)).toEqual(['Future report', 'No date', 'Old done']);
  });

  it('filters by due date range (inclusive)', async () => {
    const res = await list('?dueAfter=2020-01-05&dueBefore=2020-01-10&sort=dueDate');

    expect(titles(res)).toEqual(['Old done', 'Old bug']);
  });

  it('sorts by due date ascending, tasks without due date last', async () => {
    const res = await list('?sort=dueDate');

    expect(titles(res)).toEqual(['Old done', 'Old bug', 'Future report', 'No date']);
  });

  it('sorts by due date descending, tasks without due date still last', async () => {
    const res = await list('?sort=-dueDate');

    expect(titles(res)).toEqual(['Future report', 'Old bug', 'Old done', 'No date']);
  });

  it('sorts by priority by importance, not alphabetically', async () => {
    const res = await list('?sort=-priority');

    expect(res.body.data.map((t) => t.priority)).toEqual(['high', 'medium', 'low', 'low']);
  });

  it('paginates without overlap', async () => {
    const page1 = await list('?sort=title&limit=3&page=1');
    const page2 = await list('?sort=title&limit=3&page=2');

    expect(titles(page1)).toEqual(['Future report', 'No date', 'Old bug']);
    expect(titles(page2)).toEqual(['Old done']);
    expect(page2.body.meta).toEqual({ page: 2, limit: 3, total: 4, totalPages: 2 });
  });

  it('returns an empty page past the end', async () => {
    const res = await list('?page=5');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(4);
  });

  it('includes tasks shared with me and applies filters to them', async () => {
    const shared = await createTask(other.token, { title: 'Shared urgent', priority: 'high' });
    const me = await request(app).get('/api/tasks/mine').set(auth());
    await request(app)
      .post(`/api/tasks/${shared.id}/collaborators`)
      .set({ Authorization: `Bearer ${other.token}` })
      .send({ userId: me.body.data[0].userId, role: 'viewer' });

    const all = await list('?priority=high&sort=title');
    const mine = await list('?priority=high', '/api/tasks/mine');

    expect(titles(all)).toEqual(['Old bug', 'Shared urgent']);
    expect(titles(mine)).toEqual(['Old bug']);
  });

  it('applies the same filters on /api/tasks/mine', async () => {
    const res = await list('?status=done', '/api/tasks/mine');

    expect(titles(res)).toEqual(['Old done']);
    expect(res.body.meta.total).toBe(1);
  });

  it.each([
    ['status=finished', 'status'],
    ['priority=urgent', 'priority'],
    ['overdue=maybe', 'overdue'],
    ['dueBefore=31/12/2026', 'dueBefore'],
    ['sort=password', 'sort'],
    ['page=0', 'page'],
    ['limit=500', 'limit'],
    ['status=todo&status=done', 'status'],
  ])('returns 400 for ?%s', async (query, field) => {
    const res = await list(`?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain(field);
  });
});
