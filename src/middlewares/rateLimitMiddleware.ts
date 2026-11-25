import { rateLimit, type Options } from 'express-rate-limit';
import ApiError from '../utils/apiError';
import { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MINUTES } from '../config/env';

const tooManyAttempts: Options['handler'] = (_req, _res, next, options) =>
  next(new ApiError(options.statusCode, 'Too many attempts, please try again later'));

const common: Partial<Options> = {
  windowMs: AUTH_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8', // RateLimit / RateLimit-Policy headers
  legacyHeaders: false,
  handler: tooManyAttempts, // 429 in the usual ApiResponse error format
};

// Brute-force protection: only FAILED logins count, so a user who types
// the right password is never slowed down. Per IP, in memory.
export const loginLimiter = rateLimit({ ...common, skipSuccessfulRequests: true });

// Limits account creation spam from a single IP.
export const registerLimiter = rateLimit({ ...common });
