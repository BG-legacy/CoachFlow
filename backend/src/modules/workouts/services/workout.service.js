/**
 * Workout Service
 */

const workoutRepository = require('../repositories/workout.repository');
const { NotFoundError, ForbiddenError } = require('../../../common/utils/errors');
const logger = require('../../../common/utils/logger');

class WorkoutService {
  // Workout operations
  async createWorkout(coachId, workoutData) {
    const workout = await workoutRepository.createWorkout({
      coachId,
      ...workoutData,
    });

    logger.info(`Workout created: ${workout._id} by coach: ${coachId}`);

    return workout;
  }

  async getWorkoutById(workoutId) {
    const workout = await workoutRepository.findWorkoutById(workoutId);

    if (!workout) {
      throw new NotFoundError('Workout');
    }

    return workout;
  }

  async getWorkouts(filters, options) {
    const { workouts, total } = await workoutRepository.findAllWorkouts(filters, options);

    return { workouts, total };
  }

  async updateWorkout(workoutId, userId, userRole, updates) {
    const workout = await workoutRepository.findWorkoutById(workoutId);

    if (!workout) {
      throw new NotFoundError('Workout');
    }

    // Check permissions
    if (userRole !== 'admin' && workout.coachId._id.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to update this workout');
    }

    const updatedWorkout = await workoutRepository.updateWorkout(workoutId, updates);

    logger.info(`Workout updated: ${workoutId}`);

    return updatedWorkout;
  }

  async deleteWorkout(workoutId, userId, userRole) {
    const workout = await workoutRepository.findWorkoutById(workoutId);

    if (!workout) {
      throw new NotFoundError('Workout');
    }

    // Check permissions
    if (userRole !== 'admin' && workout.coachId._id.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to delete this workout');
    }

    await workoutRepository.deleteWorkout(workoutId);

    logger.info(`Workout deleted: ${workoutId}`);

    return { message: 'Workout deleted successfully' };
  }

  // Program operations
  async createProgram(coachId, programData) {
    const program = await workoutRepository.createProgram({
      coachId,
      ...programData,
    });

    logger.info(`Program created: ${program._id} by coach: ${coachId}`);

    return program;
  }

  async getProgramById(programId) {
    const program = await workoutRepository.findProgramById(programId);

    if (!program) {
      throw new NotFoundError('Program');
    }

    return program;
  }

  async getPrograms(filters, options) {
    const { programs, total } = await workoutRepository.findAllPrograms(filters, options);

    return { programs, total };
  }

  async updateProgram(programId, userId, userRole, updates) {
    const program = await workoutRepository.findProgramById(programId);

    if (!program) {
      throw new NotFoundError('Program');
    }

    // Check permissions
    if (userRole !== 'admin' && program.coachId._id.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to update this program');
    }

    const updatedProgram = await workoutRepository.updateProgram(programId, updates);

    logger.info(`Program updated: ${programId}`);

    return updatedProgram;
  }

  async deleteProgram(programId, userId, userRole) {
    const program = await workoutRepository.findProgramById(programId);

    if (!program) {
      throw new NotFoundError('Program');
    }

    // Check permissions
    if (userRole !== 'admin' && program.coachId._id.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to delete this program');
    }

    await workoutRepository.deleteProgram(programId);

    logger.info(`Program deleted: ${programId}`);

    return { message: 'Program deleted successfully' };
  }

  async assignProgramToClient(programId, clientId, coachId, userRole) {
    const program = await workoutRepository.findProgramById(programId);

    if (!program) {
      throw new NotFoundError('Program');
    }

    // Check permissions
    if (userRole !== 'admin' && program.coachId._id.toString() !== coachId) {
      throw new ForbiddenError('You do not have permission to assign this program');
    }

    const updatedProgram = await workoutRepository.updateProgram(programId, {
      clientId,
      status: 'active',
      startDate: new Date(),
    });

    logger.info(`Program ${programId} assigned to client ${clientId}`);

    return updatedProgram;
  }

  // Workout Log operations
  async logWorkout(userId, logData) {
    const log = await workoutRepository.createWorkoutLog({
      userId,
      ...logData,
    });

    logger.info(`Workout logged: ${log._id} by user: ${userId}`);

    return log;
  }

  async getWorkoutLog(logId) {
    const log = await workoutRepository.findWorkoutLogById(logId);

    if (!log) {
      throw new NotFoundError('Workout log');
    }

    return log;
  }

  async getWorkoutLogs(filters, options) {
    const { logs, total } = await workoutRepository.findAllWorkoutLogs(filters, options);

    return { logs, total };
  }

  async updateWorkoutLog(logId, userId, userRole, updates) {
    const log = await workoutRepository.findWorkoutLogById(logId);

    if (!log) {
      throw new NotFoundError('Workout log');
    }

    // Check permissions
    if (userRole !== 'admin' && userRole !== 'coach' && log.userId._id.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to update this log');
    }

    const updatedLog = await workoutRepository.updateWorkoutLog(logId, updates);

    logger.info(`Workout log updated: ${logId}`);

    return updatedLog;
  }

  async getWorkoutStats(userId, startDate, endDate) {
    const stats = await workoutRepository.getWorkoutStats(userId, startDate, endDate);

    return stats.length > 0 ? stats[0] : {
      totalWorkouts: 0,
      totalDuration: 0,
      totalVolume: 0,
      totalCalories: 0,
      avgRating: 0,
    };
  }
}

module.exports = new WorkoutService();
