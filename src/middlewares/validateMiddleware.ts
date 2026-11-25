import type { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import ApiError from '../utils/apiError';

const validateMiddleware: RequestHandler = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    return next(new ApiError(400, messages));
  }
  next();
};

export default validateMiddleware;
