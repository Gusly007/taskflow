import type { Request, RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt';
import ApiError from '../utils/apiError';

const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  try {
    const token = header.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

/**
 * Id of the logged-in user, for routes behind authMiddleware.
 * req.user is optional in the types (public routes have none), so this
 * turns "maybe undefined" into a number, or a 401 if the route forgot the middleware.
 */
export const currentUserId = (req: Pick<Request, 'user'>): number => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  return req.user.id;
};

export default authMiddleware;
