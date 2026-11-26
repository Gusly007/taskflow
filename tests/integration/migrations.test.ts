import { QueryTypes } from 'sequelize';
import { sequelize } from '../../src/config/db';
import { migrator } from '../../src/db/migrator';

const columnsOf = async (table: string): Promise<string[]> =>
  Object.keys(await sequelize.getQueryInterface().describeTable(table));

// Depending on the dialect, showAllTables() returns names or { tableName } objects.
const tables = async (): Promise<string[]> => {
  const all = (await sequelize.getQueryInterface().showAllTables()) as Array<string | { tableName: string }>;
  return all.map((t) => (typeof t === 'string' ? t : t.tableName));
};

afterAll(async () => {
  await sequelize.close();
});

describe('Database migrations', () => {
  it('apply on an empty database', async () => {
    await migrator.up();

    expect(await migrator.pending()).toHaveLength(0);
    expect(await tables()).toEqual(
      expect.arrayContaining(['users', 'tasks', 'task_collaborators', 'projects', 'project_members']),
    );
    expect(await columnsOf('tasks')).toEqual(expect.arrayContaining(['priority', 'dueDate', 'projectId']));
  });

  it('can be fully rolled back and re-applied', async () => {
    await migrator.down({ to: 0 });

    expect(await tables()).not.toContain('tasks');

    await migrator.up();

    expect(await columnsOf('tasks')).toEqual(expect.arrayContaining(['priority', 'dueDate']));
  });

  it('rolling back the last migration moves the new statuses back to the closest old ones', async () => {
    const queryInterface = sequelize.getQueryInterface();
    const now = new Date();
    await queryInterface.bulkInsert('users', [
      { id: 1, name: 'Ann', email: 'ann@test.com', password: 'x', createdAt: now, updatedAt: now },
    ]);
    await queryInterface.bulkInsert(
      'tasks',
      ['backlog', 'todo', 'in-progress', 'in-review', 'done'].map((status) => ({
        title: status,
        status,
        userId: 1,
        createdAt: now,
        updatedAt: now,
      })),
    );

    await migrator.down();

    const rows = await sequelize.query<{ title: string; status: string }>(
      'SELECT "title", "status" FROM "tasks" ORDER BY "id"',
      { type: QueryTypes.SELECT },
    );
    expect(rows).toEqual([
      { title: 'backlog', status: 'todo' },
      { title: 'todo', status: 'todo' },
      { title: 'in-progress', status: 'in-progress' },
      { title: 'in-review', status: 'in-progress' },
      { title: 'done', status: 'done' },
    ]);

    await migrator.up();
    await queryInterface.bulkDelete('tasks', {});
    await queryInterface.bulkDelete('users', {});
  });

  it('rolling back two migrations also removes the projects', async () => {
    await migrator.down({ step: 2 });

    expect(await tables()).not.toEqual(expect.arrayContaining(['projects']));
    expect(await tables()).not.toEqual(expect.arrayContaining(['project_members']));
    const columns = await columnsOf('tasks');
    expect(columns).not.toContain('projectId');
    expect(columns).toEqual(expect.arrayContaining(['title', 'priority', 'dueDate']));

    await migrator.up();

    expect(await tables()).toEqual(expect.arrayContaining(['projects', 'project_members']));
    expect(await columnsOf('tasks')).toContain('projectId');
  });

  it('rolling back three migrations also removes dueDate and priority', async () => {
    await migrator.down({ step: 3 });

    const columns = await columnsOf('tasks');
    expect(columns).not.toContain('priority');
    expect(columns).not.toContain('dueDate');
    expect(columns).toContain('title');

    await migrator.up();
  });
});
