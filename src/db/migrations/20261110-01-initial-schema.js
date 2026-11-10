// Baseline: the schema that sequelize.sync() used to create (users, tasks, task_collaborators).
//
// Databases created before migrations existed (e.g. your Docker volume) already have these
// tables. In that case this migration only records itself as done and changes nothing.

const tableExists = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(table);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await tableExists(queryInterface, 'users')) return;

    const timestamps = {
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    };

    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      ...timestamps,
    });

    await queryInterface.createTable('tasks', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('todo', 'in-progress', 'done'), defaultValue: 'todo' },
      userId: {
        type: Sequelize.INTEGER,
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
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        taskId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'tasks', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        role: { type: Sequelize.ENUM('viewer', 'editor'), allowNull: false, defaultValue: 'viewer' },
        ...timestamps,
      },
      { uniqueKeys: { task_collaborators_taskId_userId_key: { fields: ['taskId', 'userId'] } } },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('task_collaborators');
    await queryInterface.dropTable('tasks');
    await queryInterface.dropTable('users');
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_task_collaborators_role";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_status";');
    }
  },
};
