/**
 * Workout Log Model
 * Tracks actual workout performance
 */

const mongoose = require('mongoose');

const exerciseLogSchema = new mongoose.Schema({
  exerciseId: String,
  name: String,
  sets: [{
    setNumber: Number,
    reps: Number,
    weight: Number,
    duration: Number, // in seconds
    rpe: {
      type: Number,
      min: 1,
      max: 10, // Rate of Perceived Exertion (1-10 scale)
    },
    completed: {
      type: Boolean,
      default: false,
    },
    notes: String,
  }],
  targetSets: Number,
  targetReps: String,
  targetWeight: Number,
  averageRPE: Number, // Calculated average RPE across all sets
});

const workoutLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout',
      required: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    duration: Number, // actual duration in minutes
    exercises: [exerciseLogSchema],
    totalVolume: Number, // total weight lifted (sets × reps × weight)
    caloriesBurned: Number,
    averageHeartRate: Number,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    difficulty: {
      type: String,
      enum: ['too_easy', 'just_right', 'too_hard'],
    },
    notes: String,
    mood: String,
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
workoutLogSchema.index({ userId: 1 });
workoutLogSchema.index({ workoutId: 1 });
workoutLogSchema.index({ programId: 1 });
workoutLogSchema.index({ date: -1 });
// Hot query: userId + date (list user's workout history)
workoutLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
