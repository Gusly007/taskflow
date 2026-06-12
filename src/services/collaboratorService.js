const collaboratorRepository = require('../repositories/collaboratorRepositorie');
const taskRepository = require('../repositories/taskRepository');
const ApiError = require('../utils/apiError');

exports.addCollaborator = async (taskId, ownerId, targetUserId, role = 'viewer') => {
  const isOwner = await taskRepository.ownerTask(ownerId, taskId);
  if (!isOwner) throw new ApiError(403, 'Only the task owner can add collaborators');
  if (ownerId === targetUserId) throw new ApiError(400, 'Owner cannot be added as a collaborator');
  const alreadyCollab = await collaboratorRepository.isCollaborator(taskId, targetUserId);
  if (alreadyCollab) throw new ApiError(409, 'User is already a collaborator on this task');
  return collaboratorRepository.addCollaborator(taskId, targetUserId, role);
};

exports.removeCollaborator = async (taskId, ownerId, userId) => {
  const isOwner = await taskRepository.ownerTask(ownerId, taskId);
  if (!isOwner) throw new ApiError(403, 'Only task owner can remove collaborators');
  const isCollaborator = await collaboratorRepository.isCollaborator(taskId, userId);
  if (!isCollaborator) throw new ApiError(404, 'Collaborator not found');
  return collaboratorRepository.removeCollaborator(taskId, userId);
};

exports.updateCollaboratorRole = async (taskId, ownerId, targetUserId, role) => {
  const isOwner = await taskRepository.ownerTask(ownerId, taskId);
  if (!isOwner) throw new ApiError(403, 'Only the task owner can update collaborator roles');
  const collaborator = await collaboratorRepository.updateCollaboratorRole(taskId, targetUserId, role);
  if (!collaborator) throw new ApiError(404, 'Collaborator not found');
  return collaborator;
};

exports.getCollaborators = async (taskId) => {
  return collaboratorRepository.getCollaborators(taskId);
};

exports.isCollaborator = async (taskId, userId) => {
  return collaboratorRepository.isCollaborator(taskId, userId);
};

exports.getCollaboratorRole = async (taskId, userId) => {
  return collaboratorRepository.getCollaboratorRole(taskId, userId);
};

exports.getTasksForCollaborator = async (userId) => {
  return collaboratorRepository.getTasksForCollaborator(userId);
};
