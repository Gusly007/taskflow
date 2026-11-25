import * as taskRepository from '../repositories/taskRepository';
import * as collaboratorRepository from '../repositories/collaboratorRepository';
import ApiError from '../utils/apiError';
import type { Task } from '../models';
import type { CollaboratorRole } from '../models/TaskCollaborator';

// Single source of truth for "who can do what on a task".
// Every service that touches a task goes through assertTaskAccess,
// so no route can forget the access check.

export type TaskRole = 'owner' | CollaboratorRole;

// Ids come as numbers from the token and as strings from the URL.
export type Id = number | string;

export const ROLE_LEVEL: Record<TaskRole, number> = { viewer: 1, editor: 2, owner: 3 };

export interface TaskAccess {
  task: Task;
  role: TaskRole;
}

const toId = (value: Id): number => (typeof value === 'number' ? value : Number.parseInt(value, 10));

/**
 * Returns the task and the role of userId on it.
 * role is 'owner', 'editor', 'viewer', or null when the user has no access.
 */
export const getTaskRole = async (
  taskId: Id,
  userId: Id,
): Promise<{ task: null; role: null } | { task: Task; role: TaskRole | null }> => {
  const task = await taskRepository.findById(toId(taskId));
  if (!task) return { task: null, role: null };
  if (task.userId === toId(userId)) return { task, role: 'owner' };
  const role = await collaboratorRepository.getCollaboratorRole(task.id, toId(userId));
  return { task, role: role || null };
};

/**
 * Throws unless userId has at least requiredRole on the task.
 * - Task missing OR user has no access at all -> 404, so an outsider
 *   cannot tell whether a task id exists.
 * - User can see the task but lacks the required role -> 403.
 */
export const assertTaskAccess = async (
  taskId: Id,
  userId: Id,
  requiredRole: TaskRole = 'viewer',
  forbiddenMessage?: string,
): Promise<TaskAccess> => {
  const { task, role } = await getTaskRole(taskId, userId);
  if (!task || !role) throw new ApiError(404, 'Task not found');
  if (ROLE_LEVEL[role] < ROLE_LEVEL[requiredRole]) {
    throw new ApiError(403, forbiddenMessage || `This action requires the ${requiredRole} role`);
  }
  return { task, role };
};
