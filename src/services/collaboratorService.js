const collaboratorRepository = require('../repositories/collaboratorRepositorie');
const userRepository = require('../repositories/userRepository');
const { assertTaskAccess } = require('../policies/taskPolicy');
const ApiError = require('../utils/apiError');

exports.addCollaborator = async (taskId, ownerId, targetUserId, role = 'viewer') => {
  const { task } = await assertTaskAccess(taskId, ownerId, 'owner', 'Only the task owner can add collaborators');
  if (task.userId === targetUserId) throw new ApiError(400, 'Owner cannot be added as a collaborator');
  const targetUser = await userRepository.findById(targetUserId);
  if (!targetUser) throw new ApiError(404, 'User not found');
  const alreadyCollab = await collaboratorRepository.isCollaborator(task.id, targetUserId);
  if (alreadyCollab) throw new ApiError(409, 'User is already a collaborator on this task');
  return collaboratorRepository.addCollaborator(task.id, targetUserId, role);
};

exports.removeCollaborator = async (taskId, ownerId, userId) => {
  const { task } = await assertTaskAccess(taskId, ownerId, 'owner', 'Only task owner can remove collaborators');
  const isCollaborator = await collaboratorRepository.isCollaborator(task.id, userId);
  if (!isCollaborator) throw new ApiError(404, 'Collaborator not found');
  return collaboratorRepository.removeCollaborator(task.id, userId);
};

exports.updateCollaboratorRole = async (taskId, ownerId, targetUserId, role) => {
  const { task } = await assertTaskAccess(taskId, ownerId, 'owner', 'Only the task owner can update collaborator roles');
  const collaborator = await collaboratorRepository.updateCollaboratorRole(task.id, targetUserId, role);
  if (!collaborator) throw new ApiError(404, 'Collaborator not found');
  return collaborator;
};

// Anyone with access to the task (owner, editor, viewer) can see who else is on it.
// Outsiders get a 404, exactly like GET /api/tasks/:id.
exports.getCollaborators = async (taskId, userId) => {
  const { task } = await assertTaskAccess(taskId, userId, 'viewer');
  return collaboratorRepository.getCollaborators(task.id);
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
