import type { RequestHandler } from 'express';
import * as collaboratorService from '../services/collaboratorService';
import { currentUserId } from '../middlewares/authMiddleware';
import ApiResponse from '../utils/apiResponse';
import type { CollaboratorRole } from '../models/TaskCollaborator';

// URL params are always strings; paramValidator has checked they are positive integers.
type TaskParams = { id: string };
type CollaboratorParams = { id: string; userId: string };

interface AddCollaboratorBody {
  userId: number | string;
  role?: CollaboratorRole;
}

export const add: RequestHandler<TaskParams, unknown, AddCollaboratorBody> = async (req, res, next) => {
  try {
    const taskId = Number.parseInt(req.params.id, 10);
    const targetUserId = Number.parseInt(String(req.body.userId), 10);
    const { role } = req.body;
    const collaborator = await collaboratorService.addCollaborator(taskId, currentUserId(req), targetUserId, role);
    res.status(201).json(ApiResponse.success('Collaborator added successfully', collaborator, 201));
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler<CollaboratorParams> = async (req, res, next) => {
  try {
    const taskId = Number.parseInt(req.params.id, 10);
    const targetUserId = Number.parseInt(req.params.userId, 10);
    await collaboratorService.removeCollaborator(taskId, currentUserId(req), targetUserId);
    res.status(200).json(ApiResponse.success('Collaborator removed successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateRole: RequestHandler<CollaboratorParams, unknown, { role: CollaboratorRole }> = async (
  req,
  res,
  next,
) => {
  try {
    const taskId = Number.parseInt(req.params.id, 10);
    const targetUserId = Number.parseInt(req.params.userId, 10);
    const { role } = req.body;
    const collaborator = await collaboratorService.updateCollaboratorRole(
      taskId,
      currentUserId(req),
      targetUserId,
      role,
    );
    res.status(200).json(ApiResponse.success('Role updated successfully', collaborator));
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler<TaskParams> = async (req, res, next) => {
  try {
    const taskId = Number.parseInt(req.params.id, 10);
    const collaborators = await collaboratorService.getCollaborators(taskId, currentUserId(req));
    res.status(200).json(ApiResponse.success('Collaborators retrieved successfully', collaborators));
  } catch (error) {
    next(error);
  }
};
