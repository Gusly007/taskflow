import * as projectRepository from '../repositories/projectRepository';
import ApiError from '../utils/apiError';
import type { Project } from '../models';
import type { ProjectMemberRole } from '../models/ProjectMember';

// Single source of truth for "who can do what on a project", same rules as taskPolicy:
// - owner: everything (rename, delete, manage members)
// - editor: create and edit tasks in the project
// - viewer: see the project and its tasks

export type ProjectRole = 'owner' | ProjectMemberRole;

export type Id = number | string;

export const PROJECT_ROLE_LEVEL: Record<ProjectRole, number> = { viewer: 1, editor: 2, owner: 3 };

export interface ProjectAccess {
  project: Project;
  role: ProjectRole;
}

const toId = (value: Id): number => (typeof value === 'number' ? value : Number.parseInt(value, 10));

/**
 * Role of userId in a project that is already loaded: 'owner', 'editor', 'viewer' or null.
 */
export const getRoleInProject = async (project: Project, userId: number): Promise<ProjectRole | null> => {
  if (project.ownerId === userId) return 'owner';
  return projectRepository.getMemberRole(project.id, userId);
};

/**
 * userId's role in each of these projects, in two queries (owned ones + memberships):
 * projectId -> 'owner' | 'editor' | 'viewer'. Projects userId is not in are not in the map.
 */
export const getProjectRoles = async (projectIds: number[], userId: number): Promise<Map<number, ProjectRole>> => {
  const [ownedIds, memberRoles] = await Promise.all([
    projectRepository.findOwnedIds(projectIds, userId),
    projectRepository.getMemberRoles(projectIds, userId),
  ]);
  const roles = new Map<number, ProjectRole>(memberRoles);
  for (const id of ownedIds) roles.set(id, 'owner');
  return roles;
};

/**
 * Returns the project and the role of userId in it (null role = no access).
 */
export const getProjectRole = async (
  projectId: Id,
  userId: Id,
): Promise<{ project: null; role: null } | { project: Project; role: ProjectRole | null }> => {
  const project = await projectRepository.findById(toId(projectId));
  if (!project) return { project: null, role: null };
  return { project, role: await getRoleInProject(project, toId(userId)) };
};

/**
 * Throws unless userId has at least requiredRole in the project.
 * - Project missing OR user not in it -> 404 (an outsider cannot tell whether it exists).
 * - User in the project but with a lower role -> 403.
 */
export const assertProjectAccess = async (
  projectId: Id,
  userId: Id,
  requiredRole: ProjectRole = 'viewer',
  forbiddenMessage?: string,
): Promise<ProjectAccess> => {
  const { project, role } = await getProjectRole(projectId, userId);
  if (!project || !role) throw new ApiError(404, 'Project not found');
  if (PROJECT_ROLE_LEVEL[role] < PROJECT_ROLE_LEVEL[requiredRole]) {
    throw new ApiError(403, forbiddenMessage || `This action requires the ${requiredRole} role in the project`);
  }
  return { project, role };
};
