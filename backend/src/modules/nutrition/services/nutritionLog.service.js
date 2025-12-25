/**
 * Nutrition Log Service
 * Enhanced daily nutrition tracking with auto-adjust integration
 */

const NutritionLog = require('../models/nutritionLog.model');
const autoAdjustService = require('./autoAdjust.service');
const logger = require('../../../common/utils/logger');

class NutritionLogService {
  /**
   * Create daily nutrition log
   */
  async createLog(userId, logData) {
    const { date, calories, protein, carbs, fats, fiber, sleep, mood, energy, water, weight, notes } = logData;

    // Check if log already exists for this date
    const existingLog = await NutritionLog.findOne({
      userId,
      date: new Date(date).setHours(0, 0, 0, 0),
    });

    if (existingLog) {
      throw new Error('Log already exists for this date. Use update instead.');
    }

    const log = new NutritionLog({
      userId,
      date,
      calories,
      protein,
      carbs,
      fats,
      fiber,
      sleep,
      mood,
      energy,
      water,
      weight,
      notes,
    });

    await log.save();

    // Check auto-adjust rules
    await autoAdjustService.checkRulesForUser(userId);

    logger.info(`Nutrition log created for user ${userId} on ${date}`);

    return log;
  }

  /**
   * Update nutrition log
   */
  async updateLog(logId, userId, updates) {
    const log = await NutritionLog.findOne({ _id: logId, userId });

    if (!log) {
      throw new Error('Nutrition log not found');
    }

    Object.assign(log, updates);
    await log.save();

    logger.info(`Nutrition log updated: ${logId}`);

    return log;
  }

  /**
   * Get logs for date range
   */
  async getLogsForRange(userId, startDate, endDate) {
    const logs = await NutritionLog.find({
      userId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: -1 });

    return logs;
  }

  /**
   * Get weekly summary
   */
  async getWeeklySummary(userId, weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const logs = await this.getLogsForRange(userId, weekStart, weekEnd);

    if (logs.length === 0) {
      return {
        weekStart,
        weekEnd,
        daysLogged: 0,
        averages: {},
      };
    }

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + (log.carbs || 0),
        fats: acc.fats + (log.fats || 0),
        water: acc.water + (log.water || 0),
        weight: log.weight ? acc.weight + log.weight : acc.weight,
        weightCount: log.weight ? acc.weightCount + 1 : acc.weightCount,
        sleepHours: log.sleep?.hours ? acc.sleepHours + log.sleep.hours : acc.sleepHours,
        sleepCount: log.sleep?.hours ? acc.sleepCount + 1 : acc.sleepCount,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        water: 0,
        weight: 0,
        weightCount: 0,
        sleepHours: 0,
        sleepCount: 0,
      },
    );

    const averages = {
      calories: Math.round(totals.calories / logs.length),
      protein: Math.round(totals.protein / logs.length),
      carbs: totals.carbs > 0 ? Math.round(totals.carbs / logs.length) : null,
      fats: totals.fats > 0 ? Math.round(totals.fats / logs.length) : null,
      water: totals.water > 0 ? (totals.water / logs.length).toFixed(1) : null,
      weight: totals.weightCount > 0 ? (totals.weight / totals.weightCount).toFixed(1) : null,
      sleepHours: totals.sleepCount > 0 ? (totals.sleepHours / totals.sleepCount).toFixed(1) : null,
    };

    // Calculate weight trend
    const weightLogs = logs.filter(l => l.weight).sort((a, b) => a.date - b.date);
    let weightTrend = null;
    
    if (weightLogs.length >= 2) {
      const firstWeight = weightLogs[0].weight;
      const lastWeight = weightLogs[weightLogs.length - 1].weight;
      const daysBetween = (weightLogs[weightLogs.length - 1].date - weightLogs[0].date) / (1000 * 60 * 60 * 24);
      const weeklyChange = ((lastWeight - firstWeight) / daysBetween) * 7;
      
      weightTrend = {
        start: firstWeight,
        end: lastWeight,
        change: (lastWeight - firstWeight).toFixed(2),
        weeklyRate: weeklyChange.toFixed(2),
        direction: lastWeight > firstWeight ? 'increasing' : lastWeight < firstWeight ? 'decreasing' : 'stable',
      };
    }

    // Calculate adherence
    const logsWithTargets = logs.filter(l => l.targets?.calories);
    let adherence = null;
    
    if (logsWithTargets.length > 0) {
      const withinTarget = logsWithTargets.filter(l => l.adherence?.withinTarget).length;
      adherence = {
        rate: ((withinTarget / logsWithTargets.length) * 100).toFixed(1),
        daysWithinTarget: withinTarget,
        totalDays: logsWithTargets.length,
      };
    }

    return {
      weekStart,
      weekEnd,
      daysLogged: logs.length,
      averages,
      weightTrend,
      adherence,
      logs,
    };
  }

  /**
   * Get nutrition trends
   */
  async getNutritionTrends(userId, weeks = 4) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const logs = await this.getLogsForRange(userId, startDate, endDate);

    // Group by week
    const weeklyData = {};
    
    logs.forEach(log => {
      const weekKey = `${log.year}-W${log.weekNumber}`;
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = [];
      }
      weeklyData[weekKey].push(log);
    });

    // Calculate weekly averages
    const trends = Object.entries(weeklyData).map(([week, weekLogs]) => {
      const totals = weekLogs.reduce(
        (acc, log) => ({
          calories: acc.calories + log.calories,
          protein: acc.protein + log.protein,
          weight: log.weight ? acc.weight + log.weight : acc.weight,
          weightCount: log.weight ? acc.weightCount + 1 : acc.weightCount,
        }),
        { calories: 0, protein: 0, weight: 0, weightCount: 0 },
      );

      return {
        week,
        daysLogged: weekLogs.length,
        avgCalories: Math.round(totals.calories / weekLogs.length),
        avgProtein: Math.round(totals.protein / weekLogs.length),
        avgWeight: totals.weightCount > 0 ? (totals.weight / totals.weightCount).toFixed(1) : null,
      };
    }).sort((a, b) => a.week.localeCompare(b.week));

    return {
      weeks,
      startDate,
      endDate,
      trends,
    };
  }

  /**
   * Delete log
   */
  async deleteLog(logId, userId) {
    const result = await NutritionLog.deleteOne({ _id: logId, userId });

    if (result.deletedCount === 0) {
      throw new Error('Nutrition log not found');
    }

    logger.info(`Nutrition log deleted: ${logId}`);

    return { message: 'Log deleted successfully' };
  }
}

module.exports = new NutritionLogService();

