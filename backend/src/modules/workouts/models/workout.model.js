/**
 * Workout Model
 */

const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  exerciseId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  sets: {
    type: Number,
    required: true,
  },
  reps: String, // Can be "10", "8-12", "AMRAP", etc.
  duration: Number, // in seconds
  weight: Number, // in kg
  restTime: Number, // in seconds
  notes: String,
  videoUrl: String,
  order: Number,
});

const workoutSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    type: {
      type: String,
      enum: ['strength', 'cardio', 'hiit', 'flexibility', 'mobility', 'mixed', 'other'],
      default: 'mixed',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    duration: Number, // estimated duration in minutes
    exercises: [exerciseSchema],
    targetMuscles: [String],
    equipment: [String],
    isTemplate: {
      type: Boolean,
      default: false,
    },
    scheduledDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'completed', 'skipped'],
      default: 'draft',
    },
    notes: String,
  },
  {
    timestamps: true,
  },
);

// Indexes
workoutSchema.index({ coachId: 1 });
workoutSchema.index({ clientId: 1 });
workoutSchema.index({ programId: 1 });
workoutSchema.index({ scheduledDate: 1 });
workoutSchema.index({ status: 1 });

module.exports = mongoose.model('Workout', workoutSchema);
