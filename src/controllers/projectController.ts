import type { RequestHandler } from 'express';
import * as projectService from '../services/projectService';
import { currentUserId } from '../middlewares/authMiddleware';
import ApiResponse from '../utils/apiResponse';
import type { ProjectMemberRole } from '../models/ProjectMember';

// URL params are always strings; projectValidator has checked they are positive integers.
type ProjectParams = { id: string };
type MemberParams = { id: string; userId: string };

interface AddMemberBody {
  userId: number;
  role?: ProjectMemberRole;
}

export const create: RequestHandler<object, unknown, projectService.CreateProjectInput> = async (req, res, next) => {
  try {
    const project = await projectService.create(currentUserId(req), req.body);
    res.status(201).json(ApiResponse.success('Project created successfully', project, 201));
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const projects = await projectService.list(currentUserId(req));
    res.status(200).json(ApiResponse.success('Projects retrieved successfully', projects));
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler<ProjectParams> = async (req, res, next) => {
  try {
    const project = await projectService.getById(req.params.id, currentUserId(req));
    res.status(200).json(ApiResponse.success('Project retrieved successfully', project));
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler<ProjectParams, unknown, projectService.UpdateProjectInput> = async (
  req,
  res,
  next,
) => {
  try {
    const project = await projectService.update(req.params.id, currentUserId(req), req.body);
    res.status(200).json(ApiResponse.success('Project updated successfully', project));
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler<ProjectParams> = async (req, res, next) => {
  try {
    await projectService.remove(req.params.id, currentUserId(req));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const listMembers: RequestHandler<ProjectParams> = async (req, res, next) => {
  try {
    const members = await projectService.getMembers(req.params.id, currentUserId(req));
    res.status(200).json(ApiResponse.success('Members retrieved successfully', members));
  } catch (error) {
    next(error);
  }
};

export const addMember: RequestHandler<ProjectParams, unknown, AddMemberBody> = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const member = await projectService.addMember(req.params.id, currentUserId(req), userId, role);
    res.status(201).json(ApiResponse.success('Member added successfully', member, 201));
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole: RequestHandler<MemberParams, unknown, { role: ProjectMemberRole }> = async (
  req,
  res,
  next,
) => {
  try {
    const targetUserId = Number.parseInt(req.params.userId, 10);
    const member = await projectService.updateMemberRole(req.params.id, currentUserId(req), targetUserId, req.body.role);
    res.status(200).json(ApiResponse.success('Role updated successfully', member));
  } catch (error) {
    next(error);
  }
};

export const removeMember: RequestHandler<MemberParams> = async (req, res, next) => {
  try {
    const targetUserId = Number.parseInt(req.params.userId, 10);
    await projectService.removeMember(req.params.id, currentUserId(req), targetUserId);
    res.status(200).json(ApiResponse.success('Member removed successfully'));
  } catch (error) {
    next(error);
  }
};
