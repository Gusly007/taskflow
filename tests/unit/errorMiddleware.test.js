const ApiError = require('../../src/utils/apiError');

// errorMiddleware reads NODE_ENV once, at require time, so each test loads it with its own env.
const loadMiddleware = (nodeEnv) => {
  let middleware;
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  jest.isolateModules(() => {
    middleware = require('../../src/middlewares/errorMiddleware');
  });
  process.env.NODE_ENV = previous;
  return middleware;
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorMiddleware', () => {
  let consoleSpy;
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleSpy.mockRestore());

  it('returns the ApiError status and message', () => {
    const res = mockRes();
    loadMiddleware('production')(new ApiError(404, 'Task not found'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0]).toMatchObject({ status: 'error', statusCode: 404, message: 'Task not found' });
  });

  it('includes the stack trace in development', () => {
    const res = mockRes();
    loadMiddleware('development')(new Error('boom'), {}, res, jest.fn());

    const body = res.json.mock.calls[0][0];
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('boom');
    expect(body.details.stack).toContain('boom');
  });

  it('never exposes the stack or the internal message in production', () => {
    const res = mockRes();
    loadMiddleware('production')(new Error('SQL error: relation "users" does not exist'), {}, res, jest.fn());

    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(500);
    expect(body.message).toBe('Internal Server Error');
    expect(body).not.toHaveProperty('details');
  });

  it('logs unexpected (500) errors server-side outside tests', () => {
    loadMiddleware('production')(new Error('boom'), {}, mockRes(), jest.fn());

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('does not log expected client errors (4xx)', () => {
    loadMiddleware('production')(new ApiError(403, 'nope'), {}, mockRes(), jest.fn());

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
