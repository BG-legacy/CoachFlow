/**
 * Workout Logging Controller for AI-Generated Programs
 * Handles HTTP requests for workout logging and compliance tracking
 */

const workoutLoggingService = require('../services/workoutLogging.service');
const { asyncHandler } = require('../../../common/middleware/errorHandler');
const { successResponse, errorResponse } = require('../../../common/utils/responseFormatter');

class WorkoutLoggingController {
  /**
   * Start a workout session
   * POST /api/v1/ai-programs/:programId/workouts/start
   */
  startWorkoutSession = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const userId = req.user._id;
    const { workoutIndex, workoutName, date } = req.body;

    const result = await workoutLoggingService.startWorkoutSession(userId, programId, {
      workoutIndex,
      workoutName,
      date,
    });

    return successResponse(
      res,
      result,
      'Workout session started successfully',
      201
    );
  });

  /**
   * Log a single set
   * POST /api/v1/ai-programs/workout-logs/:logId/sets
   */
  logSet = asyncHandler(async (req, res) => {
    const { logId } = req.params;
    const userId = req.user._id;
    const { exerciseIndex, setNumber, reps, weight, duration, rpe, notes } = req.body;

    const workoutLog = await workoutLoggingService.logSet(logId, userId, {
      exerciseIndex,
      setNumber,
      reps,
      weight,
      duration,
      rpe,
      notes,
    });

    return successResponse(
      res,
      workoutLog,
      'Set logged successfully'
    );
  });

  /**
   * Mark workout as complete
   * POST /api/v1/ai-programs/:programId/workouts/complete
   */
  markWorkoutComplete = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const userId = req.user._id;
    const workoutData = req.body;

    const result = await workoutLoggingService.markWorkoutComplete(
      userId,
      programId,
      workoutData
    );

    return successResponse(
      res,
      result,
      'Workout marked as complete successfully',
      201
    );
  });

  /**
   * Get workout logs for a program
   * GET /api/v1/ai-programs/:programId/workout-logs
   */
  getWorkoutLogs = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const userId = req.user._id;
    const { limit, skip, sortBy } = req.query;

    const workoutLogs = await workoutLoggingService.getWorkoutLogs(
      userId,
      programId,
      {
        limit: limit ? parseInt(limit) : 20,
        skip: skip ? parseInt(skip) : 0,
        sortBy: sortBy || '-date',
      }
    );

    return successResponse(
      res,
      workoutLogs,
      'Workout logs retrieved successfully'
    );
  });

  /**
   * Get compliance metrics for a program
   * GET /api/v1/ai-programs/:programId/compliance
   */
  getComplianceMetrics = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const userId = req.user._id;

    const metrics = await workoutLoggingService.calculateComplianceMetrics(
      userId,
      programId
    );

    return successResponse(
      res,
      metrics,
      'Compliance metrics calculated successfully'
    );
  });

  /**
   * Get progression insights for a program
   * GET /api/v1/ai-programs/:programId/progression
   */
  getProgressionInsights = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const userId = req.user._id;

    const insights = await workoutLoggingService.getProgressionInsights(
      userId,
      programId
    );

    return successResponse(
      res,
      insights,
      'Progression insights retrieved successfully'
    );
  });

  /**
   * Get a single workout log
   * GET /api/v1/ai-programs/workout-logs/:logId
   */
  getWorkoutLog = asyncHandler(async (req, res) => {
    const { logId } = req.params;
    const WorkoutLog = require('../../workouts/models/workoutLog.model');
    
    const workoutLog = await WorkoutLog.findById(logId);
    
    if (!workoutLog) {
      return errorResponse(res, 'Workout log not found', 404);
    }

    // Check authorization
    if (workoutLog.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized access to workout log', 403);
    }

    return successResponse(
      res,
      workoutLog,
      'Workout log retrieved successfully'
    );
  });

  /**
   * Update a workout log
   * PATCH /api/v1/ai-programs/workout-logs/:logId
   */
  updateWorkoutLog = asyncHandler(async (req, res) => {
    const { logId } = req.params;
    const userId = req.user._id;
    const updates = req.body;
    const WorkoutLog = require('../../workouts/models/workoutLog.model');

    const workoutLog = await WorkoutLog.findById(logId);
    
    if (!workoutLog) {
      return errorResponse(res, 'Workout log not found', 404);
    }

    // Check authorization
    if (workoutLog.userId.toString() !== userId.toString()) {
      return errorResponse(res, 'Unauthorized access to workout log', 403);
    }

    // Update allowed fields
    const allowedFields = [
      'duration',
      'rating',
      'difficulty',
      'notes',
      'mood',
      'completed',
      'exercises',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        workoutLog[field] = updates[field];
      }
    });

    // Recalculate metrics if exercises were updated
    if (updates.exercises) {
      workoutLog.totalVolume = workoutLoggingService._calculateTotalVolume(
        workoutLog.exercises
      );
      workoutLog.averageRPE = workoutLoggingService._calculateAverageRPE(
        workoutLog.exercises
      );
    }

    await workoutLog.save();

    return successResponse(
      res,
      workoutLog,
      'Workout log updated successfully'
    );
  });

  /**
   * Delete a workout log
   * DELETE /api/v1/ai-programs/workout-logs/:logId
   */
  deleteWorkoutLog = asyncHandler(async (req, res) => {
    const { logId } = req.params;
    const userId = req.user._id;
    const WorkoutLog = require('../../workouts/models/workoutLog.model');

    const workoutLog = await WorkoutLog.findById(logId);
    
    if (!workoutLog) {
      return errorResponse(res, 'Workout log not found', 404);
    }

    // Check authorization
    if (workoutLog.userId.toString() !== userId.toString()) {
      return errorResponse(res, 'Unauthorized access to workout log', 403);
    }

    await WorkoutLog.findByIdAndDelete(logId);

    return successResponse(
      res,
      { id: logId },
      'Workout log deleted successfully'
    );
  });
}

module.exports = new WorkoutLoggingController();

