/**
 * Nutrition Log Routes
 */

const express = require('express');
const nutritionLogController = require('../controllers/nutritionLog.controller');
const { authenticate, authorize } = require('../../../common/middleware/auth.middleware');
const { validate } = require('../../../common/middleware/validation.middleware');
const { body, query, param } = require('express-validator');

const router = express.Router();

router.use(authenticate);

// Create log
router.post(
  '/',
  [
    body('date').isISO8601().withMessage('Valid date required'),
    body('calories').isFloat({ min: 0, max: 10000 }).withMessage('Calories must be between 0-10000'),
    body('protein').isFloat({ min: 0, max: 500 }).withMessage('Protein must be between 0-500g'),
    body('carbs').optional().isFloat({ min: 0, max: 2000 }).withMessage('Carbs must be between 0-2000g'),
    body('fats').optional().isFloat({ min: 0, max: 500 }).withMessage('Fats must be between 0-500g'),
    body('fiber').optional().isFloat({ min: 0, max: 200 }).withMessage('Fiber must be between 0-200g'),
    body('sleep.hours').optional().isFloat({ min: 0, max: 24 }).withMessage('Sleep hours must be between 0-24'),
    body('sleep.quality').optional().isIn(['poor', 'fair', 'good', 'excellent']),
    body('mood').optional().isIn(['very_poor', 'poor', 'neutral', 'good', 'very_good']),
    body('energy').optional().isIn(['very_low', 'low', 'moderate', 'high', 'very_high']),
    body('water').optional().isFloat({ min: 0, max: 20 }).withMessage('Water must be between 0-20L'),
    body('weight').optional().isFloat({ min: 20, max: 500 }).withMessage('Weight must be between 20-500kg'),
    validate,
  ],
  nutritionLogController.createLog,
);

// Update log
router.patch(
  '/:logId',
  [
    param('logId').isMongoId().withMessage('Invalid log ID'),
    validate,
  ],
  nutritionLogController.updateLog,
);

// Get logs for range
router.get(
  '/range',
  [
    query('startDate').isISO8601().withMessage('Valid start date required'),
    query('endDate').isISO8601().withMessage('Valid end date required'),
    validate,
  ],
  nutritionLogController.getLogsForRange,
);

// Get logs for range (specific user - coach/admin)
router.get(
  '/range/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    query('startDate').isISO8601().withMessage('Valid start date required'),
    query('endDate').isISO8601().withMessage('Valid end date required'),
    validate,
  ],
  authorize(['coach', 'admin']),
  nutritionLogController.getLogsForRange,
);

// Get weekly summary
router.get('/summary/weekly', nutritionLogController.getWeeklySummary);

// Get weekly summary (specific user)
router.get(
  '/summary/weekly/:userId',
  [param('userId').isMongoId(), validate],
  authorize(['coach', 'admin']),
  nutritionLogController.getWeeklySummary,
);

// Get trends
router.get('/trends', nutritionLogController.getTrends);

// Get trends (specific user)
router.get(
  '/trends/:userId',
  [param('userId').isMongoId(), validate],
  authorize(['coach', 'admin']),
  nutritionLogController.getTrends,
);

// Delete log
router.delete(
  '/:logId',
  [param('logId').isMongoId(), validate],
  nutritionLogController.deleteLog,
);

module.exports = router;

