import type { ErrorRequestHandler } from 'express';
import { NODE_ENV } from '../config/env';
import ApiResponse from '../utils/apiResponse';

// Anything can be thrown in JavaScript; we only rely on these optional fields.
type ThrownError = Partial<Error> & { statusCode?: number };

const errorMiddleware: ErrorRequestHandler = (err: ThrownError, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;
  const isDev = NODE_ENV === 'development';

  // Unexpected errors are logged server-side so they are not lost.
  if (isServerError && NODE_ENV !== 'test') console.error(err);

  // Outside development, never send internal error messages (SQL errors, file paths...) to the client.
  const message = isServerError && !isDev ? 'Internal Server Error' : err.message || 'Internal Server Error';
  const details = isDev ? { stack: err.stack } : undefined;

  res.status(statusCode).json(ApiResponse.error(message, statusCode, details));
};

export default errorMiddleware;
