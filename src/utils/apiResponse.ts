// Pagination info sent with list responses.
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SuccessBody<T> {
  status: 'success';
  statusCode: number;
  message: string;
  data: T | null;
  date: string;
  meta?: PageMeta;
}

export interface ErrorBody {
  status: 'error';
  statusCode: number;
  message: string;
  date: string;
  details?: Record<string, unknown>;
}

export default class ApiResponse {
  // meta is optional (e.g. pagination for lists).
  static success<T>(message: string, data: T | null = null, statusCode = 200, meta?: PageMeta): SuccessBody<T> {
    const body: SuccessBody<T> = {
      status: 'success',
      statusCode,
      message,
      data,
      date: new Date().toISOString(),
    };
    if (meta) body.meta = meta;
    return body;
  }

  // details is only set in development (see errorMiddleware), never in production.
  static error(message: string, statusCode = 500, details?: Record<string, unknown>): ErrorBody {
    const body: ErrorBody = {
      status: 'error',
      statusCode,
      message,
      date: new Date().toISOString(),
    };
    if (details) body.details = details;
    return body;
  }
}
