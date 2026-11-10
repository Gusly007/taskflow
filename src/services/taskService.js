const taskRepository = require('../repositories/taskRepository');
const { assertTaskAccess } = require('../policies/taskPolicy');

exports.create = async (userId, data) => {
  return taskRepository.create({ ...data, userId });
};

exports.getAllByUser = async (userId) => {
  return taskRepository.findAllIncludingCollaborated(userId);
};

exports.getMyTasks = async (userId) => {
  return taskRepository.findAllByUser(userId);
};

exports.getById = async (taskId, userId) => {
  const { task } = await assertTaskAccess(taskId, userId, 'viewer');
  return task;
};

exports.update = async (taskId, userId, data) => {
  const { task } = await assertTaskAccess(taskId, userId, 'editor', 'Viewers cannot edit tasks');
  return taskRepository.update(task.id, data);
};

exports.remove = async (taskId, userId) => {
  const { task } = await assertTaskAccess(taskId, userId, 'owner', 'Only the task owner can delete tasks');
  return taskRepository.remove(task.id);
};
