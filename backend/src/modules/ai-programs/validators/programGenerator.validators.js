/**
 * Program Generator Validators
 * Validation schemas for AI program generation requests
 */

const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

const validators = {
  /**
   * Validate generate complete program request
   */
  generateCompleteProgram: [
    body('clientId')
      .notEmpty()
      .withMessage('Client ID is required')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid client ID'),
    body('duration')
      .optional()
      .isInt({ min: 1, max: 52 })
      .withMessage('Duration must be between 1 and 52 weeks'),
    body('goals')
      .optional()
      .isArray()
      .withMessage('Goals must be an array'),
    body('goals.*')
      .optional()
      .isIn([
        'weight_loss',
        'muscle_gain',
        'strength',
        'endurance',
        'flexibility',
        'general_fitness',
        'sports_performance',
        'rehabilitation',
      ])
      .withMessage('Invalid goal type'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
    body('constraints')
      .optional()
      .isObject()
      .withMessage('Constraints must be an object'),
    body('additionalRequirements')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Additional requirements must be a string with max 1000 characters'),
  ],

  /**
   * Validate generate workout program request
   */
  generateWorkoutProgram: [
    body('clientId')
      .notEmpty()
      .withMessage('Client ID is required')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid client ID'),
    body('duration')
      .optional()
      .isInt({ min: 1, max: 52 })
      .withMessage('Duration must be between 1 and 52 weeks'),
    body('goals')
      .optional()
      .isArray()
      .withMessage('Goals must be an array'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
    body('constraints')
      .optional()
      .isObject()
      .withMessage('Constraints must be an object'),
    body('additionalRequirements')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Additional requirements must be a string with max 1000 characters'),
  ],

  /**
   * Validate generate nutrition plan request
   */
  generateNutritionPlan: [
    body('clientId')
      .notEmpty()
      .withMessage('Client ID is required')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid client ID'),
    body('duration')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Duration must be between 1 and 12 weeks'),
    body('goals')
      .optional()
      .isArray()
      .withMessage('Goals must be an array'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
    body('constraints')
      .optional()
      .isObject()
      .withMessage('Constraints must be an object'),
    body('additionalRequirements')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Additional requirements must be a string with max 1000 characters'),
  ],

  /**
   * Validate get generated programs query
   */
  getGeneratedPrograms: [
    query('clientId')
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid client ID'),
    query('status')
      .optional()
      .isIn(['generating', 'generated', 'reviewed', 'approved', 'rejected', 'applied', 'archived'])
      .withMessage('Invalid status'),
    query('generationType')
      .optional()
      .isIn(['workout_program', 'nutrition_plan', 'combined', 'workout_only', 'meal_plan_only'])
      .withMessage('Invalid generation type'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  /**
   * Validate program ID parameter
   */
  validateProgramId: [
    param('id')
      .notEmpty()
      .withMessage('Program ID is required')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid program ID'),
  ],

  /**
   * Validate review program request
   */
  reviewProgram: [
    param('id')
      .notEmpty()
      .withMessage('Program ID is required')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Invalid program ID'),
    body('status')
      .optional()
      .isIn(['reviewed', 'approved', 'rejected'])
      .withMessage('Status must be reviewed, approved, or rejected'),
    body('reviewNotes')
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage('Review notes must be a string with max 2000 characters'),
    body('quality')
      .optional()
      .isObject()
      .withMessage('Quality must be an object'),
    body('quality.coachRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Coach rating must be between 1 and 5'),
    body('quality.wasUseful')
      .optional()
      .isBoolean()
      .withMessage('Was useful must be a boolean'),
    body('quality.feedback')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Feedback must be a string with max 1000 characters'),
  ],
};

module.exports = validators;

