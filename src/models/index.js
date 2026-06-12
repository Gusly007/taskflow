const User = require('./User');
const Task = require('./Task');
const TaskCollaborator = require('./TaskCollaborator');

User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId' });
Task.belongsToMany(User, { through: TaskCollaborator, foreignKey: 'taskId', otherKey: 'userId' });
User.belongsToMany(Task, { through: TaskCollaborator, foreignKey: 'userId', otherKey: 'taskId' });

module.exports = { User, Task, TaskCollaborator };
