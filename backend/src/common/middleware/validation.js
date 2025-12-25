/**
 * Request Validation Middleware
 * Validates request body, query, and params using express-validator
 */

const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { APIError } = require('../utils/errors');

/**
 * Validate request and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    logger.warn('Request validation failed', {
      path: req.path,
      method: req.method,
      errors: errorDetails,
      requestId: req.id,
    });

    return res.status(422).json({
      requestId: req.id,
      timestamp: new Date().toISOString(),
      data: null,
      error: {
        message: 'Validation failed',
        statusCode: 422,
        details: errorDetails,
      },
      meta: {},
    });
  }

  next();
};

/**
 * Validate that request body is not empty
 */
const requireBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new APIError('Request body is required', 400);
  }
  next();
};

/**
 * Validate that specific fields exist in request body
 */
const requireFields = (fields) => (req, res, next) => {
  const missingFields = [];

  for (const field of fields) {
    if (req.body[field] === undefined || req.body[field] === null) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return res.status(400).json({
      requestId: req.id,
      timestamp: new Date().toISOString(),
      data: null,
      error: {
        message: 'Missing required fields',
        statusCode: 400,
        details: missingFields.map((field) => ({
          field,
          message: `${field} is required`,
        })),
      },
      meta: {},
    });
  }

  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  // Validate range
  if (page < 1) {
    throw new APIError('Page must be greater than 0', 400);
  }

  if (limit < 1 || limit > 100) {
    throw new APIError('Limit must be between 1 and 100', 400);
  }

  // Attach validated values to request
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
  };

  next();
};

/**
 * Validate sort parameters
 */
const validateSort = (allowedFields = []) => (req, res, next) => {
  if (!req.query.sort) {
    req.sort = {};
    return next();
  }

  const sortParts = req.query.sort.split(',');
  const sort = {};

  for (const part of sortParts) {
    const trimmed = part.trim();
    const isDescending = trimmed.startsWith('-');
    const field = isDescending ? trimmed.slice(1) : trimmed;

    // Validate field if allowed fields are specified
    if (allowedFields.length > 0 && !allowedFields.includes(field)) {
      throw new APIError(`Sort field '${field}' is not allowed`, 400);
    }

    sort[field] = isDescending ? -1 : 1;
  }

  req.sort = sort;
  next();
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const mongoose = require('mongoose');
  const id = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(`Invalid ${paramName} format`, 400);
  }

  next();
};

/**
 * Validate date range parameters
 */
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate && isNaN(Date.parse(startDate))) {
    throw new APIError('Invalid startDate format', 400);
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    throw new APIError('Invalid endDate format', 400);
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new APIError('startDate must be before endDate', 400);
    }
  }

  next();
};

/**
 * Sanitize and validate search query
 */
const validateSearch = (req, res, next) => {
  if (req.query.search) {
    const search = req.query.search.trim();

    // Limit search length
    if (search.length > 100) {
      throw new APIError('Search query too long', 400);
    }

    // Remove special characters for safety
    req.query.search = search.replace(/[^a-zA-Z0-9\s]/g, '');
  }

  next();
};

/**
 * Validate request content type
 */
const validateContentType = (expectedType = 'application/json') => (req, res, next) => {
  const contentType = req.get('Content-Type');

  if (req.method !== 'GET' && req.method !== 'DELETE'
        && (!contentType || !contentType.includes(expectedType))) {
    throw new APIError(`Content-Type must be ${expectedType}`, 415);
  }

  next();
};

/**
 * Validate API version in request
 */
const validateApiVersion = (req, res, next) => {
  const requestedVersion = req.params.version || req.get('X-API-Version');
  const config = require('../config');

  if (requestedVersion && requestedVersion !== config.apiVersion) {
    return res.status(400).json({
      requestId: req.id,
      timestamp: new Date().toISOString(),
      data: null,
      error: {
        message: `API version ${requestedVersion} is not supported`,
        statusCode: 400,
        details: {
          requestedVersion,
          supportedVersion: config.apiVersion,
        },
      },
      meta: {},
    });
  }

  next();
};

/**
 * Prevent parameter pollution
 */
const preventParameterPollution = (allowedDuplicates = []) => (req, res, next) => {
  // Check for duplicate query parameters
  const { originalUrl } = req;
  const queryString = originalUrl.split('?')[1];

  if (queryString) {
    const params = queryString.split('&');
    const paramMap = {};

    for (const param of params) {
      const [key] = param.split('=');

      if (paramMap[key] && !allowedDuplicates.includes(key)) {
        logger.warn('Parameter pollution detected', {
          ip: req.ip,
          path: req.path,
          duplicateParam: key,
        });

        throw new APIError('Duplicate parameters are not allowed', 400);
      }

      paramMap[key] = true;
    }
  }

  next();
};

module.exports = {
  validate,
  requireBody,
  requireFields,
  validatePagination,
  validateSort,
  validateObjectId,
  validateDateRange,
  validateSearch,
  validateContentType,
  validateApiVersion,
  preventParameterPollution,
};
