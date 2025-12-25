/**
 * Program Generator Routes
 * API routes for AI-assisted program generation
 */

const express = require('express');
const router = express.Router();
const programGeneratorController = require('../controllers/programGenerator.controller');
const programEditorController = require('../controllers/programEditor.controller');
const workoutLoggingController = require('../controllers/workoutLogging.controller');
const validators = require('../validators/programGenerator.validators');
const workoutLoggingValidators = require('../validators/workoutLogging.validators');
const { authenticate } = require('../../../common/middleware/auth');
const { validate } = require('../../../common/middleware/validation');

/**
 * @swagger
 * tags:
 *   name: AI Program Generator
 *   description: AI-assisted workout and nutrition program generation
 */

/**
 * @swagger
 * /ai-programs/status:
 *   get:
 *     summary: Get AI service status
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI service status
 */
router.get('/status', authenticate, programGeneratorController.getAIStatus);

/**
 * @swagger
 * /ai-programs/generate/complete:
 *   post:
 *     summary: Generate complete program (workout + nutrition)
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *             properties:
 *               clientId:
 *                 type: string
 *               duration:
 *                 type: number
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferences:
 *                 type: object
 *               constraints:
 *                 type: object
 *               additionalRequirements:
 *                 type: string
 *     responses:
 *       201:
 *         description: Program generated successfully
 */
router.post(
  '/generate/complete',
  authenticate,
  validators.generateCompleteProgram,
  validate,
  programGeneratorController.generateCompleteProgram
);

/**
 * @swagger
 * /ai-programs/generate/workout:
 *   post:
 *     summary: Generate workout program only
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *             properties:
 *               clientId:
 *                 type: string
 *               duration:
 *                 type: number
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferences:
 *                 type: object
 *               constraints:
 *                 type: object
 *               additionalRequirements:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workout program generated successfully
 */
router.post(
  '/generate/workout',
  authenticate,
  validators.generateWorkoutProgram,
  validate,
  programGeneratorController.generateWorkoutProgram
);

/**
 * @swagger
 * /ai-programs/generate/nutrition:
 *   post:
 *     summary: Generate nutrition plan only
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *             properties:
 *               clientId:
 *                 type: string
 *               duration:
 *                 type: number
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferences:
 *                 type: object
 *               constraints:
 *                 type: object
 *               additionalRequirements:
 *                 type: string
 *     responses:
 *       201:
 *         description: Nutrition plan generated successfully
 */
router.post(
  '/generate/nutrition',
  authenticate,
  validators.generateNutritionPlan,
  validate,
  programGeneratorController.generateNutritionPlan
);

/**
 * @swagger
 * /ai-programs:
 *   get:
 *     summary: Get all generated programs for coach
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: generationType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Generated programs retrieved successfully
 */
router.get(
  '/',
  authenticate,
  validators.getGeneratedPrograms,
  validate,
  programGeneratorController.getGeneratedPrograms
);

/**
 * @swagger
 * /ai-programs/{id}:
 *   get:
 *     summary: Get single generated program
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Generated program retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  validators.validateProgramId,
  validate,
  programGeneratorController.getGeneratedProgram
);

/**
 * @swagger
 * /ai-programs/{id}/review:
 *   patch:
 *     summary: Review and update generated program
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               reviewNotes:
 *                 type: string
 *               quality:
 *                 type: object
 *     responses:
 *       200:
 *         description: Program reviewed successfully
 */
router.patch(
  '/:id/review',
  authenticate,
  validators.reviewProgram,
  validate,
  programGeneratorController.reviewGeneratedProgram
);

/**
 * @swagger
 * /ai-programs/{id}/apply:
 *   post:
 *     summary: Apply generated program to client
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Program applied successfully
 */
router.post(
  '/:id/apply',
  authenticate,
  validators.validateProgramId,
  validate,
  programGeneratorController.applyGeneratedProgram
);

/**
 * @swagger
 * /ai-programs/{id}:
 *   delete:
 *     summary: Archive generated program
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Program archived successfully
 */
router.delete(
  '/:id',
  authenticate,
  validators.validateProgramId,
  validate,
  programGeneratorController.deleteGeneratedProgram
);

