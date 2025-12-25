/**
 * Gamification Service
 */

const Gamification = require('../models/gamification.model');
const logger = require('../../../common/utils/logger');

// XP Awards
const XP_AWARDS = {
  WORKOUT_COMPLETED: 50,
  NUTRITION_LOGGED: 20,
  CHECKIN_SUBMITTED: 30,
  PROGRAM_COMPLETED: 200,
  STREAK_7_DAYS: 100,
  STREAK_30_DAYS: 500,
};

// Badge definitions
const BADGES = {
  FIRST_WORKOUT: {
    id: 'first_workout', name: 'First Workout', description: 'Complete your first workout', icon: '🏋️',
  },
  WORKOUT_10: {
    id: 'workout_10', name: 'Workout Warrior', description: 'Complete 10 workouts', icon: '💪',
  },
  WORKOUT_50: {
    id: 'workout_50', name: 'Fitness Pro', description: 'Complete 50 workouts', icon: '🔥',
  },
  STREAK_7: {
    id: 'streak_7', name: '7 Day Streak', description: 'Maintain a 7-day workout streak', icon: '⭐',
  },
  STREAK_30: {
    id: 'streak_30', name: '30 Day Streak', description: 'Maintain a 30-day workout streak', icon: '🌟',
  },
  PROGRAM_COMPLETE: {
    id: 'program_complete', name: 'Program Master', description: 'Complete a full program', icon: '🏆',
  },
};

class GamificationService {
  async getOrCreateProfile(userId) {
    let profile = await Gamification.findOne({ userId });

    if (!profile) {
      profile = await Gamification.create({ userId });
      logger.info(`Gamification profile created for user: ${userId}`);
    }

    return profile;
  }

  async awardXP(userId, amount, reason) {
    const profile = await this.getOrCreateProfile(userId);
    const oldLevel = profile.level;

    profile.awardXP(amount, reason);
    await profile.save();

    const leveledUp = profile.level > oldLevel;

    logger.info(`Awarded ${amount} XP to user ${userId} for: ${reason}`);

    return { profile, leveledUp, xpAwarded: amount };
  }

  async handleWorkoutCompleted(userId) {
    const profile = await this.getOrCreateProfile(userId);

    // Award XP
    await this.awardXP(userId, XP_AWARDS.WORKOUT_COMPLETED, 'Workout completed');

    // Update achievements
    profile.achievements.totalWorkouts += 1;

    // Check for badges
    if (profile.achievements.totalWorkouts === 1) {
      profile.awardBadge(BADGES.FIRST_WORKOUT);
    } else if (profile.achievements.totalWorkouts === 10) {
      profile.awardBadge(BADGES.WORKOUT_10);
    } else if (profile.achievements.totalWorkouts === 50) {
      profile.awardBadge(BADGES.WORKOUT_50);
    }

    // Update workout streak
    const today = new Date().setHours(0, 0, 0, 0);
    const lastWorkout = profile.streaks.workout.lastWorkoutDate
      ? new Date(profile.streaks.workout.lastWorkoutDate).setHours(0, 0, 0, 0)
      : null;

    if (!lastWorkout || today - lastWorkout > 86400000) {
      // More than 1 day
      if (lastWorkout && today - lastWorkout === 86400000) {
        // Exactly 1 day - continue streak
        profile.streaks.workout.current += 1;
      } else {
        // Reset streak
        profile.streaks.workout.current = 1;
      }

      profile.streaks.workout.lastWorkoutDate = new Date();

      if (profile.streaks.workout.current > profile.streaks.workout.longest) {
        profile.streaks.workout.longest = profile.streaks.workout.current;
      }

      // Check streak badges
      if (profile.streaks.workout.current === 7) {
        profile.awardBadge(BADGES.STREAK_7);
        await this.awardXP(userId, XP_AWARDS.STREAK_7_DAYS, '7-day streak');
      } else if (profile.streaks.workout.current === 30) {
        profile.awardBadge(BADGES.STREAK_30);
        await this.awardXP(userId, XP_AWARDS.STREAK_30_DAYS, '30-day streak');
      }
    }

    await profile.save();

    return profile;
  }

  async handleNutritionLogged(userId) {
    const profile = await this.getOrCreateProfile(userId);

    await this.awardXP(userId, XP_AWARDS.NUTRITION_LOGGED, 'Nutrition logged');

    profile.achievements.totalNutritionLogs += 1;
    await profile.save();

    return profile;
  }

  async handleCheckinSubmitted(userId) {
    const profile = await this.getOrCreateProfile(userId);

    await this.awardXP(userId, XP_AWARDS.CHECKIN_SUBMITTED, 'Check-in submitted');

    profile.achievements.totalCheckins += 1;
    await profile.save();

    return profile;
  }

  async handleProgramCompleted(userId) {
    const profile = await this.getOrCreateProfile(userId);

    await this.awardXP(userId, XP_AWARDS.PROGRAM_COMPLETED, 'Program completed');

    profile.achievements.programsCompleted += 1;
    profile.awardBadge(BADGES.PROGRAM_COMPLETE);

    await profile.save();

    return profile;
  }

  async getLeaderboard(limit = 10) {
    return await Gamification.find()
      .populate('userId', 'firstName lastName avatar')
      .sort('-xp')
      .limit(limit);
  }

  async getUserProfile(userId) {
    return await this.getOrCreateProfile(userId);
  }
}

module.exports = new GamificationService();
