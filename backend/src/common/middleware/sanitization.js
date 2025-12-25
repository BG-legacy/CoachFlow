/**
 * Input Sanitization Middleware
 * Protects against XSS, NoSQL injection, and other injection attacks
 */

const logger = require('../utils/logger');

/**
 * Sanitize string to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  // Remove potential XSS patterns
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<\s*embed\b[^>]*>/gi, '')
    .replace(/<\s*object\b[^>]*>/gi, '');
};

/**
 * Detect and block NoSQL injection patterns
 * @param {any} value - Value to check
 * @returns {boolean} - True if injection detected
 */
const detectNoSQLInjection = (value) => {
  if (typeof value === 'string') {
    // Check for MongoDB operators
    const injectionPatterns = [
      /\$where/i,
      /\$ne(?![a-z])/i,
      /\$gt/i,
      /\$gte/i,
      /\$lt/i,
      /\$lte/i,
      /\$in(?![a-z])/i,
      /\$nin/i,
      /\$or(?![a-z])/i,
      /\$and/i,
      /\$not(?![a-z])/i,
      /\$nor/i,
      /\$exists/i,
      /\$type/i,
      /\$regex/i,
      /\$expr/i,
    ];

    return injectionPatterns.some((pattern) => pattern.test(value));
  }

  if (typeof value === 'object' && value !== null) {
    // Check for object keys that are MongoDB operators
    const keys = Object.keys(value);
    return keys.some((key) => key.startsWith('$'));
  }

  return false;
};

/**
 * Detect SQL injection patterns
 * @param {string} value - Value to check
 * @returns {boolean} - True if injection detected
 */
const detectSQLInjection = (value) => {
  if (typeof value !== 'string') return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(\bOR\b.*?=.*?)/gi,
    /(;|\-\-|\/\*|\*\/|xp_)/gi,
    /('|(\\')|(--|;)|(\%27)|(\%23))/gi,
  ];

  return sqlPatterns.some((pattern) => pattern.test(value));
};

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @param {number} depth - Current recursion depth
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj, depth = 0) => {
  // Prevent deep recursion attacks
  if (depth > 10) {
    logger.warn('Object sanitization depth limit reached');
    return {};
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'object') {
        return sanitizeObject(item, depth + 1);
      }
      return typeof item === 'string' ? sanitizeString(item) : item;
    });
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Remove keys that look like MongoDB operators
      if (key.startsWith('$')) {
        logger.warn(`Blocked potential NoSQL injection: ${key}`);
        continue;
      }

      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware to sanitize request inputs
 */
const sanitizeInputs = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      // Check for injection attacks
      const bodyStr = JSON.stringify(req.body);

      if (detectNoSQLInjection(bodyStr)) {
        logger.warn('NoSQL injection attempt detected', {
          ip: req.ip,
          path: req.path,
          body: req.body,
        });
        return res.status(400).json({
          requestId: req.id,
          timestamp: new Date().toISOString(),
          data: null,
          error: {
            message: 'Invalid input detected',
            statusCode: 400,
          },
          meta: {},
        });
      }

      if (detectSQLInjection(bodyStr)) {
        logger.warn('SQL injection attempt detected', {
          ip: req.ip,
          path: req.path,
        });
        return res.status(400).json({
          requestId: req.id,
          timestamp: new Date().toISOString(),
          data: null,
          error: {
            message: 'Invalid input detected',
            statusCode: 400,
          },
          meta: {},
        });
      }

      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error('Error in sanitization middleware:', error);
    next(error);
  }
};

/**
 * Validate that input doesn't contain common injection patterns
 */
const validateAgainstInjection = (value, fieldName = 'input') => {
  const errors = [];

  if (detectNoSQLInjection(value)) {
    errors.push({
      field: fieldName,
      message: 'Input contains invalid characters',
    });
  }

  if (typeof value === 'string' && detectSQLInjection(value)) {
    errors.push({
      field: fieldName,
      message: 'Input contains invalid characters',
    });
  }

  return errors;
};

module.exports = {
  sanitizeInputs,
  sanitizeString,
  sanitizeObject,
  detectNoSQLInjection,
  detectSQLInjection,
  validateAgainstInjection,
};
