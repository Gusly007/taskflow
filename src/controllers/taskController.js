const taskService = require('../services/taskService');
const ApiResponse = require('../utils/apiResponse');
exports.create = async (req, res, next) => {
  try {
    const task = await taskService.create(req.user.id, req.body);
    res.status(201).json(ApiResponse.success('Task created successfully', task));
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const tasks = await taskService.getAllByUser(req.user.id);
    res.status(200).json(ApiResponse.success('Tasks retrieved successfully', tasks));
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
    res.status(204).json(ApiResponse.success('Task deleted successfully'));
  } catch (error) {
    next(error);
  }
};

exports.getMine = async (req, res, next) => {
  try {
    const tasks = await taskService.getMyTasks(req.user.id);
    res.status(200).json(ApiResponse.success('My tasks retrieved successfully', tasks));
  } catch (error) {
    next(error);
  }
};
