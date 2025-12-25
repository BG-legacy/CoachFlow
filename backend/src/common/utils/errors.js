/**
 * Custom Error Types
 * Centralized error handling with custom error classes
 */

/**
 * Base API Error
 */
class APIError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request
 */
class BadRequestError extends APIError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized
 */
class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized - Invalid credentials') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 */
class ForbiddenError extends APIError {
  constructor(message = 'Forbidden - Insufficient permissions') {
    super(message, 403);
  }
}

/**
 * 404 Not Found
 */
class NotFoundError extends APIError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * 409 Conflict
 */
class ConflictError extends APIError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * 422 Unprocessable Entity
 */
class ValidationError extends APIError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 422);
    this.errors = errors;
  }
}

/**
 * 429 Too Many Requests
 */
class RateLimitError extends APIError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429);
  }
}

/**
 * 500 Internal Server Error
 */
class InternalServerError extends APIError {
  constructor(message = 'Internal server error') {
    super(message, 500, false);
  }
}

/**
 * 503 Service Unavailable
 */
class ServiceUnavailableError extends APIError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, false);
  }
}

module.exports = {
  APIError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
};
