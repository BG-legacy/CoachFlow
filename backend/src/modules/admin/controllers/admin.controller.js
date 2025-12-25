/**
 * Admin Controller
 * With audit logging for sensitive admin actions
 */

const adminService = require('../services/admin.service');
const { successResponse, paginatedResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');
const { auditHelpers } = require('../../../common/utils/auditLogger');

class AdminController {
  getAdminDashboard = asyncHandler(async (req, res) => {
    const dashboard = await adminService.getAdminDashboard();
    return successResponse(res, dashboard);
  });

  getCoachDashboard = asyncHandler(async (req, res) => {
    const dashboard = await adminService.getCoachDashboard(req.user._id);
    return successResponse(res, dashboard);
  });

  getSystemAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await adminService.getSystemAnalytics(start, end);
    return successResponse(res, analytics);
  });

  updateUserRole = asyncHandler(async (req, res) => {
    const { userId, role } = req.body;
    const user = await adminService.updateUserRole(userId, role);
    
    // Log admin role change
    await auditHelpers.adminRoleChange(req, userId, user.role, role);
    
    return successResponse(res, user, 'User role updated successfully');
  });

  toggleUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await adminService.toggleUserStatus(userId);
    
    // Log admin user update
    await auditHelpers.adminUserUpdate(req, userId, { 
      isActive: user.isActive,
      status: user.isActive ? 'activated' : 'suspended'
    });
    
    return successResponse(res, user, 'User status updated successfully');
  });

  getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, role, isActive } = req.query;
    const filters = {};

    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const options = { page: parseInt(page), limit: parseInt(limit), sort };
    const { users, total } = await adminService.getAllUsers(filters, options);

    return paginatedResponse(res, users, parseInt(page), parseInt(limit), total);
  });
}

module.exports = new AdminController();

