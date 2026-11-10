const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(ApiResponse.success('User registered successfully', result, 201));
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(ApiResponse.success('Login successful', result));
  } catch (error) {
    next(error);
  }
};
