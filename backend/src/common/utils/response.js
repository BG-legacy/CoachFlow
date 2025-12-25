/**
 * Standardized API Response Utility
 * Ensures consistent response format across all endpoints
 *
 * Response Envelope Standard:
 * - data: The actual response payload
 * - error: Error details (only present in error responses)
 * - meta: Metadata about the response (pagination, timestamps, etc.)
 * - requestId: Unique identifier for request tracing
 */

/**
 * Build base response structure with requestId and timestamp
 * @param {Object} req - Express request object
 * @returns {Object} Base response structure
 */
const buildBaseResponse = (req) => ({
  requestId: req.id || req.headers['x-request-id'] || 'unknown',
  timestamp: new Date().toISOString(),
});

/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} meta - Additional metadata
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
  const baseResponse = buildBaseResponse(res.req);

  const response = {
    ...baseResponse,
    data,
    error: null,
    meta: {
      message,
      ...meta,
    },
  };

  return res.status(statusCode).json(response);
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {Array} errors - Validation errors (optional)
 * @param {Object} meta - Additional metadata
 */
const errorResponse = (res, message = 'Error', statusCode = 500, errors = null, meta = {}) => {
  const baseResponse = buildBaseResponse(res.req);

  const response = {
    ...baseResponse,
    data: null,
    error: {
      message,
      statusCode,
      ...(errors && { details: errors }),
    },
    meta: {
      ...meta,
    },
  };

  return res.status(statusCode).json(response);
};

/**
 * Paginated Response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 * @param {String} message - Success message
 * @param {Object} additionalMeta - Additional metadata
 */
const paginatedResponse = (
  res,
  data = [],
  page = 1,
  limit = 10,
  total = 0,
  message = 'Success',
  additionalMeta = {},
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const baseResponse = buildBaseResponse(res.req);

  const response = {
    ...baseResponse,
    data,
    error: null,
    meta: {
      message,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      ...additionalMeta,
    },
  };

  return res.status(200).json(response);
};

/**
 * Created Response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {String} message - Success message
 * @param {Object} meta - Additional metadata
 */
const createdResponse = (res, data = null, message = 'Resource created successfully', meta = {}) => successResponse(res, data, message, 201, meta);

/**
 * No Content Response
 * @param {Object} res - Express response object
 */
const noContentResponse = (res) => {
  const baseResponse = buildBaseResponse(res.req);
  return res.status(204).json({
    ...baseResponse,
    data: null,
    error: null,
    meta: {
      message: 'No content',
    },
  });
};

/**
 * Accepted Response (for async operations)
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message
 * @param {Object} meta - Additional metadata
 */
const acceptedResponse = (res, data = null, message = 'Request accepted for processing', meta = {}) => successResponse(res, data, message, 202, meta);

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  acceptedResponse,
  buildBaseResponse,
};
