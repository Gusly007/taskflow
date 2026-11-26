import type { Request, RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import * as taskService from '../services/taskService';
import { currentUserId } from '../middlewares/authMiddleware';
import ApiResponse from '../utils/apiResponse';

type TaskParams = { id: string };

// Validated + sanitized query params (?status=todo,done&page=2 -> { status: ['todo','done'], page: 2 }).
// matchedData() returns an untyped object; validateListTasks guarantees this shape.
//
// Every task sent back is a TaskView: the task plus the caller's `role` on it and `isOverdue`.
const listQuery = (req: Request): taskService.ListTasksQuery =>
  matchedData(req, { locations: ['query'] }) as taskService.ListTasksQuery;

export const create: RequestHandler<object, unknown, taskService.CreateTaskInput> = async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const task = await taskService.create(userId, req.body);
    res.status(201).json(ApiResponse.success('Task created successfully', await taskService.toTaskView(task, userId), 201));
  } catch (error) {
    next(error);
  }
};

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const { items, meta } = await taskService.getAllByUser(userId, listQuery(req));
    const views = await taskService.toTaskViews(items, userId);
    res.status(200).json(ApiResponse.success('Tasks retrieved successfully', views, 200, meta));
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler<TaskParams> = async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const task = await taskService.getById(req.params.id, userId);
    res.status(200).json(ApiResponse.success('Task retrieved successfully', await taskService.toTaskView(task, userId)));
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler<TaskParams, unknown, taskService.UpdateTaskInput> = async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const task = await taskService.update(req.params.id, userId, req.body);
    const view = task && (await taskService.toTaskView(task, userId));
    res.status(200).json(ApiResponse.success('Task updated successfully', view));
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler<TaskParams> = async (req, res, next) => {
  try {
    await taskService.remove(req.params.id, currentUserId(req));
    // 204 No Content: HTTP forbids a body, so we send none.
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const getMine: RequestHandler = async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const { items, meta } = await taskService.getMyTasks(userId, listQuery(req));
    const views = await taskService.toTaskViews(items, userId);
    res.status(200).json(ApiResponse.success('My tasks retrieved successfully', views, 200, meta));
  } catch (error) {
    next(error);
  }
};
