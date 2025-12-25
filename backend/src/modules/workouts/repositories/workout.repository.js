/**
 * Workout Repository
 */

const Workout = require('../models/workout.model');
const Program = require('../models/program.model');
const WorkoutLog = require('../models/workoutLog.model');

class WorkoutRepository {
  // Workout CRUD
  async createWorkout(workoutData) {
    return await Workout.create(workoutData);
  }

  async findWorkoutById(id) {
    return await Workout.findById(id)
      .populate('coachId clientId', 'firstName lastName email')
      .populate('programId', 'name');
  }

  async findAllWorkouts(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const workouts = await Workout.find(filters)
      .populate('coachId clientId', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Workout.countDocuments(filters);

    return { workouts, total };
  }

  async updateWorkout(id, updates) {
    return await Workout.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
  }

  async deleteWorkout(id) {
    return await Workout.findByIdAndDelete(id);
  }

  // Program CRUD
  async createProgram(programData) {
    return await Program.create(programData);
  }

  async findProgramById(id) {
    return await Program.findById(id)
      .populate('coachId clientId', 'firstName lastName email')
      .populate('workouts');
  }

  async findAllPrograms(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const programs = await Program.find(filters)
      .populate('coachId clientId', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Program.countDocuments(filters);

    return { programs, total };
  }

  async updateProgram(id, updates) {
    return await Program.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
  }

  async deleteProgram(id) {
    return await Program.findByIdAndDelete(id);
  }

  async addWorkoutToProgram(programId, workoutId) {
    return await Program.findByIdAndUpdate(
      programId,
      { $push: { workouts: workoutId } },
      { new: true },
    );
  }

  // Workout Log CRUD
  async createWorkoutLog(logData) {
    return await WorkoutLog.create(logData);
  }

  async findWorkoutLogById(id) {
    return await WorkoutLog.findById(id)
      .populate('userId', 'firstName lastName')
      .populate('workoutId')
      .populate('programId', 'name');
  }

  async findAllWorkoutLogs(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-date' } = options;
    const skip = (page - 1) * limit;

    const logs = await WorkoutLog.find(filters)
      .populate('userId', 'firstName lastName')
      .populate('workoutId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await WorkoutLog.countDocuments(filters);

    return { logs, total };
  }

  async updateWorkoutLog(id, updates) {
    return await WorkoutLog.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
  }

  async getWorkoutStats(userId, startDate, endDate) {
    return await WorkoutLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
          completed: true,
        },
      },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalVolume: { $sum: '$totalVolume' },
          totalCalories: { $sum: '$caloriesBurned' },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);
  }
}

module.exports = new WorkoutRepository();
