import * as projectRepository from '../repositories/projectRepository';
import * as userRepository from '../repositories/userRepository';
import { assertProjectAccess, type Id, type ProjectRole } from '../policies/projectPolicy';
import ApiError from '../utils/apiError';
import type { Project, ProjectMember } from '../models';
import type { ProjectMemberRole } from '../models/ProjectMember';

export interface CreateProjectInput {
  name: string;
  description?: string | null;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

// A project as the API sends it: its columns plus the role of the current user in it,
// so the front knows what to show (edit buttons, member management...).
export type ProjectWithRole = ReturnType<Project['toJSON']> & { role: ProjectRole };

const withRole = (project: Project, role: ProjectRole): ProjectWithRole => ({ ...project.toJSON(), role });

// Only these fields can come from the client (never ownerId or id).
const pickWritable = (data: UpdateProjectInput): UpdateProjectInput => {
  const changes: UpdateProjectInput = {};
  if (data.name !== undefined) changes.name = data.name;
  if (data.description !== undefined) changes.description = data.description;
  return changes;
};

// ---------- projects ----------

export const create = async (ownerId: number, data: CreateProjectInput): Promise<ProjectWithRole> => {
  const project = await projectRepository.create({ ...pickWritable(data), name: data.name, ownerId });
  return withRole(project, 'owner');
};

// Projects the user owns or is a member of, each with the user's role.
export const list = async (userId: number): Promise<ProjectWithRole[]> => {
  const projects = await projectRepository.findAllAccessible(userId);
  const memberRoles = await projectRepository.getMemberRoles(
    projects.filter((p) => p.ownerId !== userId).map((p) => p.id),
    userId,
  );
  return projects.map((p) => withRole(p, p.ownerId === userId ? 'owner' : (memberRoles.get(p.id) ?? 'viewer')));
};

export const getById = async (projectId: Id, userId: number): Promise<ProjectWithRole> => {
  const { project, role } = await assertProjectAccess(projectId, userId, 'viewer');
  return withRole(project, role);
};

export const update = async (
  projectId: Id,
  userId: number,
  data: UpdateProjectInput,
): Promise<ProjectWithRole | null> => {
  const { project } = await assertProjectAccess(projectId, userId, 'owner', 'Only the project owner can edit it');
  const updated = await projectRepository.update(project.id, pickWritable(data));
  return updated && withRole(updated, 'owner');
};

// The project's tasks are kept: they become personal tasks of their owners (projectId -> NULL).
export const remove = async (projectId: Id, userId: number): Promise<Project | null> => {
  const { project } = await assertProjectAccess(projectId, userId, 'owner', 'Only the project owner can delete it');
  return projectRepository.remove(project.id);
};

// ---------- members ----------

// Anyone in the project can see who else is in it. Outsiders get a 404.
export const getMembers = async (projectId: Id, userId: number): Promise<ProjectMember[]> => {
  const { project } = await assertProjectAccess(projectId, userId, 'viewer');
  return projectRepository.getMembers(project.id);
};

export const addMember = async (
  projectId: Id,
  ownerId: number,
  targetUserId: number,
  role: ProjectMemberRole = 'viewer',
): Promise<ProjectMember> => {
  const { project } = await assertProjectAccess(
    projectId,
    ownerId,
    'owner',
    'Only the project owner can add members',
  );
  if (project.ownerId === targetUserId) throw new ApiError(400, 'The owner is already part of the project');
  const targetUser = await userRepository.findById(targetUserId);
  if (!targetUser) throw new ApiError(404, 'User not found');
  if (await projectRepository.isMember(project.id, targetUserId)) {
    throw new ApiError(409, 'User is already a member of this project');
  }
  return projectRepository.addMember(project.id, targetUserId, role);
};

export const updateMemberRole = async (
  projectId: Id,
  ownerId: number,
  targetUserId: number,
  role: ProjectMemberRole,
): Promise<ProjectMember> => {
  const { project } = await assertProjectAccess(
    projectId,
    ownerId,
    'owner',
    'Only the project owner can change member roles',
  );
  const member = await projectRepository.updateMemberRole(project.id, targetUserId, role);
  if (!member) throw new ApiError(404, 'Member not found');
  return member;
};

// The owner can remove anyone; a member can remove themself (leave the project).
export const removeMember = async (projectId: Id, requesterId: number, targetUserId: number): Promise<void> => {
  const leaving = requesterId === targetUserId;
  const { project } = await assertProjectAccess(
    projectId,
    requesterId,
    leaving ? 'viewer' : 'owner',
    'Only the project owner can remove members',
  );
  if (project.ownerId === targetUserId) throw new ApiError(400, 'The owner cannot leave the project');
  const member = await projectRepository.removeMember(project.id, targetUserId);
  if (!member) throw new ApiError(404, 'Member not found');
};
