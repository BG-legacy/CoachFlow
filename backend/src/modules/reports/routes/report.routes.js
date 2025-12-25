/**
 * Report Routes
 */

const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../../../common/middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/weekly', reportController.getWeeklySummary);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/coach-dashboard', authorize('coach', 'admin'), reportController.getCoachDashboard);

module.exports = router;
