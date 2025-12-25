/**
 * Report Service
 * Generates weekly summaries and analytics reports
 */

const WorkoutLog = require('../../workouts/models/workoutLog.model');
const FoodLog = require('../../nutrition/models/foodLog.model');
const Checkin = require('../../checkins/models/checkin.model');
const logger = require('../../../common/utils/logger');

class ReportService {
  async generateWeeklySummary(userId, weekStartDate) {
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Workout stats
    const workoutLogs = await WorkoutLog.find({
      userId,
      date: { $gte: weekStartDate, $lt: weekEnd },
    });

    const workoutStats = {
      totalWorkouts: workoutLogs.length,
      totalDuration: workoutLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
      totalVolume: workoutLogs.reduce((sum, log) => sum + (log.totalVolume || 0), 0),
      avgRating: workoutLogs.length > 0
        ? workoutLogs.reduce((sum, log) => sum + (log.rating || 0), 0) / workoutLogs.length
        : 0,
    };

    // Nutrition stats
    const foodLogs = await FoodLog.find({
      userId,
      date: { $gte: weekStartDate, $lt: weekEnd },
    });

    const nutritionStats = {
      daysLogged: foodLogs.length,
      avgCalories: foodLogs.length > 0
        ? foodLogs.reduce((sum, log) => sum + (log.totals?.calories || 0), 0) / foodLogs.length
        : 0,
      avgProtein: foodLogs.length > 0
        ? foodLogs.reduce((sum, log) => sum + (log.totals?.protein || 0), 0) / foodLogs.length
        : 0,
    };

    // Check-ins
    const checkins = await Checkin.find({
      clientId: userId,
      date: { $gte: weekStartDate, $lt: weekEnd },
    });

    const checkinStats = {
      totalCheckins: checkins.length,
      latestWeight: checkins.length > 0 ? checkins[checkins.length - 1]?.metrics?.weight : null,
    };

    const summary = {
      userId,
      weekStartDate,
      weekEndDate: weekEnd,
      workoutStats,
      nutritionStats,
      checkinStats,
      generatedAt: new Date(),
    };

    logger.info(`Weekly summary generated for user: ${userId}`);

    return summary;
  }

  async generateMonthlyReport(userId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all data for the month
    const workoutLogs = await WorkoutLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const foodLogs = await FoodLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const checkins = await Checkin.find({
      clientId: userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const report = {
      userId,
      month,
      year,
      period: {
        start: startDate,
        end: endDate,
      },
      workouts: {
        total: workoutLogs.length,
        totalDuration: workoutLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
        totalVolume: workoutLogs.reduce((sum, log) => sum + (log.totalVolume || 0), 0),
        avgPerWeek: workoutLogs.length / 4,
      },
      nutrition: {
        daysLogged: foodLogs.length,
        complianceRate: (foodLogs.length / 30) * 100,
        avgDailyCalories: foodLogs.length > 0
          ? foodLogs.reduce((sum, log) => sum + (log.totals?.calories || 0), 0) / foodLogs.length
          : 0,
      },
      progress: {
        checkins: checkins.length,
        weightChange: this.calculateWeightChange(checkins),
        adherenceRate: this.calculateAdherenceRate(checkins),
      },
      generatedAt: new Date(),
    };

    logger.info(`Monthly report generated for user: ${userId}`);

    return report;
  }

  calculateWeightChange(checkins) {
    if (checkins.length < 2) return 0;

    const first = checkins[0]?.metrics?.weight;
    const last = checkins[checkins.length - 1]?.metrics?.weight;

    return first && last ? last - first : 0;
  }

  calculateAdherenceRate(checkins) {
    if (checkins.length === 0) return 0;

    const totalAdherence = checkins.reduce(
      (sum, checkin) => sum + (checkin.adherence?.overall || 0),
      0,
    );

    return totalAdherence / checkins.length;
  }

  async getCoachDashboardStats(coachId) {
    // This would aggregate stats across all coach's clients
    // Simplified version:
    return {
      totalClients: 0, // Would query ClientProfile
      activePrograms: 0, // Would query Programs
      upcomingSessions: 0, // Would query Sessions
      pendingCheckins: 0, // Would query Checkins
    };
  }
}

module.exports = new ReportService();
