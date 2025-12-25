/**
 * Workout Logging Service for AI-Generated Programs
 * Handles workout completion, set-by-set logging, and compliance tracking
 */

const mongoose = require('mongoose');
const GeneratedProgram = require('../models/generatedProgram.model');
const WorkoutLog = require('../../workouts/models/workoutLog.model');
const Workout = require('../../workouts/models/workout.model');
const logger = require('../../../common/utils/logger');

class WorkoutLoggingService {
  /**
   * Mark a workout as complete with full details
   * @param {ObjectId} userId - User completing the workout
   * @param {ObjectId} generatedProgramId - AI-generated program ID
   * @param {Object} workoutData - Workout completion data
   * @returns {Promise<Object>} Created workout log with compliance metrics
   */
  async markWorkoutComplete(userId, generatedProgramId, workoutData) {
    const {
      workoutIndex,
      workoutName,
      duration,
      exercises,
      rating,
      difficulty,
      notes,
      mood,
      date,
    } = workoutData;

    // Verify program exists and user has access
    const program = await GeneratedProgram.findById(generatedProgramId);
    if (!program) {
      throw new Error('Generated program not found');
    }

    if (program.clientId.toString() !== userId.toString()) {
      throw new Error('Unauthorized: Program does not belong to this user');
    }

    // Get the specific workout from the program
    const programWorkout = program.generatedContent?.workoutProgram?.workouts?.[workoutIndex];
    if (!programWorkout) {
      throw new Error('Workout not found in program');
    }

    // Calculate metrics
    const totalVolume = this._calculateTotalVolume(exercises);
    const averageRPE = this._calculateAverageRPE(exercises);
    
    // Process exercises to ensure proper structure
    const processedExercises = exercises.map((exercise) => {
      const targetExercise = programWorkout.exercises.find(
        (e) => e.exerciseId === exercise.exerciseId || e.name === exercise.name
      );

      return {
        exerciseId: exercise.exerciseId || targetExercise?.exerciseId,
        name: exercise.name,
        sets: exercise.sets.map((set) => ({
          setNumber: set.setNumber,
          reps: set.reps || 0,
          weight: set.weight || 0,
          duration: set.duration || 0,
          rpe: set.rpe,
          completed: set.completed !== false,
          notes: set.notes || '',
        })),
        targetSets: targetExercise?.sets,
        targetReps: targetExercise?.reps,
        targetWeight: targetExercise?.weight,
        averageRPE: this._calculateExerciseAverageRPE(exercise.sets),
      };
    });

    // Create workout log
    const workoutLog = new WorkoutLog({
      userId,
      workoutId: new mongoose.Types.ObjectId(), // Placeholder if no formal Workout doc
      programId: program.generatedContent?.workoutProgram?.programId,
      date: date || new Date(),
      duration,
      exercises: processedExercises,
      totalVolume,
      averageRPE,
      rating,
      difficulty,
      notes,
      mood,
      completed: true,
    });

    await workoutLog.save();

    // Calculate compliance metrics
    const complianceMetrics = await this.calculateComplianceMetrics(userId, generatedProgramId);

    logger.info(`Workout completed: ${workoutLog._id} for user: ${userId}`);

    return {
      workoutLog,
      complianceMetrics,
      progressionInsights: this._generateProgressionInsights(
        workoutLog,
        program,
        workoutIndex
      ),
    };
  }

  /**
   * Log individual sets as they are completed (progressive logging)
   * @param {ObjectId} workoutLogId - Workout log ID (can be draft)
   * @param {ObjectId} userId - User ID
   * @param {Object} setData - Set data to log
   * @returns {Promise<Object>} Updated workout log
   */
  async logSet(workoutLogId, userId, setData) {
    const { exerciseIndex, setNumber, reps, weight, duration, rpe, notes } = setData;

    // Find existing log or create draft
    let workoutLog = await WorkoutLog.findById(workoutLogId);
    
    if (!workoutLog) {
      throw new Error('Workout log not found. Create a workout session first.');
    }

    if (workoutLog.userId.toString() !== userId.toString()) {
      throw new Error('Unauthorized: Workout log does not belong to this user');
    }

    // Update the specific set
    if (!workoutLog.exercises[exerciseIndex]) {
      throw new Error('Exercise not found in workout log');
    }

    const exercise = workoutLog.exercises[exerciseIndex];
    
    // Find or create the set
    let setIndex = exercise.sets.findIndex((s) => s.setNumber === setNumber);
    
    if (setIndex === -1) {
      // Add new set
      exercise.sets.push({
        setNumber,
        reps,
        weight,
        duration,
        rpe,
        notes,
        completed: true,
      });
    } else {
      // Update existing set
      exercise.sets[setIndex] = {
        ...exercise.sets[setIndex],
        reps,
        weight,
        duration,
        rpe,
        notes,
        completed: true,
      };
    }

    // Recalculate exercise average RPE
    exercise.averageRPE = this._calculateExerciseAverageRPE(exercise.sets);

    // Recalculate overall metrics
    workoutLog.totalVolume = this._calculateTotalVolume(workoutLog.exercises);
    workoutLog.averageRPE = this._calculateAverageRPE(workoutLog.exercises);

    await workoutLog.save();

    logger.info(`Set logged: Exercise ${exerciseIndex}, Set ${setNumber} for workout: ${workoutLogId}`);

    return workoutLog;
  }

