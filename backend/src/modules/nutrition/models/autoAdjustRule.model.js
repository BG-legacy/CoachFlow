/**
 * Auto-Adjust Rule Model
 * Trainer-controlled rules for automatic nutrition adjustments
 */

const mongoose = require('mongoose');

const autoAdjustRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    // Rule conditions
    conditions: {
      // Weight trend
      weightTrend: {
        enabled: Boolean,
        threshold: Number, // kg per week
        direction: {
          type: String,
          enum: ['increasing', 'decreasing', 'stable'],
        },
        weeks: Number, // Number of weeks to check
      },
      // Adherence
      adherence: {
        enabled: Boolean,
        minPercentage: Number, // Minimum adherence %
        weeks: Number,
      },
      // Performance metrics
      performance: {
        enabled: Boolean,
        energyLevel: {
          type: String,
          enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
        },
        sleepQuality: {
          type: String,
          enum: ['poor', 'fair', 'good', 'excellent'],
        },
      },
    },
    // Adjustment actions
    actions: {
      calorieAdjustment: {
        type: Number, // +/- calories
      },
      percentageAdjustment: {
        type: Number, // +/- percentage
      },
      proteinAdjustment: Number,
      carbAdjustment: Number,
      fatAdjustment: Number,
      notify: {
        coach: Boolean,
        client: Boolean,
      },
      requiresApproval: {
        type: Boolean,
        default: true,
      },
    },
    // Rule settings
    isActive: {
      type: Boolean,
      default: true,
    },
    autoApply: {
      type: Boolean,
      default: false, // If false, creates suggestion instead
    },
    checkFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly'],
      default: 'weekly',
    },
    lastChecked: Date,
    lastTriggered: Date,
    // History
    triggers: [{
      date: Date,
      conditions: mongoose.Schema.Types.Mixed,
      adjustmentsMade: mongoose.Schema.Types.Mixed,
      approved: Boolean,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
  },
  {
    timestamps: true,
  },
);

// Indexes
autoAdjustRuleSchema.index({ userId: 1, isActive: 1 });
autoAdjustRuleSchema.index({ createdBy: 1 });
autoAdjustRuleSchema.index({ lastChecked: 1 });

module.exports = mongoose.model('AutoAdjustRule', autoAdjustRuleSchema);

