const { matchedData } = require('express-validator');
const taskService = require('../services/taskService');
const ApiResponse = require('../utils/apiResponse');

// Validated + sanitized query params (?status=todo,done&page=2 -> { status: ['todo','done'], page: 2 })
const listQuery = (req) => matchedData(req, { locations: ['query'] });
exports.create = async (req, res, next) => {
  try {
    const task = await taskService.create(req.user.id, req.body);
    res.status(201).json(ApiResponse.success('Task created successfully', task, 201));
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { items, meta } = await taskService.getAllByUser(req.user.id, listQuery(req));
    res.status(200).json(ApiResponse.success('Tasks retrieved successfully', items, 200, meta));
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const task = await taskService.getById(req.params.id, req.user.id);
    res.status(200).json(ApiResponse.success('Task retrieved successfully', task));
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const task = await taskService.update(req.params.id, req.user.id, req.body);
    res.status(200).json(ApiResponse.success('Task updated successfully', task));
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await taskService.remove(req.params.id, req.user.id);
    // 204 No Content: HTTP forbids a body, so we send none.
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

exports.getMine = async (req, res, next) => {
  try {
    const { items, meta } = await taskService.getMyTasks(req.user.id, listQuery(req));
    res.status(200).json(ApiResponse.success('My tasks retrieved successfully', items, 200, meta));
  } catch (error) {
    next(error);
  }
};
