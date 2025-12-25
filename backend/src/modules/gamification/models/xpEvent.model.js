/**
 * XP Event Model
 * Atomic XP award events for tracking and auditing
 */

const mongoose = require('mongoose');

const xpEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'workout_completed',
        'nutrition_logged',
        'checkin_submitted',
        'program_completed',
        'streak_milestone',
        'form_video_uploaded',
        'goal_achieved',
        'badge_earned',
        'referral_completed',
        'profile_completed',
        'social_share',
        'challenge_participated',
        'perfect_week',
        'manual_award',
        'bonus',
      ],
      required: true,
      index: true,
    },
    xpAwarded: {
      type: Number,
      required: true,
      min: 0,
    },
    multiplier: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    baseXP: Number, // Original XP before multiplier
    reason: {
      type: String,
      required: true,
    },
    // Related entity that triggered XP award
    source: {
      type: {
        type: String,
        enum: ['workout', 'nutrition', 'checkin', 'program', 'badge', 'streak', 'manual', 'other'],
      },
      id: mongoose.Schema.Types.ObjectId,
      metadata: mongoose.Schema.Types.Mixed,
    },
    // Level context when XP was awarded
    levelContext: {
      previousLevel: Number,
      newLevel: Number,
      previousXP: Number,
      newXP: Number,
      leveledUp: {
        type: Boolean,
        default: false,
      },
    },
    // For manual awards by coaches/admins
    awardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    awardedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    // Bonus/Special event tracking
    isBonus: {
      type: Boolean,
      default: false,
    },
    bonusReason: String,
    // Campaign/event tracking
    campaignId: String,
    eventId: String,
    // Revocation (in case of corrections)
    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: Date,
    revokedReason: String,
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics and leaderboards
xpEventSchema.index({ userId: 1, awardedAt: -1 });
xpEventSchema.index({ eventType: 1, awardedAt: -1 });
xpEventSchema.index({ 'levelContext.leveledUp': 1 });
xpEventSchema.index({ campaignId: 1 });
xpEventSchema.index({ revoked: 1 });

// Calculate total XP for a user in a time range
xpEventSchema.statics.calculateTotalXP = async function(userId, startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        awardedAt: { $gte: startDate, $lte: endDate },
        revoked: false,
      },
    },
    {
      $group: {
        _id: null,
        totalXP: { $sum: '$xpAwarded' },
        eventCount: { $sum: 1 },
      },
    },
  ]);
  
  return result[0] || { totalXP: 0, eventCount: 0 };
};

module.exports = mongoose.model('XPEvent', xpEventSchema);




