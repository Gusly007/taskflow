import * as taskRepository from '../repositories/taskRepository';
import * as collaboratorRepository from '../repositories/collaboratorRepository';
import ApiError from '../utils/apiError';
import type { Task } from '../models';
import type { CollaboratorRole } from '../models/TaskCollaborator';
import { getProjectRole, type ProjectRole } from './projectPolicy';

// Single source of truth for "who can do what on a task".
// Every service that touches a task goes through assertTaskAccess,
// so no route can forget the access check.
//
// A user's role on a task is the highest of:
// - 'owner' if they created it,
// - their collaborator role on the task (task_collaborators),
// - the role they get through the task's project (see taskRoleFromProjectRole).

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
  const collaboratorRole = await collaboratorRepository.getCollaboratorRole(task.id, toId(userId));
  const projectRole = task.projectId ? await getRoleFromProject(task.projectId, toId(userId)) : null;
  return { task, role: highestRole(collaboratorRole, projectRole) };
};

/**
 * Role a user gets on every task of a project through the project itself.
 * The project owner and editors can edit its tasks, viewers can only see them.
 * Deleting a task and managing its collaborators stay reserved to the task owner.
 */
export const taskRoleFromProjectRole = (projectRole: ProjectRole | null): CollaboratorRole | null => {
  if (!projectRole) return null;
  return projectRole === 'viewer' ? 'viewer' : 'editor';
};

const getRoleFromProject = async (projectId: number, userId: number): Promise<CollaboratorRole | null> => {
  const { role } = await getProjectRole(projectId, userId);
  return taskRoleFromProjectRole(role);
};

// A user can be both a direct collaborator and a project member: the higher role wins.
const highestRole = (a: TaskRole | null, b: TaskRole | null): TaskRole | null => {
  if (!a) return b;
  if (!b) return a;
  return ROLE_LEVEL[a] >= ROLE_LEVEL[b] ? a : b;
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
