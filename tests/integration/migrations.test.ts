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
    expect(await tables()).toEqual(expect.arrayContaining(['users', 'tasks', 'task_collaborators']));
    expect(await columnsOf('tasks')).toEqual(expect.arrayContaining(['priority', 'dueDate']));
  });

  it('can be fully rolled back and re-applied', async () => {
    await migrator.down({ to: 0 });

    expect(await tables()).not.toContain('tasks');

    await migrator.up();

    expect(await columnsOf('tasks')).toEqual(expect.arrayContaining(['priority', 'dueDate']));
  });

  it('rolling back the last migration removes only dueDate and priority', async () => {
    await migrator.down();

    const columns = await columnsOf('tasks');
    expect(columns).not.toContain('priority');
    expect(columns).not.toContain('dueDate');
    expect(columns).toContain('title');

    await migrator.up();
  });
});
