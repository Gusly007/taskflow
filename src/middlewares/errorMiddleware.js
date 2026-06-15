const { NODE_ENV } = require('../config/env');
const ApiResponse = require('../utils/apiResponse');

module.exports = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const details = NODE_ENV === 'development' ? { stack: err.stack } : null;

  res.status(statusCode).json(ApiResponse.error(message, statusCode, details));
};
