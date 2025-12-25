/**
 * Admin Routes
 */

const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../../../common/middleware/auth');

const router = express.Router();

router.use(authenticate);

// Coach dashboard (coaches and admins)
router.get('/coach-dashboard', authorize('coach', 'admin'), adminController.getCoachDashboard);

// Admin-only routes
router.get('/dashboard', authorize('admin'), adminController.getAdminDashboard);
router.get('/analytics', authorize('admin'), adminController.getSystemAnalytics);
router.get('/users', authorize('admin'), adminController.getAllUsers);
router.put('/users/role', authorize('admin'), adminController.updateUserRole);
router.put('/users/:userId/toggle-status', authorize('admin'), adminController.toggleUserStatus);

module.exports = router;
