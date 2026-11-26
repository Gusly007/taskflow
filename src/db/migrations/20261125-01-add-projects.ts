// Adds projects: a project has an owner and members (viewer or editor), and tasks can belong
// to a project. Members of a project see (viewer) or edit (editor) every task of that project.
//
// Deleting a project does not delete its tasks: they go back to being personal tasks of their
// owner (projectId set to NULL).
import { DataTypes, type QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const timestamps = {
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  };

  await queryInterface.createTable('projects', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    ...timestamps,
  });

  await queryInterface.createTable(
    'project_members',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
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
    { uniqueKeys: { project_members_projectId_userId_key: { fields: ['projectId', 'userId'] } } },
  );
  await queryInterface.addIndex('project_members', ['userId'], { name: 'project_members_user_id_idx' });
  await queryInterface.addIndex('projects', ['ownerId'], { name: 'projects_owner_id_idx' });

  await queryInterface.addColumn('tasks', 'projectId', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'projects', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  await queryInterface.addIndex('tasks', ['projectId'], { name: 'tasks_project_id_idx' });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeIndex('tasks', 'tasks_project_id_idx');
  await queryInterface.removeColumn('tasks', 'projectId');
  await queryInterface.dropTable('project_members');
  await queryInterface.dropTable('projects');
  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_members_role";');
  }
};
