import * as collaboratorRepository from '../repositories/collaboratorRepository';
import * as userRepository from '../repositories/userRepository';
import { assertTaskAccess, type Id } from '../policies/taskPolicy';
import ApiError from '../utils/apiError';
import type { TaskCollaborator } from '../models';
import type { CollaboratorRole } from '../models/TaskCollaborator';

export const addCollaborator = async (
  taskId: Id,
  ownerId: number,
  targetUserId: number,
  role: CollaboratorRole = 'viewer',
): Promise<TaskCollaborator> => {
  const { task } = await assertTaskAccess(taskId, ownerId, 'owner', 'Only the task owner can add collaborators');
  if (task.userId === targetUserId) throw new ApiError(400, 'Owner cannot be added as a collaborator');
  const targetUser = await userRepository.findById(targetUserId);
  if (!targetUser) throw new ApiError(404, 'User not found');
  const alreadyCollab = await collaboratorRepository.isCollaborator(task.id, targetUserId);
  if (alreadyCollab) throw new ApiError(409, 'User is already a collaborator on this task');
  return collaboratorRepository.addCollaborator(task.id, targetUserId, role);
};

export const removeCollaborator = async (
  taskId: Id,
  ownerId: number,
  userId: number,
): Promise<TaskCollaborator | null> => {
  const { task } = await assertTaskAccess(taskId, ownerId, 'owner', 'Only task owner can remove collaborators');
  const isCollaborator = await collaboratorRepository.isCollaborator(task.id, userId);
  if (!isCollaborator) throw new ApiError(404, 'Collaborator not found');
  return collaboratorRepository.removeCollaborator(task.id, userId);
};

export const updateCollaboratorRole = async (
  taskId: Id,
  ownerId: number,
  targetUserId: number,
  role: CollaboratorRole,
): Promise<TaskCollaborator> => {
  const { task } = await assertTaskAccess(
    taskId,
    ownerId,
    'owner',
    'Only the task owner can update collaborator roles',
  );
  const collaborator = await collaboratorRepository.updateCollaboratorRole(task.id, targetUserId, role);
  if (!collaborator) throw new ApiError(404, 'Collaborator not found');
  return collaborator;
};

// Anyone with access to the task (owner, editor, viewer) can see who else is on it.
// Outsiders get a 404, exactly like GET /api/tasks/:id.
export const getCollaborators = async (taskId: Id, userId: number): Promise<TaskCollaborator[]> => {
  const { task } = await assertTaskAccess(taskId, userId, 'viewer');
  return collaboratorRepository.getCollaborators(task.id);
};
