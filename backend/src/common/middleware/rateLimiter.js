/**
 * Rate Limiting Middleware
 * Multiple rate limiters for different endpoint types
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Global API rate limiter
 * Applied to all API routes
 */
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.max, // 100 requests per window
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      requestId: req.id,
      timestamp: new Date().toISOString(),
      data: null,
      error: {
        message: 'Too many requests from this IP, please try again later.',
        statusCode: 429,
      },
      meta: {
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'production' ? 5 : 20, // 5 requests per window in prod, 20 in dev
  skipSuccessfulRequests: false,
  message: {
    error: {
      message: 'Too many authentication attempts, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      path: req.path,
      email: req.body?.email,
    });
    res.status(429).json({
      requestId: req.id,
      timestamp: new Date().toISOString(),
      data: null,
      error: {
        message: 'Too many authentication attempts. Please try again later.',
        statusCode: 429,
      },
      meta: {
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
});

/**
 * Stricter rate limiter for login attempts
 * More restrictive to prevent brute force
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'production' ? 3 : 10, // 3 attempts per window in prod
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    error: {
      message: 'Too many login attempts, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Login rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      email: req.body?.email,
    });
    res.status(429).json({
      requestId: req.id,
      timestamp: new Date().toISOString(),
      data: null,
      error: {
        message: 'Too many login attempts. Please try again later.',
        statusCode: 429,
        details: 'For security reasons, this account has been temporarily locked.',
      },
      meta: {
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
});

/**
 * Rate limiter for AI/analysis endpoints
 * More restrictive due to computational cost
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.env === 'production' ? 10 : 50, // 10 requests per hour in prod
  message: {
    error: {
      message: 'AI analysis rate limit exceeded. Please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`AI rate limit exceeded for user: ${req.user?.id}`, {
      userId: req.user?.id,
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      requestId: req.id,
      timestamp: new Date().toISOString(),
      data: null,
      error: {
        message: 'AI analysis rate limit exceeded. Please try again later.',
        statusCode: 429,
        details: 'You have reached the maximum number of AI analysis requests.',
      },
      meta: {
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
});

/**
 * Rate limiter for password reset requests
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.env === 'production' ? 3 : 10, // 3 requests per hour
  message: {
    error: {
      message: 'Too many password reset requests, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for registration
 */
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.env === 'production' ? 3 : 10, // 3 registrations per hour per IP
  message: {
    error: {
      message: 'Too many registration attempts, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for file uploads
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.env === 'production' ? 20 : 100, // 20 uploads per hour
  message: {
    error: {
      message: 'Upload rate limit exceeded, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  loginLimiter,
  aiLimiter,
  passwordResetLimiter,
  registrationLimiter,
  uploadLimiter,
};