// ==================== PROGRAM EDITING ROUTES ====================

/**
 * @swagger
 * /ai-programs/{id}/edit:
 *   patch:
 *     summary: Edit a generated program with change tracking
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workoutProgram:
 *                 type: object
 *               nutritionPlan:
 *                 type: object
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Program edited successfully
 */
router.patch(
  '/:id/edit',
  authenticate,
  programEditorController.editProgram
);

/**
 * @swagger
 * /ai-programs/{id}/workouts/{workoutIndex}/exercises/{exerciseIndex}/swap:
 *   post:
 *     summary: Swap an exercise in a workout
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workoutIndex
 *         required: true
 *         schema:
 *           type: number
 *       - in: path
 *         name: exerciseIndex
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newExercise
 *             properties:
 *               newExercise:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   sets:
 *                     type: number
 *                   reps:
 *                     type: number
 *                   equipment:
 *                     type: array
 *                     items:
 *                       type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Exercise swapped successfully
 */
router.post(
  '/:id/workouts/:workoutIndex/exercises/:exerciseIndex/swap',
  authenticate,
  programEditorController.swapExercise
);

/**
 * @swagger
 * /ai-programs/exercises/{exerciseName}/alternatives:
 *   get:
 *     summary: Get exercise alternatives
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciseName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           enum: [equipment, injury, difficulty, variation, progression]
 *       - in: query
 *         name: availableEquipment
 *         schema:
 *           type: string
 *           description: Comma-separated list of available equipment
 *       - in: query
 *         name: minSimilarity
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Exercise alternatives retrieved
 */
router.get(
  '/exercises/:exerciseName/alternatives',
  authenticate,
  programEditorController.getExerciseAlternatives
);

/**
 * @swagger
 * /ai-programs/exercises/{exerciseName}/best-alternative:
 *   get:
 *     summary: Get best exercise alternative
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciseName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *       - in: query
 *         name: availableEquipment
 *         schema:
 *           type: string
 *       - in: query
 *         name: minSimilarity
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Best alternative retrieved
 */
router.get(
  '/exercises/:exerciseName/best-alternative',
  authenticate,
  programEditorController.getBestAlternative
);

/**
 * @swagger
 * /ai-programs/{id}/bulk-swap-equipment:
 *   post:
 *     summary: Bulk swap exercises based on equipment availability
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - availableEquipment
 *             properties:
 *               availableEquipment:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Exercises swapped successfully
 */
router.post(
  '/:id/bulk-swap-equipment',
  authenticate,
  programEditorController.bulkSwapByEquipment
);

/**
 * @swagger
 * /ai-programs/{id}/adjust-difficulty:
 *   post:
 *     summary: Adjust workout difficulty (sets/reps/weight)
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - parameter
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [increase, decrease]
 *               parameter:
 *                 type: string
 *                 enum: [sets, reps, weight, all]
 *     responses:
 *       200:
 *         description: Difficulty adjusted successfully
 */
router.post(
  '/:id/adjust-difficulty',
  authenticate,
  programEditorController.adjustDifficulty
);

/**
 * @swagger
 * /ai-programs/{id}/edit-history:
 *   get:
 *     summary: Get edit history for a program
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Edit history retrieved
 */
router.get(
  '/:id/edit-history',
  authenticate,
  programEditorController.getEditHistory
);

/**
 * @swagger
 * /ai-programs/{id}/edits/{modificationIndex}:
 *   delete:
 *     summary: Revert a specific edit
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: modificationIndex
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Edit reverted successfully
 */
router.delete(
  '/:id/edits/:modificationIndex',
  authenticate,
  programEditorController.revertEdit
);

// ==================== WORKOUT LOGGING ROUTES ====================

/**
 * @swagger
 * /ai-programs/{programId}/workouts/start:
 *   post:
 *     summary: Start a workout session
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workoutIndex
 *             properties:
 *               workoutIndex:
 *                 type: number
 *                 description: Index of workout in the program
 *               workoutName:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Workout session started successfully
 */
router.post(
  '/:programId/workouts/start',
  authenticate,
  workoutLoggingValidators.startWorkoutSession,
  validate,
  workoutLoggingController.startWorkoutSession
);

