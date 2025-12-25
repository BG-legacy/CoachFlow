/**
 * Global Error Handler Middleware
 */

const logger = require('../utils/logger');
const { APIError } = require('../utils/errors');
const config = require('../config');

/**
 * Handle operational errors
 */
const handleOperationalError = (err, res, req) => {
  const response = {
    requestId: req.id || 'unknown',
    timestamp: new Date().toISOString(),
    data: null,
    error: {
      message: err.message,
      statusCode: err.statusCode,
      ...(err.errors && { details: err.errors }),
    },
    meta: {},
  };

  return res.status(err.statusCode).json(response);
};

/**
 * Handle programming/system errors
 */
const handleProgrammingError = (err, res, req) => {
  logger.error('Programming Error:', {
    message: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    requestId: req.id || 'unknown',
    timestamp: new Date().toISOString(),
    data: null,
    error: {
      message: config.env === 'development' ? err.message : 'Internal server error',
      statusCode: 500,
      ...(config.env === 'development' && { stack: err.stack }),
    },
    meta: {},
  });
};

/**
 * Handle MongoDB errors
 */
const handleMongoError = (err) => {
  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const error = new APIError(`${field} already exists`, 409);
    return error;
  }

  // Cast error
  if (err.name === 'CastError') {
    const error = new APIError(`Invalid ${err.path}: ${err.value}`, 400);
    return error;
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    const error = new APIError('Validation failed', 422);
    error.errors = errors;
    return error;
  }

  return err;
};

/**
 * Handle JWT errors
 */
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new APIError('Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return new APIError('Token expired', 401);
  }
  return err;
};

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
  });

  // Handle specific error types
  let error = err;

  // MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError' || err.name === 'CastError' || err.name === 'ValidationError') {
    error = handleMongoError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }

  // Operational errors
  if (error instanceof APIError && error.isOperational) {
    return handleOperationalError(error, res, req);
  }

  // Programming/unknown errors
  return handleProgrammingError(error, res, req);
};

/**
 * Handle 404 - Not Found
 */
const notFoundHandler = (req, res) => res.status(404).json({
  requestId: req.id || 'unknown',
  timestamp: new Date().toISOString(),
  data: null,
  error: {
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
  },
  meta: {},
});

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
