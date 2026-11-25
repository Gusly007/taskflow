import type { Request, RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import * as taskService from '../services/taskService';
import { currentUserId } from '../middlewares/authMiddleware';
import ApiResponse from '../utils/apiResponse';

type TaskParams = { id: string };

// Validated + sanitized query params (?status=todo,done&page=2 -> { status: ['todo','done'], page: 2 }).
// matchedData() returns an untyped object; validateListTasks guarantees this shape.
const listQuery = (req: Request): taskService.ListTasksQuery =>
  matchedData(req, { locations: ['query'] }) as taskService.ListTasksQuery;

export const create: RequestHandler<object, unknown, taskService.CreateTaskInput> = async (req, res, next) => {
  try {
    const task = await taskService.create(currentUserId(req), req.body);
    res.status(201).json(ApiResponse.success('Task created successfully', task, 201));
  } catch (error) {
    next(error);
  }
};

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    const { items, meta } = await taskService.getAllByUser(currentUserId(req), listQuery(req));
    res.status(200).json(ApiResponse.success('Tasks retrieved successfully', items, 200, meta));
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler<TaskParams> = async (req, res, next) => {
  try {
    const task = await taskService.getById(req.params.id, currentUserId(req));
    res.status(200).json(ApiResponse.success('Task retrieved successfully', task));
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler<TaskParams, unknown, taskService.UpdateTaskInput> = async (req, res, next) => {
  try {
    const task = await taskService.update(req.params.id, currentUserId(req), req.body);
    res.status(200).json(ApiResponse.success('Task updated successfully', task));
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
    const { items, meta } = await taskService.getMyTasks(currentUserId(req), listQuery(req));
    res.status(200).json(ApiResponse.success('My tasks retrieved successfully', items, 200, meta));
  } catch (error) {
    next(error);
  }
};
