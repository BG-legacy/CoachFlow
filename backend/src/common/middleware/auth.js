/**
 * Authentication Middleware
 */

const { verifyAccessToken } = require('../utils/security');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { asyncHandler } = require('./errorHandler');
const User = require('../../modules/auth/models/user.model');
const TokenBlacklist = require('../../modules/auth/models/tokenBlacklist.model');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }

  const token = authHeader.split(' ')[1];

  // Check if token is blacklisted
  const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
  if (isBlacklisted) {
    throw new UnauthorizedError('Token has been revoked');
  }

  // Verify token
  const decoded = verifyAccessToken(token);

  // Get user from database
  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated');
  }

  // Attach user to request
  req.user = user;
  next();
});

/**
 * Check if user has required role(s)
 * @param  {...String} roles - Allowed roles
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }

  if (!roles.includes(req.user.role)) {
    throw new ForbiddenError('Insufficient permissions');
  }

  next();
};

/**
 * Optional authentication - attaches user if token is valid but doesn't fail if not
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we don't fail - just continue without user
    }
  }

  next();
});

/**
 * Check if user owns the resource or is admin
 */
const checkOwnership = (userIdField = 'userId') => (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }

  const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];

  if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
    return next();
  }

  throw new ForbiddenError('You do not have permission to access this resource');
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkOwnership,
};
