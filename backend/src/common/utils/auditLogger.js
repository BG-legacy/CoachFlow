/**
 * Audit Logging System
 * Logs sensitive actions for security and compliance
 */

const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Audit Event Types
 */
const AuditEventTypes = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',

  // Registration
  REGISTRATION_SUCCESS: 'REGISTRATION_SUCCESS',
  REGISTRATION_FAILURE: 'REGISTRATION_FAILURE',

  // Password Management
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
  PASSWORD_RESET_FAILURE: 'PASSWORD_RESET_FAILURE',

  // Account Management
  ACCOUNT_UPDATE: 'ACCOUNT_UPDATE',
  ACCOUNT_DELETION: 'ACCOUNT_DELETION',
  ACCOUNT_SUSPENSION: 'ACCOUNT_SUSPENSION',
  ACCOUNT_ACTIVATION: 'ACCOUNT_ACTIVATION',
  ACCOUNT_LINKED: 'ACCOUNT_LINKED',
  ACCOUNT_UNLINKED: 'ACCOUNT_UNLINKED',

  // Plan Management
  PLAN_CREATED: 'PLAN_CREATED',
  PLAN_UPDATED: 'PLAN_UPDATED',
  PLAN_DELETED: 'PLAN_DELETED',
  PLAN_ASSIGNED: 'PLAN_ASSIGNED',

  // Profile Management
  PROFILE_CREATED: 'PROFILE_CREATED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PROFILE_DELETED: 'PROFILE_DELETED',
  ONBOARDING_STEP_COMPLETED: 'ONBOARDING_STEP_COMPLETED',
  ONBOARDING_COMPLETED: 'ONBOARDING_COMPLETED',

  // Client Constraint Management
  CLIENT_CONSTRAINT_UPDATED: 'CLIENT_CONSTRAINT_UPDATED',
  CLIENT_CONSTRAINT_VIEWED: 'CLIENT_CONSTRAINT_VIEWED',

  // Admin Actions
  ADMIN_USER_CREATE: 'ADMIN_USER_CREATE',
  ADMIN_USER_UPDATE: 'ADMIN_USER_UPDATE',
  ADMIN_USER_DELETE: 'ADMIN_USER_DELETE',
  ADMIN_ROLE_CHANGE: 'ADMIN_ROLE_CHANGE',
  ADMIN_PERMISSION_CHANGE: 'ADMIN_PERMISSION_CHANGE',
  ADMIN_SETTINGS_UPDATE: 'ADMIN_SETTINGS_UPDATE',

  // Data Access
  SENSITIVE_DATA_ACCESS: 'SENSITIVE_DATA_ACCESS',
  BULK_DATA_EXPORT: 'BULK_DATA_EXPORT',

  // Security Events
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  INJECTION_ATTEMPT: 'INJECTION_ATTEMPT',
};

/**
 * Audit Event Schema
 */
const auditEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: Object.values(AuditEventTypes),
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
  },
  resource: {
    type: String,
    required: true,
  },
  resourceId: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
    index: true,
  },
  userAgent: {
    type: String,
  },
  success: {
    type: Boolean,
    default: true,
    index: true,
  },
  errorMessage: {
    type: String,
  },
  requestId: {
    type: String,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Create indexes for efficient querying
auditEventSchema.index({ eventType: 1, timestamp: -1 });
auditEventSchema.index({ userId: 1, timestamp: -1 });
auditEventSchema.index({ success: 1, timestamp: -1 });

const AuditEvent = mongoose.model('AuditEvent', auditEventSchema);

/**
 * Log an audit event
 */
const logAuditEvent = async (eventData) => {
  try {
    const {
      eventType,
      userId,
      targetUserId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success = true,
      errorMessage,
      requestId,
    } = eventData;

    // Create audit event
    const auditEvent = new AuditEvent({
      eventType,
      userId,
      targetUserId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success,
      errorMessage,
      requestId,
      timestamp: new Date(),
    });

    await auditEvent.save();

    // Also log to winston for immediate visibility
    logger.info('Audit Event', {
      eventType,
      userId: userId?.toString(),
      action,
      resource,
      success,
      ipAddress,
    });

    return auditEvent;
  } catch (error) {
    // Don't throw errors from audit logging - just log them
    logger.error('Failed to log audit event:', error);
  }
};

/**
 * Extract request metadata
 */
const extractRequestMetadata = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.get('user-agent'),
  requestId: req.id,
});

