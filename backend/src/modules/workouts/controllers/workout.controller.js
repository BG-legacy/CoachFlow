/**
 * Workout Controller
 * With audit logging for plan changes
 */

const workoutService = require('../services/workout.service');
const { successResponse, createdResponse, paginatedResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');
const { auditHelpers } = require('../../../common/utils/auditLogger');

class WorkoutController {
  // Workout endpoints
  createWorkout = asyncHandler(async (req, res) => {
    const workout = await workoutService.createWorkout(req.user._id, req.body);
    return createdResponse(res, workout, 'Workout created successfully');
  });

  getWorkout = asyncHandler(async (req, res) => {
    const workout = await workoutService.getWorkoutById(req.params.id);
    return successResponse(res, workout);
  });

  getWorkouts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, clientId, status, type } = req.query;
    const filters = {};

    // Filter by coach's workouts if coach role
    if (req.user.role === 'coach') {
      filters.coachId = req.user._id;
    }

    if (clientId) filters.clientId = clientId;
    if (status) filters.status = status;
    if (type) filters.type = type;

    const options = { page: parseInt(page), limit: parseInt(limit), sort };
    const { workouts, total } = await workoutService.getWorkouts(filters, options);

    return paginatedResponse(res, workouts, parseInt(page), parseInt(limit), total);
  });

  updateWorkout = asyncHandler(async (req, res) => {
    const workout = await workoutService.updateWorkout(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body
    );
    return successResponse(res, workout, 'Workout updated successfully');
  });

  deleteWorkout = asyncHandler(async (req, res) => {
    const result = await workoutService.deleteWorkout(req.params.id, req.user._id, req.user.role);
    return successResponse(res, result);
  });

  // Program endpoints
  createProgram = asyncHandler(async (req, res) => {
    const program = await workoutService.createProgram(req.user._id, req.body);
    
    // Log plan creation
    await auditHelpers.planCreated(req, program._id, {
      name: program.name,
      clientId: program.clientId,
      duration: program.duration,
    });
    
    return createdResponse(res, program, 'Program created successfully');
  });

  getProgram = asyncHandler(async (req, res) => {
    const program = await workoutService.getProgramById(req.params.id);
    return successResponse(res, program);
  });

  getPrograms = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, clientId, status } = req.query;
    const filters = {};

    // Filter by coach's programs if coach role
    if (req.user.role === 'coach') {
      filters.coachId = req.user._id;
    }

    if (clientId) filters.clientId = clientId;
    if (status) filters.status = status;

    const options = { page: parseInt(page), limit: parseInt(limit), sort };
    const { programs, total } = await workoutService.getPrograms(filters, options);

    return paginatedResponse(res, programs, parseInt(page), parseInt(limit), total);
  });

  updateProgram = asyncHandler(async (req, res) => {
    const program = await workoutService.updateProgram(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body
    );
    
    // Log plan update
    await auditHelpers.planUpdated(req, program._id, {
      updates: Object.keys(req.body),
      name: program.name,
    });
    
    return successResponse(res, program, 'Program updated successfully');
  });

  deleteProgram = asyncHandler(async (req, res) => {
    const result = await workoutService.deleteProgram(req.params.id, req.user._id, req.user.role);
    
    // Log plan deletion
    await auditHelpers.planDeleted(req, req.params.id);
    
    return successResponse(res, result);
  });

  assignProgram = asyncHandler(async (req, res) => {
    const { clientId } = req.body;
    const program = await workoutService.assignProgramToClient(
      req.params.id,
      clientId,
      req.user._id,
      req.user.role
    );
    return successResponse(res, program, 'Program assigned successfully');
  });

  // Workout Log endpoints
  logWorkout = asyncHandler(async (req, res) => {
    const log = await workoutService.logWorkout(req.user._id, req.body);
    return createdResponse(res, log, 'Workout logged successfully');
  });

  getWorkoutLog = asyncHandler(async (req, res) => {
    const log = await workoutService.getWorkoutLog(req.params.id);
    return successResponse(res, log);
  });

  getWorkoutLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, userId, startDate, endDate } = req.query;
    const filters = {};

    if (userId) filters.userId = userId;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    const options = { page: parseInt(page), limit: parseInt(limit), sort };
    const { logs, total } = await workoutService.getWorkoutLogs(filters, options);

    return paginatedResponse(res, logs, parseInt(page), parseInt(limit), total);
  });

  updateWorkoutLog = asyncHandler(async (req, res) => {
    const log = await workoutService.updateWorkoutLog(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body
    );
    return successResponse(res, log, 'Workout log updated successfully');
  });

  getWorkoutStats = asyncHandler(async (req, res) => {
    const { userId, startDate, endDate } = req.query;
    const targetUserId = userId || req.user._id;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await workoutService.getWorkoutStats(targetUserId, start, end);
    return successResponse(res, stats);
  });
}

module.exports = new WorkoutController();

