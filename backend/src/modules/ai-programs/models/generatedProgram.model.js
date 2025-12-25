/**
 * Generated Program Model
 * Tracks AI-generated workout and nutrition programs
 */

const mongoose = require('mongoose');

const generatedProgramSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Generation request details
    requestId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    generationType: {
      type: String,
      enum: ['workout_program', 'nutrition_plan', 'combined', 'workout_only', 'meal_plan_only'],
      required: true,
    },
    // Input data used for generation
    inputData: {
      clientProfile: mongoose.Schema.Types.Mixed,
      goals: [String],
      duration: Number, // in weeks
      preferences: mongoose.Schema.Types.Mixed,
      constraints: mongoose.Schema.Types.Mixed,
      additionalRequirements: String,
    },
    // AI generation metadata
    aiMetadata: {
      model: String,
      promptTemplate: String,
      temperature: Number,
      tokensUsed: {
        prompt: Number,
        completion: Number,
        total: Number,
      },
      estimatedCost: Number,
      generationTime: Number, // milliseconds
      aiRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AIRequest',
      },
    },
    // Generated content
    generatedContent: {
      workoutProgram: {
        programId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Program',
        },
        name: String,
        description: String,
        duration: {
          weeks: Number,
          workoutsPerWeek: Number,
        },
        workouts: [mongoose.Schema.Types.Mixed],
        reasoning: String, // AI's explanation for the program design
        // Progression Engine Support
        progressionEngine: {
          // RPE (Rate of Perceived Exertion) targets
          rpeTargets: {
            enabled: {
              type: Boolean,
              default: false,
            },
            weeklyTargets: [{
              week: Number,
              targetRPE: Number, // 1-10 scale
              notes: String,
            }],
            exerciseSpecificTargets: [{
              exerciseId: String,
              targetRPE: Number,
              adjustmentRules: String,
            }],
          },
          // Progression rules
          progressionRules: {
            strategy: {
              type: String,
              enum: ['linear', 'wave', 'double_progression', 'percentage_based', 'autoregulated', 'custom'],
              default: 'linear',
            },
            weightIncrement: {
              type: Number, // in kg or lbs
              default: 2.5,
            },
            repRangeProgression: {
              minReps: Number,
              maxReps: Number,
              incrementWhen: String, // e.g., "Complete all sets at maxReps"
            },
            weeklyLoad: [{
              week: Number,
              loadPercentage: Number, // Percentage of max
              volume: String, // e.g., "high", "medium", "low"
            }],
            conditions: [{
              metric: String, // e.g., "rpe", "completedSets", "formQuality"
              threshold: mongoose.Schema.Types.Mixed,
              action: String, // e.g., "increase_weight", "maintain", "deload"
              value: mongoose.Schema.Types.Mixed,
            }],
            customRules: String, // AI-generated custom progression logic
          },
          // Deload triggers and protocol
          deloadProtocol: {
            enabled: {
              type: Boolean,
              default: true,
            },
            scheduledDeloads: [{
              week: Number,
              type: {
                type: String,
                enum: ['volume_reduction', 'intensity_reduction', 'complete_rest', 'active_recovery'],
              },
              reduction: Number, // Percentage reduction
              notes: String,
            }],
            autoDeloadTriggers: [{
              condition: String, // e.g., "consecutive_failed_workouts", "high_avg_rpe", "poor_recovery"
              threshold: mongoose.Schema.Types.Mixed,
              protocol: {
                type: String,
                enum: ['immediate_deload', 'schedule_next_week', 'reduce_volume', 'reduce_intensity'],
              },
              reductionPercentage: Number,
              notes: String,
            }],
            recoveryIndicators: [{
              metric: String, // e.g., "sleep_quality", "soreness_level", "energy"
              target: String,
              weight: Number, // Importance weight for decision making
            }],
          },
        },
      },
      nutritionPlan: {
        mealPlanId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MealPlan',
        },
        name: String,
        description: String,
        dailyTargets: mongoose.Schema.Types.Mixed,
        meals: [mongoose.Schema.Types.Mixed],
        reasoning: String,
      },
      summary: String, // Overall program summary
      keyRecommendations: [String],
      warnings: [String], // Any cautions or considerations
    },
    // Status and approval workflow
    status: {
      type: String,
      enum: ['generating', 'generated', 'reviewed', 'approved', 'rejected', 'applied', 'archived'],
      default: 'generating',
    },
    reviewNotes: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    // Applied to client
    appliedAt: Date,
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Quality and feedback
    quality: {
      coachRating: Number, // 1-5
      clientRating: Number, // 1-5
      wasUseful: Boolean,
      modifications: [{
        field: String,
        originalValue: mongoose.Schema.Types.Mixed,
        modifiedValue: mongoose.Schema.Types.Mixed,
        reason: String,
        modifiedAt: Date,
      }],
      feedback: String,
    },
    // Version tracking
    version: {
      type: Number,
      default: 1,
    },
    parentGenerationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GeneratedProgram',
    },
    // Privacy and retention
    dataRetentionDays: {
      type: Number,
      default: 180,
    },
    scheduledDeletionDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
generatedProgramSchema.index({ coachId: 1, createdAt: -1 });
generatedProgramSchema.index({ clientId: 1, createdAt: -1 });
generatedProgramSchema.index({ status: 1, createdAt: -1 });
generatedProgramSchema.index({ generationType: 1 });

// Set scheduled deletion date before saving
generatedProgramSchema.pre('save', function (next) {
  if (!this.scheduledDeletionDate) {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + this.dataRetentionDays);
    this.scheduledDeletionDate = deletionDate;
  }
  next();
});

// TTL index for automatic deletion (combines index + TTL functionality)
generatedProgramSchema.index({ scheduledDeletionDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('GeneratedProgram', generatedProgramSchema);

