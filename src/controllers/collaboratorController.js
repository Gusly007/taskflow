const collaboratorService = require('../services/collaboratorService');
const ApiResponse = require('../utils/apiResponse');

exports.add = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const targetUserId = parseInt(req.body.userId);
    const { role } = req.body;
    const collaborator = await collaboratorService.addCollaborator(taskId, req.user.id, targetUserId, role);
    res.status(201).json(ApiResponse.success('Collaborator added successfully', collaborator));
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    await collaboratorService.removeCollaborator(taskId, req.user.id, targetUserId);
    res.status(200).json(ApiResponse.success('Collaborator removed successfully'));
  } catch (error) {
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const { role } = req.body;
    const collaborator = await collaboratorService.updateCollaboratorRole(taskId, req.user.id, targetUserId, role);
    res.status(200).json(ApiResponse.success('Role updated successfully', collaborator));
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const collaborators = await collaboratorService.getCollaborators(taskId);
    res.status(200).json(ApiResponse.success('Collaborators retrieved successfully', collaborators));
  } catch (error) {
    next(error);
  }
};
