const { TaskCollaborator, Task } = require('../models');

exports.addCollaborator = async (taskId, userId, role = 'viewer') => {
  return TaskCollaborator.create({ taskId, userId, role });
};

exports.removeCollaborator = async (taskId, userId) => {
  const collaborator = await TaskCollaborator.findOne({ where: { taskId, userId } });
  if (!collaborator) return null;
  await collaborator.destroy();
  return collaborator;
};

exports.getCollaborators = async (taskId) => {
  return TaskCollaborator.findAll({ where: { taskId } });
};

exports.isCollaborator = async (taskId, userId) => {
  const collaborator = await TaskCollaborator.findOne({ where: { taskId, userId } });
  return !!collaborator;
};

exports.updateCollaboratorRole = async (taskId, userId, role) => {
  const collaborator = await TaskCollaborator.findOne({ where: { taskId, userId } });
  if (!collaborator) return null;
  return collaborator.update({ role });
};

exports.getCollaboratorRole = async (taskId, userId) => {
  const collaborator = await TaskCollaborator.findOne({ where: { taskId, userId } });
  return collaborator ? collaborator.role : null;
};

exports.getTasksForCollaborator = async (userId) => {
  return Task.findAll({
    include: [{ model: TaskCollaborator, where: { userId } }],
    order: [['createdAt', 'DESC']],
  });
};
