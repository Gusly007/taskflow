import { TaskCollaborator } from '../models';
import type { CollaboratorRole } from '../models/TaskCollaborator';

const findOne = (taskId: number, userId: number): Promise<TaskCollaborator | null> =>
  TaskCollaborator.findOne({ where: { taskId, userId } });

export const addCollaborator = async (
  taskId: number,
  userId: number,
  role: CollaboratorRole = 'viewer',
): Promise<TaskCollaborator> => TaskCollaborator.create({ taskId, userId, role });

export const removeCollaborator = async (taskId: number, userId: number): Promise<TaskCollaborator | null> => {
  const collaborator = await findOne(taskId, userId);
  if (!collaborator) return null;
  await collaborator.destroy();
  return collaborator;
};

export const getCollaborators = async (taskId: number): Promise<TaskCollaborator[]> =>
  TaskCollaborator.findAll({ where: { taskId } });

export const isCollaborator = async (taskId: number, userId: number): Promise<boolean> =>
  (await findOne(taskId, userId)) !== null;

export const updateCollaboratorRole = async (
  taskId: number,
  userId: number,
  role: CollaboratorRole,
): Promise<TaskCollaborator | null> => {
  const collaborator = await findOne(taskId, userId);
  if (!collaborator) return null;
  return collaborator.update({ role });
};

export const getCollaboratorRole = async (taskId: number, userId: number): Promise<CollaboratorRole | null> => {
  const collaborator = await findOne(taskId, userId);
  return collaborator ? collaborator.role : null;
};
