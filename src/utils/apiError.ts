// An error we throw on purpose, with the HTTP status to send (404, 403...).
// errorMiddleware turns it into the standard ApiResponse error body.
export default class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