/**
 * @swagger
 * /ai-programs/{programId}/workouts/complete:
 *   post:
 *     summary: Mark a workout as complete
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workoutIndex
 *               - exercises
 *             properties:
 *               workoutIndex:
 *                 type: number
 *               workoutName:
 *                 type: string
 *               duration:
 *                 type: number
 *                 description: Workout duration in minutes
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     exerciseId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     sets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           setNumber:
 *                             type: number
 *                           reps:
 *                             type: number
 *                           weight:
 *                             type: number
 *                           duration:
 *                             type: number
 *                           rpe:
 *                             type: number
 *                             minimum: 1
 *                             maximum: 10
 *                           completed:
 *                             type: boolean
 *                           notes:
 *                             type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               difficulty:
 *                 type: string
 *                 enum: [too_easy, just_right, too_hard]
 *               notes:
 *                 type: string
 *               mood:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Workout marked as complete successfully
 */
router.post(
  '/:programId/workouts/complete',
  authenticate,
  workoutLoggingValidators.markWorkoutComplete,
  validate,
  workoutLoggingController.markWorkoutComplete
);

/**
 * @swagger
 * /ai-programs/workout-logs/{logId}/sets:
 *   post:
 *     summary: Log a single set (set-by-set logging)
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exerciseIndex
 *               - setNumber
 *             properties:
 *               exerciseIndex:
 *                 type: number
 *               setNumber:
 *                 type: number
 *               reps:
 *                 type: number
 *               weight:
 *                 type: number
 *               duration:
 *                 type: number
 *               rpe:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Set logged successfully
 */
router.post(
  '/workout-logs/:logId/sets',
  authenticate,
  workoutLoggingValidators.logSet,
  validate,
  workoutLoggingController.logSet
);

/**
 * @swagger
 * /ai-programs/{programId}/workout-logs:
 *   get:
 *     summary: Get all workout logs for a program
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout logs retrieved successfully
 */
router.get(
  '/:programId/workout-logs',
  authenticate,
  workoutLoggingValidators.getWorkoutLogs,
  validate,
  workoutLoggingController.getWorkoutLogs
);

/**
 * @swagger
 * /ai-programs/workout-logs/{logId}:
 *   get:
 *     summary: Get a single workout log
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout log retrieved successfully
 */
router.get(
  '/workout-logs/:logId',
  authenticate,
  workoutLoggingValidators.validateWorkoutLogId,
  validate,
  workoutLoggingController.getWorkoutLog
);

/**
 * @swagger
 * /ai-programs/workout-logs/{logId}:
 *   patch:
 *     summary: Update a workout log
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: number
 *               rating:
 *                 type: number
 *               difficulty:
 *                 type: string
 *               notes:
 *                 type: string
 *               mood:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Workout log updated successfully
 */
router.patch(
  '/workout-logs/:logId',
  authenticate,
  workoutLoggingValidators.updateWorkoutLog,
  validate,
  workoutLoggingController.updateWorkoutLog
);

/**
 * @swagger
 * /ai-programs/workout-logs/{logId}:
 *   delete:
 *     summary: Delete a workout log
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout log deleted successfully
 */
router.delete(
  '/workout-logs/:logId',
  authenticate,
  workoutLoggingValidators.validateWorkoutLogId,
  validate,
  workoutLoggingController.deleteWorkoutLog
);

/**
 * @swagger
 * /ai-programs/{programId}/compliance:
 *   get:
 *     summary: Get compliance metrics for a program
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compliance metrics retrieved successfully
 */
router.get(
  '/:programId/compliance',
  authenticate,
  workoutLoggingValidators.getComplianceMetrics,
  validate,
  workoutLoggingController.getComplianceMetrics
);

/**
 * @swagger
 * /ai-programs/{programId}/progression:
 *   get:
 *     summary: Get progression insights for a program
 *     tags: [AI Program Generator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progression insights retrieved successfully
 */
router.get(
  '/:programId/progression',
  authenticate,
  workoutLoggingValidators.getProgressionInsights,
  validate,
  workoutLoggingController.getProgressionInsights
);

module.exports = router;

