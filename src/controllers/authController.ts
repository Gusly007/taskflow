import type { RequestHandler } from 'express';
import * as authService from '../services/authService';
import ApiResponse from '../utils/apiResponse';

// RequestHandler<params, response body, request body>: the body was checked by authValidator.
export const register: RequestHandler<object, unknown, authService.RegisterInput> = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(ApiResponse.success('User registered successfully', result, 201));
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler<object, unknown, authService.LoginInput> = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(ApiResponse.success('Login successful', result));
  } catch (error) {
    next(error);
  }
};
