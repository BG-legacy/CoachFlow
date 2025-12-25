/**
 * Workout Routes
 */

const express = require('express');
const workoutController = require('../controllers/workout.controller');
const { authenticate, authorize } = require('../../../common/middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Workout routes

/**
 * @swagger
 * /workouts/workouts:
 *   post:
 *     summary: Create a new workout
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - exercises
 *             properties:
 *               name:
 *                 type: string
 *                 example: Upper Body Strength
 *               description:
 *                 type: string
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *               clientId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workout created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/workouts', authorize('coach', 'admin'), workoutController.createWorkout);

/**
 * @swagger
 * /workouts/workouts:
 *   get:
 *     summary: Get all workouts with pagination, filtering, and sorting
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - $ref: '#/components/parameters/FieldsParam'
 *       - name: status
 *         in: query
 *         description: Filter by workout status
 *         schema:
 *           type: string
 *           enum: [active, completed, archived]
 *       - name: type
 *         in: query
 *         description: Filter by workout type
 *         schema:
 *           type: string
 *           enum: [strength, cardio, flexibility, mixed]
 *       - name: clientId
 *         in: query
 *         description: Filter by client ID
 *         schema:
 *           type: string
 *       - name: difficulty
 *         in: query
 *         description: 'Filter by difficulty (use operators: difficulty[gte]=3)'
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of workouts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *             example:
 *               requestId: 123e4567-e89b-12d3-a456-426614174000
 *               timestamp: '2025-12-20T10:00:00.000Z'
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: Upper Body Strength
 *                   type: strength
 *                   status: active
 *                   exercises: []
 *                   createdAt: '2025-12-20T10:00:00.000Z'
 *               error: null
 *               meta:
 *                 message: Success
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 50
 *                   totalPages: 5
 *                   hasNextPage: true
 *                   hasPrevPage: false
 *                   nextPage: 2
 *                   prevPage: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/workouts', workoutController.getWorkouts);

/**
 * @swagger
 * /workouts/workouts/{id}:
 *   get:
 *     summary: Get workout by ID
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Workout ID
 *     responses:
 *       200:
 *         description: Workout details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/workouts/:id', workoutController.getWorkout);

/**
 * @swagger
 * /workouts/workouts/{id}:
 *   put:
 *     summary: Update workout
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Workout updated successfully
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/workouts/:id', authorize('coach', 'admin'), workoutController.updateWorkout);

/**
 * @swagger
 * /workouts/workouts/{id}:
 *   delete:
 *     summary: Delete workout
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout deleted successfully
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/workouts/:id', authorize('coach', 'admin'), workoutController.deleteWorkout);

// Program routes
router.post('/programs', authorize('coach', 'admin'), workoutController.createProgram);
router.get('/programs', workoutController.getPrograms);
router.get('/programs/:id', workoutController.getProgram);
router.put('/programs/:id', authorize('coach', 'admin'), workoutController.updateProgram);
router.delete('/programs/:id', authorize('coach', 'admin'), workoutController.deleteProgram);
router.post('/programs/:id/assign', authorize('coach', 'admin'), workoutController.assignProgram);

// Workout Log routes
router.post('/logs', workoutController.logWorkout);
router.get('/logs', workoutController.getWorkoutLogs);
router.get('/logs/:id', workoutController.getWorkoutLog);
router.put('/logs/:id', workoutController.updateWorkoutLog);
router.get('/stats', workoutController.getWorkoutStats);

module.exports = router;
