/**
 * Role-Based Access Control (RBAC) System
 * Defines permissions for client, trainer (coach), and admin roles
 */

/**
 * Available roles in the system
 */
const ROLES = {
  CLIENT: 'client',
  TRAINER: 'coach',
  ADMIN: 'admin',
};

/**
 * Resource types in the system
 */
const RESOURCES = {
  USER: 'user',
  CLIENT_PROFILE: 'clientProfile',
  WORKOUT: 'workout',
  WORKOUT_LOG: 'workoutLog',
  PROGRAM: 'program',
  NUTRITION: 'nutrition',
  FOOD_LOG: 'foodLog',
  MEAL_PLAN: 'mealPlan',
  SESSION: 'session',
  CHECKIN: 'checkin',
  FORM_ANALYSIS: 'formAnalysis',
  REPORT: 'report',
  GAMIFICATION: 'gamification',
  ADMIN: 'admin',
};

/**
 * Permission actions
 */
const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  MANAGE: 'manage', // Full CRUD access
};

/**
 * Permissions Matrix
 * Defines what each role can do with each resource
 *
 * Format: { [role]: { [resource]: [actions] } }
 */
const PERMISSIONS_MATRIX = {
  [ROLES.CLIENT]: {
    // Own profile
    [RESOURCES.USER]: ['read', 'update'],
    [RESOURCES.CLIENT_PROFILE]: ['read', 'update'],

    // Workouts - can view assigned workouts and log them
    [RESOURCES.WORKOUT]: ['read', 'list'],
    [RESOURCES.WORKOUT_LOG]: ['create', 'read', 'update', 'list'],
    [RESOURCES.PROGRAM]: ['read', 'list'],

    // Nutrition - can view meal plans and log food
    [RESOURCES.NUTRITION]: ['read', 'list'],
    [RESOURCES.FOOD_LOG]: ['create', 'read', 'update', 'delete', 'list'],
    [RESOURCES.MEAL_PLAN]: ['read', 'list'],

    // Sessions - can view their sessions
    [RESOURCES.SESSION]: ['read', 'list'],

    // Check-ins - can create and view their own
    [RESOURCES.CHECKIN]: ['create', 'read', 'update', 'list'],

    // Form analysis - can view their own analyses
    [RESOURCES.FORM_ANALYSIS]: ['read', 'list'],

    // Reports - can view their own reports
    [RESOURCES.REPORT]: ['read', 'list'],

    // Gamification - can view their own achievements
    [RESOURCES.GAMIFICATION]: ['read', 'list'],
  },

  [ROLES.TRAINER]: {
    // Own profile
    [RESOURCES.USER]: ['read', 'update'],

    // Client management - can view and manage assigned clients
    [RESOURCES.CLIENT_PROFILE]: ['create', 'read', 'update', 'list'],

    // Workouts - full management for their clients
    [RESOURCES.WORKOUT]: ['create', 'read', 'update', 'delete', 'list'],
    [RESOURCES.WORKOUT_LOG]: ['read', 'list'],
    [RESOURCES.PROGRAM]: ['create', 'read', 'update', 'delete', 'list'],

    // Nutrition - can create and manage meal plans
    [RESOURCES.NUTRITION]: ['create', 'read', 'update', 'delete', 'list'],
    [RESOURCES.FOOD_LOG]: ['read', 'list'],
    [RESOURCES.MEAL_PLAN]: ['create', 'read', 'update', 'delete', 'list'],

    // Sessions - full management
    [RESOURCES.SESSION]: ['create', 'read', 'update', 'delete', 'list'],

    // Check-ins - can view client check-ins
    [RESOURCES.CHECKIN]: ['read', 'update', 'list'],

    // Form analysis - can create and view analyses for their clients
    [RESOURCES.FORM_ANALYSIS]: ['create', 'read', 'update', 'delete', 'list'],

    // Reports - can generate and view reports for their clients
    [RESOURCES.REPORT]: ['create', 'read', 'list'],

    // Gamification - can view client achievements
    [RESOURCES.GAMIFICATION]: ['read', 'update', 'list'],
  },

  [ROLES.ADMIN]: {
    // Full access to everything
    [RESOURCES.USER]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.CLIENT_PROFILE]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.WORKOUT]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.WORKOUT_LOG]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.PROGRAM]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.NUTRITION]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.FOOD_LOG]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.MEAL_PLAN]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.SESSION]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.CHECKIN]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.FORM_ANALYSIS]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.REPORT]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.GAMIFICATION]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    [RESOURCES.ADMIN]: ['create', 'read', 'update', 'delete', 'list', 'manage'],
  },
};