/**
 * Middleware to log audit events
 */
const auditMiddleware = (eventType, getDetails) => async (req, res, next) => {
  // Store original send function
  const originalSend = res.send;

  res.send = function (data) {
    // Log audit event after response is sent
    const metadata = extractRequestMetadata(req);
    const success = res.statusCode < 400;

    const details = typeof getDetails === 'function'
      ? getDetails(req, res)
      : {};

    logAuditEvent({
      eventType,
      userId: req.user?._id,
      action: `${req.method} ${req.path}`,
      resource: req.path,
      details,
      ...metadata,
      success,
      errorMessage: success ? null : data?.error?.message,
    }).catch((err) => {
      logger.error('Audit middleware error:', err);
    });

    // Call original send function
    originalSend.call(this, data);
  };

  next();
};

/**
 * Helper functions for common audit events
 */
const auditHelpers = {
  // Authentication
  loginSuccess: (req, userId) => logAuditEvent({
    eventType: AuditEventTypes.LOGIN_SUCCESS,
    userId,
    action: 'User logged in',
    resource: 'auth',
    ...extractRequestMetadata(req),
    success: true,
  }),

  loginFailure: (req, email, reason) => logAuditEvent({
    eventType: AuditEventTypes.LOGIN_FAILURE,
    action: 'Login attempt failed',
    resource: 'auth',
    details: { email, reason },
    ...extractRequestMetadata(req),
    success: false,
    errorMessage: reason,
  }),

  logout: (req, userId) => logAuditEvent({
    eventType: AuditEventTypes.LOGOUT,
    userId,
    action: 'User logged out',
    resource: 'auth',
    ...extractRequestMetadata(req),
    success: true,
  }),

  // Password Management
  passwordChange: (req, userId) => logAuditEvent({
    eventType: AuditEventTypes.PASSWORD_CHANGE,
    userId,
    action: 'Password changed',
    resource: 'auth',
    ...extractRequestMetadata(req),
    success: true,
  }),

  passwordResetRequest: (req, email) => logAuditEvent({
    eventType: AuditEventTypes.PASSWORD_RESET_REQUEST,
    action: 'Password reset requested',
    resource: 'auth',
    details: { email },
    ...extractRequestMetadata(req),
    success: true,
  }),

  // Account Linking
  accountLinked: (req, userId, provider) => logAuditEvent({
    eventType: AuditEventTypes.ACCOUNT_LINKED,
    userId,
    action: `${provider} account linked`,
    resource: 'auth',
    details: { provider },
    ...extractRequestMetadata(req),
    success: true,
  }),

  accountUnlinked: (req, userId, provider) => logAuditEvent({
    eventType: AuditEventTypes.ACCOUNT_UNLINKED,
    userId,
    action: `${provider} account unlinked`,
    resource: 'auth',
    details: { provider },
    ...extractRequestMetadata(req),
    success: true,
  }),

  // Plan Management
  planCreated: (req, planId, details) => logAuditEvent({
    eventType: AuditEventTypes.PLAN_CREATED,
    userId: req.user?._id,
    action: 'Plan created',
    resource: 'plan',
    resourceId: planId?.toString(),
    details,
    ...extractRequestMetadata(req),
    success: true,
  }),

  planUpdated: (req, planId, details) => logAuditEvent({
    eventType: AuditEventTypes.PLAN_UPDATED,
    userId: req.user?._id,
    action: 'Plan updated',
    resource: 'plan',
    resourceId: planId?.toString(),
    details,
    ...extractRequestMetadata(req),
    success: true,
  }),

  planDeleted: (req, planId) => logAuditEvent({
    eventType: AuditEventTypes.PLAN_DELETED,
    userId: req.user?._id,
    action: 'Plan deleted',
    resource: 'plan',
    resourceId: planId?.toString(),
    ...extractRequestMetadata(req),
    success: true,
  }),

  // Admin Actions
  adminUserUpdate: (req, targetUserId, changes) => logAuditEvent({
    eventType: AuditEventTypes.ADMIN_USER_UPDATE,
    userId: req.user?._id,
    targetUserId,
    action: 'Admin updated user',
    resource: 'user',
    resourceId: targetUserId?.toString(),
    details: { changes },
    ...extractRequestMetadata(req),
    success: true,
  }),

  adminRoleChange: (req, targetUserId, oldRole, newRole) => logAuditEvent({
    eventType: AuditEventTypes.ADMIN_ROLE_CHANGE,
    userId: req.user?._id,
    targetUserId,
    action: 'Admin changed user role',
    resource: 'user',
    resourceId: targetUserId?.toString(),
    details: { oldRole, newRole },
    ...extractRequestMetadata(req),
    success: true,
  }),

  // Profile Management
  profileCreated: (req, profileId, details) => logAuditEvent({
    eventType: AuditEventTypes.PROFILE_CREATED,
    userId: req.user?._id,
    action: 'Client profile created',
    resource: 'profile',
    resourceId: profileId?.toString(),
    details,
    ...extractRequestMetadata(req),
    success: true,
  }),

  profileUpdated: (req, profileId, targetUserId, details) => logAuditEvent({
    eventType: AuditEventTypes.PROFILE_UPDATED,
    userId: req.user?._id,
    targetUserId,
    action: 'Client profile updated',
    resource: 'profile',
    resourceId: profileId?.toString(),
    details,
    ...extractRequestMetadata(req),
    success: true,
  }),

  onboardingStepCompleted: (req, profileId, step) => logAuditEvent({
    eventType: AuditEventTypes.ONBOARDING_STEP_COMPLETED,
    userId: req.user?._id,
    action: `Onboarding step completed: ${step}`,
    resource: 'profile',
    resourceId: profileId?.toString(),
    details: { step },
    ...extractRequestMetadata(req),
    success: true,
  }),

  onboardingCompleted: (req, profileId) => logAuditEvent({
    eventType: AuditEventTypes.ONBOARDING_COMPLETED,
    userId: req.user?._id,
    action: 'Onboarding completed',
    resource: 'profile',
    resourceId: profileId?.toString(),
    ...extractRequestMetadata(req),
    success: true,
  }),

  clientConstraintUpdated: (req, clientUserId, field, oldValue, newValue, reason) => logAuditEvent({
    eventType: AuditEventTypes.CLIENT_CONSTRAINT_UPDATED,
    userId: req.user?._id,
    targetUserId: clientUserId,
    action: 'Client constraint updated by trainer',
    resource: 'profile',
    details: {
      field,
      oldValue,
      newValue,
      reason,
      updatedBy: req.user?.role,
    },
    ...extractRequestMetadata(req),
    success: true,
  }),

  clientConstraintViewed: (req, clientUserId) => logAuditEvent({
    eventType: AuditEventTypes.CLIENT_CONSTRAINT_VIEWED,
    userId: req.user?._id,
    targetUserId: clientUserId,
    action: 'Client constraints viewed by trainer',
    resource: 'profile',
    ...extractRequestMetadata(req),
    success: true,
  }),

  // Security Events
  suspiciousActivity: (req, reason, details) => logAuditEvent({
    eventType: AuditEventTypes.SUSPICIOUS_ACTIVITY,
    userId: req.user?._id,
    action: 'Suspicious activity detected',
    resource: 'security',
    details: { reason, ...details },
    ...extractRequestMetadata(req),
    success: false,
    errorMessage: reason,
  }),

  injectionAttempt: (req, attackType, details) => logAuditEvent({
    eventType: AuditEventTypes.INJECTION_ATTEMPT,
    userId: req.user?._id,
    action: `${attackType} injection attempt`,
    resource: 'security',
    details,
    ...extractRequestMetadata(req),
    success: false,
    errorMessage: `${attackType} injection detected`,
  }),
};

module.exports = {
  AuditEvent,
  AuditEventTypes,
  logAuditEvent,
  auditMiddleware,
  auditHelpers,
  extractRequestMetadata,
};
