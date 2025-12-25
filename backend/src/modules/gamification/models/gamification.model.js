/**
 * Gamification Model
 * Tracks XP, levels, badges, and perks
 */

const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  icon: String,
  earnedAt: {
    type: Date,
    default: Date.now,
  },
});

const perkSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  unlockedAt: {
    type: Date,
    default: Date.now,
  },
});

const gamificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    badges: [badgeSchema],
    perks: [perkSchema],
    streaks: {
      workout: {
        current: {
          type: Number,
          default: 0,
        },
        longest: {
          type: Number,
          default: 0,
        },
        lastWorkoutDate: Date,
      },
      nutrition: {
        current: {
          type: Number,
          default: 0,
        },
        longest: {
          type: Number,
          default: 0,
        },
        lastLogDate: Date,
      },
      checkin: {
        current: {
          type: Number,
          default: 0,
        },
        longest: {
          type: Number,
          default: 0,
        },
        lastCheckinDate: Date,
      },
    },
    achievements: {
      totalWorkouts: {
        type: Number,
        default: 0,
      },
      totalNutritionLogs: {
        type: Number,
        default: 0,
      },
      totalCheckins: {
        type: Number,
        default: 0,
      },
      programsCompleted: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Calculate level based on XP
gamificationSchema.methods.calculateLevel = function () {
  // Simple formula: level = floor(sqrt(xp / 100))
  this.level = Math.floor(Math.sqrt(this.xp / 100)) + 1;
  return this.level;
};

// Award XP
gamificationSchema.methods.awardXP = function (amount, reason) {
  this.xp += amount;
  this.calculateLevel();
  return this.xp;
};

// Award badge
gamificationSchema.methods.awardBadge = function (badge) {
  const exists = this.badges.find((b) => b.id === badge.id);
  if (!exists) {
    this.badges.push(badge);
  }
  return this.badges;
};

// Unlock perk
gamificationSchema.methods.unlockPerk = function (perk) {
  const exists = this.perks.find((p) => p.id === perk.id);
  if (!exists) {
    this.perks.push(perk);
  }
  return this.perks;
};

gamificationSchema.index({ userId: 1 });
gamificationSchema.index({ level: -1 });
gamificationSchema.index({ xp: -1 });

module.exports = mongoose.model('Gamification', gamificationSchema);
