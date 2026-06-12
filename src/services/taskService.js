const taskRepository = require('../repositories/taskRepository');
const collaboratorRepository = require('../repositories/collaboratorRepositorie');
const ApiError = require('../utils/apiError');

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
  const task = await taskRepository.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  if (task.userId === userId) return task;
  const isCollab = await collaboratorRepository.isCollaborator(taskId, userId);
  if (!isCollab) throw new ApiError(403, 'Access denied');
  return task;
};

exports.update = async (taskId, userId, data) => {
  const task = await taskRepository.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  if (task.userId === userId) return taskRepository.update(taskId, data);
  const role = await collaboratorRepository.getCollaboratorRole(taskId, userId);
  if (!role) throw new ApiError(403, 'Access denied');
  if (role === 'viewer') throw new ApiError(403, 'Viewers cannot edit tasks');
  return taskRepository.update(taskId, data);
};

exports.remove = async (taskId, userId) => {
  const task = await taskRepository.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  if (task.userId !== userId) throw new ApiError(403, 'Only the task owner can delete tasks');
  return taskRepository.remove(taskId);
};