  /**
   * Start a workout session (creates a draft log)
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} generatedProgramId - AI-generated program ID
   * @param {Object} sessionData - Workout session data
   * @returns {Promise<Object>} Draft workout log
   */
  async startWorkoutSession(userId, generatedProgramId, sessionData) {
    const { workoutIndex, workoutName, date } = sessionData;

    const program = await GeneratedProgram.findById(generatedProgramId);
    if (!program) {
      throw new Error('Generated program not found');
    }

    if (program.clientId.toString() !== userId.toString()) {
      throw new Error('Unauthorized: Program does not belong to this user');
    }

    const programWorkout = program.generatedContent?.workoutProgram?.workouts?.[workoutIndex];
    if (!programWorkout) {
      throw new Error('Workout not found in program');
    }

    // Create draft workout log with exercises structure
    const exercises = programWorkout.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      sets: [],
      targetSets: exercise.sets,
      targetReps: exercise.reps,
      targetWeight: exercise.weight,
      averageRPE: 0,
    }));

    const workoutLog = new WorkoutLog({
      userId,
      workoutId: new mongoose.Types.ObjectId(),
      programId: program.generatedContent?.workoutProgram?.programId,
      date: date || new Date(),
      exercises,
      totalVolume: 0,
      averageRPE: 0,
      completed: false,
    });

    await workoutLog.save();

    logger.info(`Workout session started: ${workoutLog._id} for user: ${userId}`);

    return {
      workoutLog,
      targetWorkout: programWorkout,
    };
  }

  /**
   * Calculate compliance metrics for a user's AI program
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} generatedProgramId - AI-generated program ID
   * @returns {Promise<Object>} Compliance metrics
   */
  async calculateComplianceMetrics(userId, generatedProgramId) {
    const program = await GeneratedProgram.findById(generatedProgramId);
    if (!program) {
      throw new Error('Generated program not found');
    }

    const programStartDate = program.appliedAt || program.createdAt;
    const currentDate = new Date();
    
    // Calculate expected workouts based on program
    const weeksSinceStart = Math.floor(
      (currentDate - programStartDate) / (7 * 24 * 60 * 60 * 1000)
    );
    const workoutsPerWeek = program.generatedContent?.workoutProgram?.duration?.workoutsPerWeek || 3;
    const expectedWorkouts = Math.min(
      weeksSinceStart * workoutsPerWeek,
      program.generatedContent?.workoutProgram?.duration?.weeks * workoutsPerWeek
    );

    // Get all workout logs for this program
    const workoutLogs = await WorkoutLog.find({
      userId,
      programId: program.generatedContent?.workoutProgram?.programId,
      completed: true,
      date: { $gte: programStartDate },
    }).sort({ date: -1 });

    const completedWorkouts = workoutLogs.length;
    const adherenceRate = expectedWorkouts > 0 
      ? (completedWorkouts / expectedWorkouts) * 100 
      : 0;

    // Calculate average metrics
    const avgRPE = workoutLogs.length > 0
      ? workoutLogs.reduce((sum, log) => sum + (log.averageRPE || 0), 0) / workoutLogs.length
      : 0;

    const avgRating = workoutLogs.length > 0
      ? workoutLogs.reduce((sum, log) => sum + (log.rating || 0), 0) / workoutLogs.length
      : 0;

    const totalVolume = workoutLogs.reduce((sum, log) => sum + (log.totalVolume || 0), 0);
    
    // Calculate current week adherence
    const oneWeekAgo = new Date(currentDate - 7 * 24 * 60 * 60 * 1000);
    const thisWeekWorkouts = workoutLogs.filter((log) => log.date >= oneWeekAgo).length;
    const thisWeekAdherence = (thisWeekWorkouts / workoutsPerWeek) * 100;

    // Analyze RPE vs targets
    const rpeComparison = this._analyzeRPEAdherence(program, workoutLogs);

    // Calculate streaks
    const currentStreak = this._calculateWorkoutStreak(workoutLogs);

    return {
      program: {
        id: program._id,
        name: program.generatedContent?.workoutProgram?.name,
        startDate: programStartDate,
        duration: program.generatedContent?.workoutProgram?.duration,
      },
      adherence: {
        expectedWorkouts,
        completedWorkouts,
        adherenceRate: Math.round(adherenceRate * 10) / 10,
        thisWeekWorkouts,
        thisWeekAdherence: Math.round(thisWeekAdherence * 10) / 10,
        status: adherenceRate >= 80 ? 'excellent' : adherenceRate >= 60 ? 'good' : 'needs_improvement',
      },
      performance: {
        averageRPE: Math.round(avgRPE * 10) / 10,
        averageRating: Math.round(avgRating * 10) / 10,
        totalVolume: Math.round(totalVolume),
        rpeComparison,
      },
      streaks: {
        currentStreak,
        longestStreak: this._calculateLongestStreak(workoutLogs),
      },
      recentWorkouts: workoutLogs.slice(0, 5).map((log) => ({
        id: log._id,
        date: log.date,
        duration: log.duration,
        averageRPE: log.averageRPE,
        rating: log.rating,
        difficulty: log.difficulty,
      })),
      insights: this._generateComplianceInsights(
        adherenceRate,
        avgRPE,
        rpeComparison,
        currentStreak
      ),
    };
  }

  /**
   * Get all workout logs for an AI program
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} generatedProgramId - AI-generated program ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Workout logs
   */
  async getWorkoutLogs(userId, generatedProgramId, options = {}) {
    const { limit = 20, skip = 0, sortBy = '-date' } = options;

    const program = await GeneratedProgram.findById(generatedProgramId);
    if (!program) {
      throw new Error('Generated program not found');
    }

    const workoutLogs = await WorkoutLog.find({
      userId,
      programId: program.generatedContent?.workoutProgram?.programId,
    })
      .sort(sortBy)
      .limit(limit)
      .skip(skip);

    return workoutLogs;
  }

  /**
   * Get progression insights based on RPE and volume trends
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} generatedProgramId - AI-generated program ID
   * @returns {Promise<Object>} Progression insights
   */
  async getProgressionInsights(userId, generatedProgramId) {
    const program = await GeneratedProgram.findById(generatedProgramId);
    if (!program) {
      throw new Error('Generated program not found');
    }

    const workoutLogs = await WorkoutLog.find({
      userId,
      programId: program.generatedContent?.workoutProgram?.programId,
      completed: true,
    }).sort({ date: 1 });

    if (workoutLogs.length < 2) {
      return {
        message: 'Not enough data for progression analysis. Complete at least 2 workouts.',
        hasEnoughData: false,
      };
    }

    // Analyze volume progression
    const volumeTrend = this._analyzeVolumeTrend(workoutLogs);
    
    // Analyze RPE trends
    const rpeTrend = this._analyzeRPETrend(workoutLogs);
    
    // Exercise-specific progression
    const exerciseProgression = this._analyzeExerciseProgression(workoutLogs);

    // Check for deload needs based on progression engine rules
    const deloadRecommendation = this._checkDeloadNeeds(
      program,
      workoutLogs,
      rpeTrend
    );

    return {
      hasEnoughData: true,
      volumeTrend,
      rpeTrend,
      exerciseProgression: exerciseProgression.slice(0, 5), // Top 5 exercises
      deloadRecommendation,
      progressionScore: this._calculateProgressionScore(volumeTrend, rpeTrend),
      recommendations: this._generateProgressionRecommendations(
        volumeTrend,
        rpeTrend,
        deloadRecommendation,
        program
      ),
    };
  }

  // ==================== PRIVATE HELPER METHODS ====================

  _calculateTotalVolume(exercises) {
    return exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => {
        return sum + ((set.reps || 0) * (set.weight || 0));
      }, 0);
      return total + exerciseVolume;
    }, 0);
  }

  _calculateAverageRPE(exercises) {
    let totalRPE = 0;
    let setCount = 0;

    exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        if (set.rpe) {
          totalRPE += set.rpe;
          setCount++;
        }
      });
    });

    return setCount > 0 ? totalRPE / setCount : 0;
  }

  _calculateExerciseAverageRPE(sets) {
    const validRPEs = sets.filter((set) => set.rpe).map((set) => set.rpe);
    return validRPEs.length > 0
      ? validRPEs.reduce((sum, rpe) => sum + rpe, 0) / validRPEs.length
      : 0;
  }

  _generateProgressionInsights(workoutLog, program, workoutIndex) {
    const progressionEngine = program.generatedContent?.workoutProgram?.progressionEngine;
    if (!progressionEngine?.rpeTargets?.enabled) {
      return null;
    }

    // Get target RPE for this workout
    const programWeeks = program.generatedContent?.workoutProgram?.duration?.weeks || 12;
    const weeksSinceStart = Math.floor(
      (new Date() - (program.appliedAt || program.createdAt)) / (7 * 24 * 60 * 60 * 1000)
    );
    const currentWeek = Math.min(weeksSinceStart + 1, programWeeks);

    const targetRPEForWeek = progressionEngine.rpeTargets.weeklyTargets?.find(
      (target) => target.week === currentWeek
    );

    if (!targetRPEForWeek) {
      return null;
    }

    const actualRPE = workoutLog.averageRPE;
    const targetRPE = targetRPEForWeek.targetRPE;
    const rpeDiff = actualRPE - targetRPE;

    let insight = '';
    let recommendation = '';

    if (rpeDiff > 1) {
      insight = `RPE was higher than target (${actualRPE.toFixed(1)} vs ${targetRPE})`;
      recommendation = 'Consider reducing weight slightly or taking extra rest days';
    } else if (rpeDiff < -1) {
      insight = `RPE was lower than target (${actualRPE.toFixed(1)} vs ${targetRPE})`;
      recommendation = 'You may be ready to increase intensity';
    } else {
      insight = `RPE on target (${actualRPE.toFixed(1)} vs ${targetRPE})`;
      recommendation = 'Keep up the great work!';
    }

    return {
      currentWeek,
      targetRPE,
      actualRPE: Math.round(actualRPE * 10) / 10,
      difference: Math.round(rpeDiff * 10) / 10,
      insight,
      recommendation,
      notes: targetRPEForWeek.notes,
    };
  }

  _analyzeRPEAdherence(program, workoutLogs) {
    const rpeTargets = program.generatedContent?.workoutProgram?.progressionEngine?.rpeTargets;
    if (!rpeTargets?.enabled || !workoutLogs.length) {
      return null;
    }

    const programStartDate = program.appliedAt || program.createdAt;
    
    const comparison = workoutLogs.map((log) => {
      const weeksSinceStart = Math.floor(
        (log.date - programStartDate) / (7 * 24 * 60 * 60 * 1000)
      );
      const currentWeek = weeksSinceStart + 1;

      const targetRPEForWeek = rpeTargets.weeklyTargets?.find(
        (target) => target.week === currentWeek
      );

      return {
        date: log.date,
        week: currentWeek,
        actualRPE: log.averageRPE,
        targetRPE: targetRPEForWeek?.targetRPE,
        difference: targetRPEForWeek 
          ? log.averageRPE - targetRPEForWeek.targetRPE 
          : null,
      };
    }).filter((item) => item.targetRPE);

    const avgDifference = comparison.length > 0
      ? comparison.reduce((sum, item) => sum + Math.abs(item.difference), 0) / comparison.length
      : 0;

    return {
      adherenceRate: comparison.length > 0 ? 100 - (avgDifference / 10) * 100 : 0,
      averageDifference: Math.round(avgDifference * 10) / 10,
      recentComparisons: comparison.slice(-5),
    };
  }

  _calculateWorkoutStreak(workoutLogs) {
    if (workoutLogs.length === 0) return 0;

    const sortedLogs = [...workoutLogs].sort((a, b) => b.date - a.date);
    let streak = 0;
    let currentDate = new Date();

    for (const log of sortedLogs) {
      const daysDiff = Math.floor((currentDate - log.date) / (24 * 60 * 60 * 1000));
      
      if (daysDiff <= 2) {
        streak++;
        currentDate = log.date;
      } else {
        break;
      }
    }

    return streak;
  }

  _calculateLongestStreak(workoutLogs) {
    if (workoutLogs.length === 0) return 0;

    const sortedLogs = [...workoutLogs].sort((a, b) => a.date - b.date);
    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedLogs.length; i++) {
      const daysDiff = Math.floor(
        (sortedLogs[i].date - sortedLogs[i - 1].date) / (24 * 60 * 60 * 1000)
      );

      if (daysDiff <= 2) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }

  _generateComplianceInsights(adherenceRate, avgRPE, rpeComparison, currentStreak) {
    const insights = [];

    // Adherence insights
    if (adherenceRate >= 80) {
      insights.push({
        type: 'positive',
        category: 'adherence',
        message: `Excellent adherence at ${adherenceRate.toFixed(0)}%! Keep it up!`,
      });
    } else if (adherenceRate >= 60) {
      insights.push({
        type: 'neutral',
        category: 'adherence',
        message: `Good adherence at ${adherenceRate.toFixed(0)}%. Aim for 80%+ for best results.`,
      });
    } else {
      insights.push({
        type: 'warning',
        category: 'adherence',
        message: `Adherence is ${adherenceRate.toFixed(0)}%. Try to be more consistent for better results.`,
      });
    }

    // RPE insights
    if (avgRPE > 8.5) {
      insights.push({
        type: 'warning',
        category: 'intensity',
        message: `Average RPE is high (${avgRPE.toFixed(1)}). Consider a deload week.`,
      });
    } else if (avgRPE < 6) {
      insights.push({
        type: 'info',
        category: 'intensity',
        message: `Average RPE is low (${avgRPE.toFixed(1)}). You may be able to push harder.`,
      });
    }

    // Streak insights
    if (currentStreak >= 7) {
      insights.push({
        type: 'positive',
        category: 'consistency',
        message: `Amazing ${currentStreak}-workout streak! 🔥`,
      });
    } else if (currentStreak === 0) {
      insights.push({
        type: 'warning',
        category: 'consistency',
        message: 'Start a new workout streak today!',
      });
    }

    return insights;
  }

  _analyzeVolumeTrend(workoutLogs) {
    if (workoutLogs.length < 3) return null;

    const recentLogs = workoutLogs.slice(-5);
    const volumes = recentLogs.map((log) => log.totalVolume || 0);
    
    // Simple linear regression
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const firstHalf = volumes.slice(0, Math.ceil(volumes.length / 2));
    const secondHalf = volumes.slice(Math.ceil(volumes.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    
    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    return {
      current: recentLogs[recentLogs.length - 1].totalVolume,
      average: Math.round(avgVolume),
      trend: percentChange > 5 ? 'increasing' : percentChange < -5 ? 'decreasing' : 'stable',
      percentChange: Math.round(percentChange * 10) / 10,
      dataPoints: recentLogs.map((log) => ({
        date: log.date,
        volume: log.totalVolume,
      })),
    };
  }

  _analyzeRPETrend(workoutLogs) {
    if (workoutLogs.length < 3) return null;

    const recentLogs = workoutLogs.slice(-5);
    const rpes = recentLogs.map((log) => log.averageRPE || 0);
    
    const avgRPE = rpes.reduce((sum, r) => sum + r, 0) / rpes.length;
    const lastThree = rpes.slice(-3);
    const lastThreeAvg = lastThree.reduce((sum, r) => sum + r, 0) / lastThree.length;

    return {
      current: recentLogs[recentLogs.length - 1].averageRPE,
      average: Math.round(avgRPE * 10) / 10,
      recentAverage: Math.round(lastThreeAvg * 10) / 10,
      trend: lastThreeAvg > avgRPE + 0.5 ? 'increasing' : lastThreeAvg < avgRPE - 0.5 ? 'decreasing' : 'stable',
      dataPoints: recentLogs.map((log) => ({
        date: log.date,
        rpe: log.averageRPE,
      })),
    };
  }

  _analyzeExerciseProgression(workoutLogs) {
    const exerciseMap = new Map();

    workoutLogs.forEach((log) => {
      log.exercises.forEach((exercise) => {
        if (!exerciseMap.has(exercise.name)) {
          exerciseMap.set(exercise.name, []);
        }
        
        const maxWeight = Math.max(...exercise.sets.map((s) => s.weight || 0));
        const totalReps = exercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0);
        
        exerciseMap.get(exercise.name).push({
          date: log.date,
          maxWeight,
          totalReps,
          avgRPE: exercise.averageRPE,
        });
      });
    });

    const progressionData = [];

    exerciseMap.forEach((history, exerciseName) => {
      if (history.length < 2) return;

      const firstEntry = history[0];
      const lastEntry = history[history.length - 1];
      
      const weightIncrease = lastEntry.maxWeight - firstEntry.maxWeight;
      const weightPercentChange = firstEntry.maxWeight > 0
        ? (weightIncrease / firstEntry.maxWeight) * 100
        : 0;

      progressionData.push({
        exercise: exerciseName,
        sessions: history.length,
        startWeight: firstEntry.maxWeight,
        currentWeight: lastEntry.maxWeight,
        weightIncrease,
        weightPercentChange: Math.round(weightPercentChange * 10) / 10,
        trend: weightIncrease > 0 ? 'improving' : weightIncrease < 0 ? 'declining' : 'stable',
        history: history.slice(-5),
      });
    });

    return progressionData.sort((a, b) => b.weightPercentChange - a.weightPercentChange);
  }

  _checkDeloadNeeds(program, workoutLogs, rpeTrend) {
    const deloadProtocol = program.generatedContent?.workoutProgram?.progressionEngine?.deloadProtocol;
    
    if (!deloadProtocol?.enabled) {
      return null;
    }

    const triggers = [];

    // Check auto-deload triggers
    deloadProtocol.autoDeloadTriggers?.forEach((trigger) => {
      if (trigger.condition === 'high_avg_rpe' && rpeTrend) {
        if (rpeTrend.recentAverage >= trigger.threshold) {
          triggers.push({
            type: trigger.condition,
            triggered: true,
            message: `Recent average RPE (${rpeTrend.recentAverage}) exceeds threshold (${trigger.threshold})`,
            protocol: trigger.protocol,
            recommendation: trigger.notes,
          });
        }
      }

      if (trigger.condition === 'consecutive_failed_workouts') {
        const recentWorkouts = workoutLogs.slice(-trigger.threshold);
        const failedWorkouts = recentWorkouts.filter((log) => log.difficulty === 'too_hard');
        
        if (failedWorkouts.length >= trigger.threshold) {
          triggers.push({
            type: trigger.condition,
            triggered: true,
            message: `${failedWorkouts.length} consecutive workouts marked as too hard`,
            protocol: trigger.protocol,
            recommendation: trigger.notes,
          });
        }
      }
    });

    // Check scheduled deloads
    const programStartDate = program.appliedAt || program.createdAt;
    const currentWeek = Math.floor(
      (new Date() - programStartDate) / (7 * 24 * 60 * 60 * 1000)
    ) + 1;

    const scheduledDeload = deloadProtocol.scheduledDeloads?.find(
      (deload) => deload.week === currentWeek
    );

    return {
      needsDeload: triggers.length > 0 || !!scheduledDeload,
      triggers,
      scheduledDeload,
      recommendation: triggers.length > 0 || scheduledDeload
        ? 'Consider taking a deload week to recover'
        : 'No deload needed at this time',
    };
  }

  _calculateProgressionScore(volumeTrend, rpeTrend) {
    if (!volumeTrend || !rpeTrend) return 0;

    let score = 50; // Base score

    // Volume trend scoring
    if (volumeTrend.trend === 'increasing') {
      score += 25;
    } else if (volumeTrend.trend === 'decreasing') {
      score -= 15;
    }

    // RPE trend scoring (stable or decreasing is good)
    if (rpeTrend.trend === 'stable') {
      score += 15;
    } else if (rpeTrend.trend === 'decreasing') {
      score += 25;
    } else {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  _generateProgressionRecommendations(volumeTrend, rpeTrend, deloadRecommendation, program) {
    const recommendations = [];

    if (deloadRecommendation?.needsDeload) {
      recommendations.push({
        priority: 'high',
        category: 'recovery',
        message: deloadRecommendation.recommendation,
      });
    }

    if (volumeTrend?.trend === 'decreasing') {
      recommendations.push({
        priority: 'medium',
        category: 'volume',
        message: 'Volume is decreasing. Check if you need more recovery or should increase effort.',
      });
    }

    if (rpeTrend?.recentAverage > 8.5 && !deloadRecommendation?.needsDeload) {
      recommendations.push({
        priority: 'medium',
        category: 'intensity',
        message: 'RPE is consistently high. Monitor recovery and consider reducing volume.',
      });
    }

    if (volumeTrend?.trend === 'increasing' && rpeTrend?.trend === 'stable') {
      recommendations.push({
        priority: 'low',
        category: 'progress',
        message: 'Excellent progress! Volume is increasing while maintaining RPE. Keep it up!',
      });
    }

    return recommendations;
  }
}

module.exports = new WorkoutLoggingService();

