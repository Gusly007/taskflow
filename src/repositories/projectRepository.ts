import { Op, type CreationAttributes } from 'sequelize';
import { Project, ProjectMember } from '../models';
import type { ProjectMemberRole } from '../models/ProjectMember';

// ---------- projects ----------

export const create = async (data: CreationAttributes<Project>): Promise<Project> => {
  const project = await Project.create(data);
  // Reload so the response always contains every column (description: null...).
  return project.reload();
};

export const findById = async (id: number): Promise<Project | null> => Project.findByPk(id);

// Ids of every project the user owns or is a member of.
export const findAccessibleIds = async (userId: number): Promise<number[]> => {
  const [owned, memberships] = await Promise.all([
    Project.findAll({ where: { ownerId: userId }, attributes: ['id'] }),
    ProjectMember.findAll({ where: { userId }, attributes: ['projectId'] }),
  ]);
  return [...new Set([...owned.map((p) => p.id), ...memberships.map((m) => m.projectId)])];
};

// Projects the user owns or is a member of, newest first.
export const findAllAccessible = async (userId: number): Promise<Project[]> => {
  const ids = await findAccessibleIds(userId);
  if (!ids.length) return [];
  return Project.findAll({ where: { id: { [Op.in]: ids } }, order: [['createdAt', 'DESC'], ['id', 'DESC']] });
};

export const update = async (id: number, data: Partial<CreationAttributes<Project>>): Promise<Project | null> => {
  const project = await Project.findByPk(id);
  if (!project) return null;
  return project.update(data);
};

export const remove = async (id: number): Promise<Project | null> => {
  const project = await Project.findByPk(id);
  if (!project) return null;
  await project.destroy();
  return project;
};

// ---------- members ----------

const findMember = (projectId: number, userId: number): Promise<ProjectMember | null> =>
  ProjectMember.findOne({ where: { projectId, userId } });

export const getMemberRole = async (projectId: number, userId: number): Promise<ProjectMemberRole | null> => {
  const member = await findMember(projectId, userId);
  return member ? member.role : null;
};

// Role of the user in each of the given projects (projects where the user is not a member are absent).
export const getMemberRoles = async (
  projectIds: number[],
  userId: number,
): Promise<Map<number, ProjectMemberRole>> => {
  if (!projectIds.length) return new Map();
  const members = await ProjectMember.findAll({ where: { userId, projectId: { [Op.in]: projectIds } } });
  return new Map(members.map((m) => [m.projectId, m.role]));
};

export const getMembers = async (projectId: number): Promise<ProjectMember[]> =>
  ProjectMember.findAll({ where: { projectId }, order: [['id', 'ASC']] });

export const isMember = async (projectId: number, userId: number): Promise<boolean> =>
  (await findMember(projectId, userId)) !== null;

export const addMember = async (
  projectId: number,
  userId: number,
  role: ProjectMemberRole = 'viewer',
): Promise<ProjectMember> => ProjectMember.create({ projectId, userId, role });

export const updateMemberRole = async (
  projectId: number,
  userId: number,
  role: ProjectMemberRole,
): Promise<ProjectMember | null> => {
  const member = await findMember(projectId, userId);
  if (!member) return null;
  return member.update({ role });
};

export const removeMember = async (projectId: number, userId: number): Promise<ProjectMember | null> => {
  const member = await findMember(projectId, userId);
  if (!member) return null;
  await member.destroy();
  return member;
};
