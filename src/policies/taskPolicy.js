const taskRepository = require('../repositories/taskRepository');
const collaboratorRepository = require('../repositories/collaboratorRepositorie');
const ApiError = require('../utils/apiError');

// Single source of truth for "who can do what on a task".
// Every service that touches a task goes through assertTaskAccess,
// so no route can forget the access check.

const ROLE_LEVEL = { viewer: 1, editor: 2, owner: 3 };

const toId = (value) => Number.parseInt(value, 10);

/**
 * Returns the task and the role of userId on it.
 * role is 'owner', 'editor', 'viewer', or null when the user has no access.
 */
exports.getTaskRole = async (taskId, userId) => {
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
exports.assertTaskAccess = async (taskId, userId, requiredRole = 'viewer', forbiddenMessage) => {
  const { task, role } = await exports.getTaskRole(taskId, userId);
  if (!task || !role) throw new ApiError(404, 'Task not found');
  if (ROLE_LEVEL[role] < ROLE_LEVEL[requiredRole]) {
    throw new ApiError(403, forbiddenMessage || `This action requires the ${requiredRole} role`);
  }
  return { task, role };
};

exports.ROLE_LEVEL = ROLE_LEVEL;
