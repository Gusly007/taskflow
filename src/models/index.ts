import User from './User';
import Task from './Task';
import TaskCollaborator from './TaskCollaborator';
import Project from './Project';
import ProjectMember from './ProjectMember';

User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId' });
Task.belongsToMany(User, { through: TaskCollaborator, foreignKey: 'taskId', otherKey: 'userId' });
User.belongsToMany(Task, { through: TaskCollaborator, foreignKey: 'userId', otherKey: 'taskId' });

User.hasMany(Project, { foreignKey: 'ownerId', onDelete: 'CASCADE' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'SET NULL' });
Task.belongsTo(Project, { foreignKey: 'projectId' });
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'projectId', otherKey: 'userId', as: 'members' });
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'userId', otherKey: 'projectId', as: 'memberProjects' });

export { User, Task, TaskCollaborator, Project, ProjectMember };
