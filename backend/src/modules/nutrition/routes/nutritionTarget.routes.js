/**
 * Nutrition Target Routes
 */

const express = require('express');
const nutritionTargetController = require('../controllers/nutritionTarget.controller');
const { authenticate, authorize } = require('../../../common/middleware/auth.middleware');
const { validate } = require('../../../common/middleware/validation.middleware');
const { body, query, param } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/nutrition/targets/preview
 * @desc    Get calculation preview without saving
 * @access  Private
 */
router.post(
  '/preview',
  [
    body('weight').isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20-300 kg'),
    body('height').isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100-250 cm'),
    body('age').isInt({ min: 13, max: 100 }).withMessage('Age must be between 13-100'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('activityLevel')
      .isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
      .withMessage('Invalid activity level'),
    body('goal')
      .isIn(['weight_loss', 'muscle_gain', 'maintenance', 'performance', 'body_recomp', 'health'])
      .withMessage('Invalid goal'),
    body('bmrFormula')
      .optional()
      .isIn(['mifflin_st_jeor', 'harris_benedict', 'katch_mcardle'])
      .withMessage('Invalid BMR formula'),
    body('targetRate').optional().isFloat({ min: 0.1, max: 2 }).withMessage('Target rate must be between 0.1-2 kg/week'),
    validate,
  ],
  nutritionTargetController.getCalculationPreview,
);

/**
 * @route   POST /api/nutrition/targets
 * @desc    Create new nutrition target
 * @access  Private (Coach/Admin for other users)
 */
router.post(
  '/',
  [
    body('userId').optional().isMongoId().withMessage('Invalid user ID'),
    body('activityLevel')
      .isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
      .withMessage('Invalid activity level'),
    body('activityDescription').optional().isString().trim(),
    body('goal')
      .isIn(['weight_loss', 'muscle_gain', 'maintenance', 'performance', 'body_recomp', 'health'])
      .withMessage('Invalid goal'),
    body('bmrFormula')
      .optional()
      .isIn(['mifflin_st_jeor', 'harris_benedict', 'katch_mcardle'])
      .withMessage('Invalid BMR formula'),
    body('targetRate').optional().isFloat({ min: 0.1, max: 2 }).withMessage('Target rate must be between 0.1-2 kg/week'),
    body('proteinGramsPerKg').optional().isFloat({ min: 0.8, max: 4 }).withMessage('Protein must be between 0.8-4 g/kg'),
    body('carbPreference').optional().isIn(['low', 'moderate', 'high']).withMessage('Invalid carb preference'),
    body('customCalorieAdjustment').optional().isInt({ min: -1500, max: 1500 }).withMessage('Calorie adjustment must be between -1500 to +1500'),
    body('mealsPerDay').optional().isInt({ min: 1, max: 8 }).withMessage('Meals per day must be between 1-8'),
    body('enablePreWorkoutNutrition').optional().isBoolean(),
    body('enablePostWorkoutNutrition').optional().isBoolean(),
    body('dietDuration').optional().isInt({ min: 1, max: 52 }).withMessage('Diet duration must be between 1-52 weeks'),
    body('notes').optional().isString().trim(),
    validate,
  ],
  nutritionTargetController.createTarget,
);

/**
 * @route   GET /api/nutrition/targets/active
 * @desc    Get active nutrition target for current user
 * @access  Private
 */
router.get('/active', nutritionTargetController.getActiveTarget);

/**
 * @route   GET /api/nutrition/targets/active/:userId
 * @desc    Get active nutrition target for specific user
 * @access  Private (Coach/Admin)
 */
router.get(
  '/active/:userId',
  [param('userId').isMongoId().withMessage('Invalid user ID'), validate],
  authorize(['coach', 'admin']),
  nutritionTargetController.getActiveTarget,
);

/**
 * @route   GET /api/nutrition/targets/history
 * @desc    Get nutrition target history for current user
 * @access  Private
 */
router.get(
  '/history',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be non-negative'),
    validate,
  ],
  nutritionTargetController.getTargetHistory,
);

/**
 * @route   GET /api/nutrition/targets/history/:userId
 * @desc    Get nutrition target history for specific user
 * @access  Private (Coach/Admin)
 */
router.get(
  '/history/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be non-negative'),
    validate,
  ],
  authorize(['coach', 'admin']),
  nutritionTargetController.getTargetHistory,
);

/**
 * @route   GET /api/nutrition/targets/review/due
 * @desc    Get targets due for review
 * @access  Private (Coach/Admin)
 */
router.get(
  '/review/due',
  authorize(['coach', 'admin']),
  nutritionTargetController.getTargetsDueForReview,
);

/**
 * @route   GET /api/nutrition/targets/:targetId
 * @desc    Get specific nutrition target
 * @access  Private
 */
router.get(
  '/:targetId',
  [param('targetId').isMongoId().withMessage('Invalid target ID'), validate],
  nutritionTargetController.getTargetById,
);

/**
 * @route   PATCH /api/nutrition/targets/:targetId
 * @desc    Update nutrition target
 * @access  Private (Owner/Coach/Admin)
 */
router.patch(
  '/:targetId',
  [
    param('targetId').isMongoId().withMessage('Invalid target ID'),
    body('reason').isString().trim().notEmpty().withMessage('Reason for adjustment is required'),
    body('clientFeedback').optional().isString().trim(),
    body('calorieTarget').optional().isInt({ min: 800, max: 6000 }).withMessage('Calorie target must be between 800-6000'),
    body('macroTargets.protein').optional().isInt({ min: 20, max: 500 }).withMessage('Protein must be between 20-500g'),
    body('macroTargets.carbs').optional().isInt({ min: 20, max: 1000 }).withMessage('Carbs must be between 20-1000g'),
    body('macroTargets.fats').optional().isInt({ min: 20, max: 300 }).withMessage('Fats must be between 20-300g'),
    body('activityLevel')
      .optional()
      .isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
      .withMessage('Invalid activity level'),
    body('activityDescription').optional().isString().trim(),
    validate,
  ],
  nutritionTargetController.updateTarget,
);

/**
 * @route   POST /api/nutrition/targets/:userId/recalculate
 * @desc    Recalculate nutrition target based on updated profile
 * @access  Private (Owner/Coach/Admin)
 */
router.post(
  '/:userId/recalculate',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('reason').optional().isString().trim(),
    validate,
  ],
  nutritionTargetController.recalculateTarget,
);

/**
 * @route   GET /api/nutrition/targets/:targetId/adherence
 * @desc    Get adherence report for a target
 * @access  Private
 */
router.get(
  '/:targetId/adherence',
  [
    param('targetId').isMongoId().withMessage('Invalid target ID'),
    query('startDate').isISO8601().withMessage('Valid start date required'),
    query('endDate').isISO8601().withMessage('Valid end date required'),
    validate,
  ],
  nutritionTargetController.getAdherenceReport,
);

/**
 * @route   GET /api/nutrition/targets/compare/:currentId/:previousId
 * @desc    Compare two nutrition targets
 * @access  Private
 */
router.get(
  '/compare/:currentId/:previousId',
  [
    param('currentId').isMongoId().withMessage('Invalid current target ID'),
    param('previousId').isMongoId().withMessage('Invalid previous target ID'),
    validate,
  ],
  nutritionTargetController.compareTargets,
);

module.exports = router;

