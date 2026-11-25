import type { ErrorRequestHandler, Request, Response } from 'express';
import ApiError from '../../src/utils/apiError';

// errorMiddleware reads NODE_ENV once, at import time, so each test loads it with its own env.
// The module has to be loaded again inside isolateModules, which is why it uses require().
const loadMiddleware = (nodeEnv: string): ErrorRequestHandler => {
  let middleware: ErrorRequestHandler | undefined;
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  jest.isolateModules(() => {
    middleware = (require('../../src/middlewares/errorMiddleware') as typeof import('../../src/middlewares/errorMiddleware')).default;
  });
  process.env.NODE_ENV = previous;
  if (!middleware) throw new Error('errorMiddleware failed to load');
  return middleware;
};

// Only the parts of Response that the middleware uses.
const mockRes = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

type MockRes = ReturnType<typeof mockRes>;

const run = (nodeEnv: string, err: unknown, res: MockRes = mockRes()): MockRes => {
  loadMiddleware(nodeEnv)(err, {} as Request, res as unknown as Response, jest.fn());
  return res;
};

describe('errorMiddleware', () => {
  let consoleSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleSpy.mockRestore());

  it('returns the ApiError status and message', () => {
    const res = run('production', new ApiError(404, 'Task not found'));

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0]).toMatchObject({ status: 'error', statusCode: 404, message: 'Task not found' });
  });

  it('includes the stack trace in development', () => {
    const res = run('development', new Error('boom'));

    const body = res.json.mock.calls[0][0];
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('boom');
    expect(body.details.stack).toContain('boom');
  });

  it('never exposes the stack or the internal message in production', () => {
    const res = run('production', new Error('SQL error: relation "users" does not exist'));

    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(500);
    expect(body.message).toBe('Internal Server Error');
    expect(body).not.toHaveProperty('details');
  });

  it('logs unexpected (500) errors server-side outside tests', () => {
    run('production', new Error('boom'));

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('does not log expected client errors (4xx)', () => {
    run('production', new ApiError(403, 'nope'));

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
