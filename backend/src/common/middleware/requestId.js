/**
 * Request ID Middleware
 * Generates or extracts a unique identifier for each request
 * Used for request tracing and logging
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to add unique request ID to each request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID from header if present, otherwise generate new one
  const requestId = req.headers['x-request-id'] || uuidv4();

  // Attach to request object
  req.id = requestId;

  // Add to response headers for client-side tracing
  res.setHeader('X-Request-ID', requestId);

  next();
};

module.exports = requestIdMiddleware;
