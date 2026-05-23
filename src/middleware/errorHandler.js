const logger = require('../utils/logger');

/**
 * Global error handler middleware
 * All errors should be caught and passed to next(error)
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Don't leak sensitive information in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = {
    success: false,
    error: isDevelopment ? message : 'An error occurred',
    ...(isDevelopment && err.stack && { stack: err.stack }),
  };

  logger.error(
    {
      status,
      message,
      path: req.path,
      method: req.method,
      userId: req.user?.userId,
      stack: err.stack,
    },
    'Error occurred'
  );

  res.status(status).json(errorResponse);
}

/**
 * Wrap async route handlers to catch errors
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler,
};