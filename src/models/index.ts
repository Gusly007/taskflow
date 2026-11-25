import User from './User';
import Task from './Task';
import TaskCollaborator from './TaskCollaborator';

User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId' });
Task.belongsToMany(User, { through: TaskCollaborator, foreignKey: 'taskId', otherKey: 'userId' });
User.belongsToMany(Task, { through: TaskCollaborator, foreignKey: 'userId', otherKey: 'taskId' });

export { User, Task, TaskCollaborator };
