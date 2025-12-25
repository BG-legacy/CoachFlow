/**
 * Weekly Report Model
 * Stores generated weekly summary reports
 */

const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    weekStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    weekEndDate: {
      type: Date,
      required: true,
    },
    weekNumber: Number, // Week number of the year
    year: Number,
    // Workout Statistics
    workoutStats: {
      totalWorkouts: {
        type: Number,
        default: 0,
      },
      completedWorkouts: Number,
      skippedWorkouts: Number,
      totalDuration: Number, // minutes
      totalVolume: Number, // kg
      averageRating: Number,
      averageRPE: Number,
      exercises: [{
        name: String,
        frequency: Number,
        totalSets: Number,
        totalReps: Number,
        averageWeight: Number,
        prAchieved: Boolean,
      }],
      adherence: Number, // percentage
    },
    // Nutrition Statistics
    nutritionStats: {
      daysLogged: {
        type: Number,
        default: 0,
      },
      averageCalories: Number,
      averageProtein: Number,
      averageCarbs: Number,
      averageFats: Number,
      targetAdherence: Number, // percentage
      bestDay: Date,
      insights: [String],
    },
    // Check-in Statistics
    checkinStats: {
      totalCheckins: {
        type: Number,
        default: 0,
      },
      currentWeight: Number,
      weightChange: Number, // vs previous week
      bodyFatChange: Number,
      averageMood: Number,
      averageEnergy: Number,
      averageStress: Number,
      averageSleepHours: Number,
      averageSleepQuality: Number,
    },
    // Gamification Progress
    gamificationProgress: {
      xpEarned: Number,
      levelUps: Number,
      badgesEarned: [{
        id: String,
        name: String,
        earnedAt: Date,
      }],
      streakProgress: {
        workout: Number,
        nutrition: Number,
        checkin: Number,
      },
    },
    // Overall Progress
    overallProgress: {
      adherenceScore: Number, // 0-100
      consistencyScore: Number, // 0-100
      improvementAreas: [String],
      strengths: [String],
      goalsProgress: [{
        goalType: String,
        progress: Number, // percentage
        status: String,
      }],
    },
    // Highlights & Achievements
    highlights: {
      personalRecords: [{
        exercise: String,
        type: String, // 'weight', 'reps', 'volume'
        value: Number,
        previousBest: Number,
        achievedAt: Date,
      }],
      achievements: [String],
      milestones: [String],
    },
    // Coach Feedback
    coachFeedback: {
      text: String,
      recommendations: [String],
      nextWeekFocus: [String],
      addedAt: Date,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // Report Status
    status: {
      type: String,
      enum: ['generated', 'reviewed', 'sent', 'archived'],
      default: 'generated',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    sentAt: Date,
    viewedAt: Date,
    // Metadata
    metadata: {
      generationTime: Number, // milliseconds
      version: {
        type: String,
        default: '1.0',
      },
      dataCompleteness: Number, // 0-100
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
weeklyReportSchema.index({ userId: 1, weekStartDate: -1 });
weeklyReportSchema.index({ coachId: 1, status: 1 });
weeklyReportSchema.index({ year: 1, weekNumber: 1 });
weeklyReportSchema.index({ status: 1, generatedAt: -1 });

// Compound index for finding user's specific week
weeklyReportSchema.index({ userId: 1, year: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);