/**
 * Check if a role has permission to perform an action on a resource
 * @param {String} role - User role
 * @param {String} resource - Resource type
 * @param {String} action - Action to perform
 * @returns {Boolean} - True if permission granted
 */
const hasPermission = (role, resource, action) => {
  if (!role || !resource || !action) {
    return false;
  }

  const rolePermissions = PERMISSIONS_MATRIX[role];

  if (!rolePermissions) {
    return false;
  }

  const resourcePermissions = rolePermissions[resource];

  if (!resourcePermissions) {
    return false;
  }

  // Check if user has 'manage' permission (grants all actions)
  if (resourcePermissions.includes(ACTIONS.MANAGE)) {
    return true;
  }

  return resourcePermissions.includes(action);
};

/**
 * Check if user has any of the specified permissions
 * @param {String} role - User role
 * @param {String} resource - Resource type
 * @param {Array<String>} actions - Actions to check
 * @returns {Boolean} - True if has any permission
 */
const hasAnyPermission = (role, resource, actions) => actions.some((action) => hasPermission(role, resource, action));

/**
 * Check if user has all of the specified permissions
 * @param {String} role - User role
 * @param {String} resource - Resource type
 * @param {Array<String>} actions - Actions to check
 * @returns {Boolean} - True if has all permissions
 */
const hasAllPermissions = (role, resource, actions) => actions.every((action) => hasPermission(role, resource, action));

/**
 * Get all permissions for a role
 * @param {String} role - User role
 * @returns {Object} - All permissions for the role
 */
const getRolePermissions = (role) => PERMISSIONS_MATRIX[role] || {};

/**
 * Get all permissions for a role on a specific resource
 * @param {String} role - User role
 * @param {String} resource - Resource type
 * @returns {Array<String>} - Array of allowed actions
 */
const getResourcePermissions = (role, resource) => {
  const rolePermissions = PERMISSIONS_MATRIX[role];
  if (!rolePermissions) {
    return [];
  }
  return rolePermissions[resource] || [];
};

/**
 * Check if user can access a resource (read or manage)
 * @param {String} role - User role
 * @param {String} resource - Resource type
 * @returns {Boolean} - True if can access
 */
const canAccess = (role, resource) => hasAnyPermission(role, resource, [ACTIONS.READ, ACTIONS.MANAGE]);

/**
 * Check if user can modify a resource (create, update, delete, or manage)
 * @param {String} role - User role
 * @param {String} resource - Resource type
 * @returns {Boolean} - True if can modify
 */
const canModify = (role, resource) => hasAnyPermission(role, resource, [
  ACTIONS.CREATE,
  ACTIONS.UPDATE,
  ACTIONS.DELETE,
  ACTIONS.MANAGE,
]);

/**
 * Express middleware factory for permission checking
 * @param {String} resource - Resource type
 * @param {String} action - Required action
 * @returns {Function} - Express middleware
 */
const requirePermission = (resource, action) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!hasPermission(req.user.role, resource, action)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
      required: { resource, action },
    });
  }

  next();
};

/**
 * Express middleware factory for ownership checking
 * Allows action if user owns the resource OR has permission
 * @param {String} resource - Resource type
 * @param {String} action - Required action
 * @param {Function} ownershipCheck - Function to check if user owns resource
 * @returns {Function} - Express middleware
 */
const requireOwnershipOrPermission = (resource, action, ownershipCheck) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Check if user has direct permission
  if (hasPermission(req.user.role, resource, action)) {
    return next();
  }

  // Check ownership
  try {
    const isOwner = await ownershipCheck(req);
    if (isOwner) {
      return next();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking resource ownership',
    });
  }

  return res.status(403).json({
    success: false,
    message: 'You do not have permission to access this resource',
  });
};

module.exports = {
  ROLES,
  RESOURCES,
  ACTIONS,
  PERMISSIONS_MATRIX,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  getResourcePermissions,
  canAccess,
  canModify,
  requirePermission,
  requireOwnershipOrPermission,
};



