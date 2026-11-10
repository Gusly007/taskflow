// Adds a due date (calendar day, no time zone issues) and a priority to tasks.
// Existing tasks get priority "medium" and no due date.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'dueDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('tasks', 'priority', {
      type: Sequelize.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    });
    await queryInterface.addIndex('tasks', ['dueDate'], { name: 'tasks_due_date_idx' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', 'tasks_due_date_idx');
    await queryInterface.removeColumn('tasks', 'priority');
    await queryInterface.removeColumn('tasks', 'dueDate');
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_priority";');
    }
  },
};
