/**
 * Workout Logging Validators
 * Validation rules for AI program workout logging endpoints
 */

const { body, param, query } = require('express-validator');

/**
 * Validate start workout session request
 */
const startWorkoutSession = [
  param('programId')
    .isMongoId()
    .withMessage('Invalid program ID'),
  body('workoutIndex')
    .isInt({ min: 0 })
    .withMessage('Workout index must be a non-negative integer'),
  body('workoutName')
    .optional()
    .isString()
    .trim()
    .withMessage('Workout name must be a string'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
];

/**
 * Validate log set request
 */
const logSet = [
  param('logId')
    .isMongoId()
    .withMessage('Invalid workout log ID'),
  body('exerciseIndex')
    .isInt({ min: 0 })
    .withMessage('Exercise index must be a non-negative integer'),
  body('setNumber')
    .isInt({ min: 1 })
    .withMessage('Set number must be a positive integer'),
  body('reps')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reps must be a non-negative integer'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a non-negative number'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer (seconds)'),
  body('rpe')
    .optional()
    .isFloat({ min: 1, max: 10 })
    .withMessage('RPE must be between 1 and 10'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .withMessage('Notes must be a string'),
];

/**
 * Validate mark workout complete request
 */
const markWorkoutComplete = [
  param('programId')
    .isMongoId()
    .withMessage('Invalid program ID'),
  body('workoutIndex')
    .isInt({ min: 0 })
    .withMessage('Workout index must be a non-negative integer'),
  body('workoutName')
    .optional()
    .isString()
    .trim()
    .withMessage('Workout name must be a string'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer (minutes)'),
  body('exercises')
    .isArray({ min: 1 })
    .withMessage('Exercises must be a non-empty array'),
  body('exercises.*.name')
    .isString()
    .trim()
    .withMessage('Exercise name must be a string'),
  body('exercises.*.exerciseId')
    .optional()
    .isString()
    .withMessage('Exercise ID must be a string'),
  body('exercises.*.sets')
    .isArray({ min: 1 })
    .withMessage('Exercise sets must be a non-empty array'),
  body('exercises.*.sets.*.setNumber')
    .isInt({ min: 1 })
    .withMessage('Set number must be a positive integer'),
  body('exercises.*.sets.*.reps')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reps must be a non-negative integer'),
  body('exercises.*.sets.*.weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a non-negative number'),
  body('exercises.*.sets.*.duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  body('exercises.*.sets.*.rpe')
    .optional()
    .isFloat({ min: 1, max: 10 })
    .withMessage('RPE must be between 1 and 10'),
  body('exercises.*.sets.*.completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean'),
  body('exercises.*.sets.*.notes')
    .optional()
    .isString()
    .trim()
    .withMessage('Set notes must be a string'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('difficulty')
    .optional()
    .isIn(['too_easy', 'just_right', 'too_hard'])
    .withMessage('Difficulty must be one of: too_easy, just_right, too_hard'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .withMessage('Notes must be a string'),
  body('mood')
    .optional()
    .isString()
    .trim()
    .withMessage('Mood must be a string'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
];

/**
 * Validate get workout logs request
 */
const getWorkoutLogs = [
  param('programId')
    .isMongoId()
    .withMessage('Invalid program ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('SortBy must be a string'),
];

/**
 * Validate compliance metrics request
 */
const getComplianceMetrics = [
  param('programId')
    .isMongoId()
    .withMessage('Invalid program ID'),
];

/**
 * Validate progression insights request
 */
const getProgressionInsights = [
  param('programId')
    .isMongoId()
    .withMessage('Invalid program ID'),
];

/**
 * Validate workout log ID
 */
const validateWorkoutLogId = [
  param('logId')
    .isMongoId()
    .withMessage('Invalid workout log ID'),
];

/**
 * Validate update workout log request
 */
const updateWorkoutLog = [
  param('logId')
    .isMongoId()
    .withMessage('Invalid workout log ID'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('difficulty')
    .optional()
    .isIn(['too_easy', 'just_right', 'too_hard'])
    .withMessage('Difficulty must be one of: too_easy, just_right, too_hard'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .withMessage('Notes must be a string'),
  body('mood')
    .optional()
    .isString()
    .trim()
    .withMessage('Mood must be a string'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean'),
  body('exercises')
    .optional()
    .isArray()
    .withMessage('Exercises must be an array'),
];

module.exports = {
  startWorkoutSession,
  logSet,
  markWorkoutComplete,
  getWorkoutLogs,
  getComplianceMetrics,
  getProgressionInsights,
  validateWorkoutLogId,
  updateWorkoutLog,
};

