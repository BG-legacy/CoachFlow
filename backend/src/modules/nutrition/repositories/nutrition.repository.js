/**
 * Nutrition Repository
 */

const MealPlan = require('../models/mealPlan.model');
const FoodLog = require('../models/foodLog.model');

class NutritionRepository {
  // Meal Plan operations
  async createMealPlan(planData) {
    return await MealPlan.create(planData);
  }

  async findMealPlanById(id) {
    return await MealPlan.findById(id)
      .populate('coachId clientId', 'firstName lastName email');
  }

  async findAllMealPlans(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const plans = await MealPlan.find(filters)
      .populate('coachId clientId', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await MealPlan.countDocuments(filters);

    return { plans, total };
  }

  async updateMealPlan(id, updates) {
    return await MealPlan.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
  }

  async deleteMealPlan(id) {
    return await MealPlan.findByIdAndDelete(id);
  }

  async getActiveMealPlan(clientId) {
    return await MealPlan.findOne({
      clientId,
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null },
      ],
    }).populate('coachId', 'firstName lastName');
  }

  // Food Log operations
  async createFoodLog(logData) {
    return await FoodLog.create(logData);
  }

  async findFoodLogById(id) {
    return await FoodLog.findById(id).populate('userId', 'firstName lastName');
  }

  async findFoodLogByDate(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await FoodLog.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
  }

  async findAllFoodLogs(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-date' } = options;
    const skip = (page - 1) * limit;

    const logs = await FoodLog.find(filters)
      .populate('userId', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await FoodLog.countDocuments(filters);

    return { logs, total };
  }

  async updateFoodLog(id, updates) {
    return await FoodLog.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
  }

  async addFoodEntry(userId, date, entry) {
    const log = await this.findFoodLogByDate(userId, date);

    if (log) {
      log.entries.push(entry);
      return await log.save();
    }

    return await this.createFoodLog({
      userId,
      date,
      entries: [entry],
    });
  }

  async getNutritionStats(userId, startDate, endDate) {
    return await FoodLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          avgCalories: { $avg: '$totals.calories' },
          avgProtein: { $avg: '$totals.protein' },
          avgCarbs: { $avg: '$totals.carbs' },
          avgFats: { $avg: '$totals.fats' },
          totalWater: { $sum: '$water' },
          daysLogged: { $sum: 1 },
        },
      },
    ]);
  }
}

module.exports = new NutritionRepository();
