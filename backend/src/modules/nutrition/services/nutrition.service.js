/**
 * Nutrition Service
 */

const nutritionRepository = require('../repositories/nutrition.repository');
const { NotFoundError, ForbiddenError } = require('../../../common/utils/errors');
const logger = require('../../../common/utils/logger');

class NutritionService {
  // Meal Plan operations
  async createMealPlan(coachId, planData) {
    const plan = await nutritionRepository.createMealPlan({
      coachId,
      ...planData,
    });

    logger.info(`Meal plan created: ${plan._id} by coach: ${coachId}`);

    return plan;
  }

  async getMealPlanById(planId) {
    const plan = await nutritionRepository.findMealPlanById(planId);

    if (!plan) {
      throw new NotFoundError('Meal plan');
    }

    return plan;
  }

  async getMealPlans(filters, options) {
    const { plans, total } = await nutritionRepository.findAllMealPlans(filters, options);

    return { plans, total };
  }

  async updateMealPlan(planId, userId, userRole, updates) {
    const plan = await nutritionRepository.findMealPlanById(planId);

    if (!plan) {
      throw new NotFoundError('Meal plan');
    }

    // Check permissions
    if (userRole !== 'admin' && plan.coachId._id.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to update this meal plan');
    }

    const updatedPlan = await nutritionRepository.updateMealPlan(planId, updates);

    logger.info(`Meal plan updated: ${planId}`);

    return updatedPlan;
  }

  async deleteMealPlan(planId, userId, userRole) {
    const plan = await nutritionRepository.findMealPlanById(planId);

    if (!plan) {
      throw new NotFoundError('Meal plan');
    }

    // Check permissions
    if (userRole !== 'admin' && plan.coachId._id.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to delete this meal plan');
    }

    await nutritionRepository.deleteMealPlan(planId);

    logger.info(`Meal plan deleted: ${planId}`);

    return { message: 'Meal plan deleted successfully' };
  }

  async assignMealPlan(planId, clientId, coachId, userRole) {
    const plan = await nutritionRepository.findMealPlanById(planId);

    if (!plan) {
      throw new NotFoundError('Meal plan');
    }

    // Check permissions
    if (userRole !== 'admin' && plan.coachId._id.toString() !== coachId) {
      throw new ForbiddenError('You do not have permission to assign this meal plan');
    }

    const updatedPlan = await nutritionRepository.updateMealPlan(planId, {
      clientId,
      isActive: true,
      startDate: new Date(),
    });

    logger.info(`Meal plan ${planId} assigned to client ${clientId}`);

    return updatedPlan;
  }

  async getActiveMealPlan(clientId) {
    const plan = await nutritionRepository.getActiveMealPlan(clientId);

    if (!plan) {
      throw new NotFoundError('Active meal plan');
    }

    return plan;
  }

  // Food Log operations
  async logFood(userId, date, foodEntry) {
    const log = await nutritionRepository.addFoodEntry(userId, date, foodEntry);

    logger.info(`Food logged for user: ${userId}`);

    return log;
  }

  async getFoodLogById(logId) {
    const log = await nutritionRepository.findFoodLogById(logId);

    if (!log) {
      throw new NotFoundError('Food log');
    }

    return log;
  }

  async getFoodLogByDate(userId, date) {
    const log = await nutritionRepository.findFoodLogByDate(userId, date);

    if (!log) {
      throw new NotFoundError('Food log for this date');
    }

    return log;
  }

  async getFoodLogs(filters, options) {
    const { logs, total } = await nutritionRepository.findAllFoodLogs(filters, options);

    return { logs, total };
  }

  async updateFoodLog(logId, userId, userRole, updates) {
    const log = await nutritionRepository.findFoodLogById(logId);

    if (!log) {
      throw new NotFoundError('Food log');
    }

    // Check permissions
    if (userRole !== 'admin' && userRole !== 'coach' && log.userId._id.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to update this log');
    }

    const updatedLog = await nutritionRepository.updateFoodLog(logId, updates);

    logger.info(`Food log updated: ${logId}`);

    return updatedLog;
  }

  async getNutritionStats(userId, startDate, endDate) {
    const stats = await nutritionRepository.getNutritionStats(userId, startDate, endDate);

    return stats.length > 0 ? stats[0] : {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFats: 0,
      totalWater: 0,
      daysLogged: 0,
    };
  }

  async getCalorieComparison(userId, date) {
    const log = await nutritionRepository.findFoodLogByDate(userId, date);

    if (!log) {
      return {
        consumed: 0,
        target: 0,
        remaining: 0,
        percentageConsumed: 0,
      };
    }

    const consumed = log.totals.calories || 0;
    const target = log.targets?.calories || 0;
    const remaining = target - consumed;
    const percentageConsumed = target > 0 ? (consumed / target) * 100 : 0;

    return {
      consumed,
      target,
      remaining,
      percentageConsumed,
    };
  }
}

module.exports = new NutritionService();
