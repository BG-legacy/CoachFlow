/**
 * Program Model
 */

const mongoose = require('mongoose');

const programSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    goal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness', 'sports_performance'],
    },
    // Versioning with activeVersionId pointer
    version: {
      type: Number,
      default: 1,
    },
    parentProgramId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
    activeVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
    versionNotes: String,
    isCurrentVersion: {
      type: Boolean,
      default: true,
    },
    duration: {
      weeks: {
        type: Number,
        required: true,
      },
      workoutsPerWeek: Number,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    workouts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout',
    }],
    isTemplate: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'paused', 'cancelled'],
      default: 'draft',
    },
    progress: {
      completedWorkouts: {
        type: Number,
        default: 0,
      },
      totalWorkouts: {
        type: Number,
        default: 0,
      },
      currentWeek: {
        type: Number,
        default: 1,
      },
    },
    tags: [String],
  },
  {
    timestamps: true,
  },
);

// Indexes
programSchema.index({ coachId: 1 });
programSchema.index({ clientId: 1 });
programSchema.index({ status: 1 });
programSchema.index({ isTemplate: 1, isPublic: 1 });
programSchema.index({ parentProgramId: 1, version: -1 });
programSchema.index({ activeVersionId: 1 });
programSchema.index({ isCurrentVersion: 1 });

module.exports = mongoose.model('Program', programSchema);
