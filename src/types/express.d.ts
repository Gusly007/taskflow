import type { TokenPayload } from '../utils/jwt';

// Declaration merging: adds req.user (set by authMiddleware) to Express's Request type.
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export {};
