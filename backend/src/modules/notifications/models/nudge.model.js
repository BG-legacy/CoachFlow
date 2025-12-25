/**
 * Nudge Model
 * Behavioral nudges sent to users (what was sent, why, when)
 */

const mongoose = require('mongoose');

const nudgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'workout_reminder',
        'nutrition_log_reminder',
        'checkin_reminder',
        'streak_motivation',
        'goal_progress',
        'milestone_celebration',
        're_engagement',
        'form_check_suggestion',
        'hydration_reminder',
        'recovery_suggestion',
        'program_adjustment',
        'custom',
      ],
      required: true,
      index: true,
    },
    trigger: {
      type: {
        type: String,
        enum: [
          'scheduled', // Time-based
          'event', // Triggered by user action
          'inactivity', // Lack of action
          'milestone', // Achievement reached
          'behavioral', // AI-driven behavior pattern
          'manual', // Coach-triggered
        ],
        required: true,
      },
      reason: {
        type: String,
        required: true,
      },
      metadata: mongoose.Schema.Types.Mixed,
    },
    content: {
      title: String,
      message: {
        type: String,
        required: true,
      },
      actionButton: {
        text: String,
        link: String,
      },
      imageUrl: String,
    },
    channel: {
      type: String,
      enum: ['push', 'email', 'sms', 'in_app'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    sentAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'cancelled'],
      default: 'sent',
    },
    // Tracking effectiveness
    interaction: {
      opened: {
        type: Boolean,
        default: false,
      },
      openedAt: Date,
      clicked: {
        type: Boolean,
        default: false,
      },
      clickedAt: Date,
      dismissed: {
        type: Boolean,
        default: false,
      },
      dismissedAt: Date,
      // Did the nudge achieve its goal?
      goalAchieved: {
        type: Boolean,
        default: false,
      },
      goalAchievedAt: Date,
    },
    // Related entities that triggered this nudge
    relatedEntity: {
      type: {
        type: String,
        enum: ['workout', 'meal_log', 'checkin', 'program', 'goal', 'streak'],
      },
      id: mongoose.Schema.Types.ObjectId,
    },
    // A/B testing and optimization
    variant: String,
    experimentId: String,
    // Success metrics
    metrics: {
      timeToAction: Number, // milliseconds from sent to action
      engagementScore: Number, // 0-100
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics and querying
nudgeSchema.index({ userId: 1, sentAt: -1 });
nudgeSchema.index({ type: 1, sentAt: -1 });
nudgeSchema.index({ 'trigger.type': 1 });
nudgeSchema.index({ status: 1 });
nudgeSchema.index({ 'interaction.goalAchieved': 1 });
nudgeSchema.index({ experimentId: 1, variant: 1 });

module.exports = mongoose.model('Nudge', nudgeSchema);




