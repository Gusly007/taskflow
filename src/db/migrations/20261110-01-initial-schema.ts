// Baseline: the schema that sequelize.sync() used to create (users, tasks, task_collaborators).
//
// Databases created before migrations existed (e.g. your Docker volume) already have these
// tables. In that case this migration only records itself as done and changes nothing.
//
// A migration is a frozen snapshot of the schema at a point in time: it uses DataTypes
// directly and never imports the models, which will keep changing.
import { DataTypes, type QueryInterface } from 'sequelize';

const tableExists = async (queryInterface: QueryInterface, table: string): Promise<boolean> => {
  // Depending on the dialect, showAllTables() returns names or { tableName } objects.
  const tables = (await queryInterface.showAllTables()) as Array<string | { tableName: string }>;
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(table);
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  if (await tableExists(queryInterface, 'users')) return;

  const timestamps = {
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  };

  await queryInterface.createTable('users', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    ...timestamps,
  });

  await queryInterface.createTable('tasks', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('todo', 'in-progress', 'done'), defaultValue: 'todo' },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    ...timestamps,
  });

  await queryInterface.createTable(
    'task_collaborators',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      taskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      role: { type: DataTypes.ENUM('viewer', 'editor'), allowNull: false, defaultValue: 'viewer' },
      ...timestamps,
    },
    { uniqueKeys: { task_collaborators_taskId_userId_key: { fields: ['taskId', 'userId'] } } },
  );
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('task_collaborators');
  await queryInterface.dropTable('tasks');
  await queryInterface.dropTable('users');
  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_task_collaborators_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_status";');
  }
};
