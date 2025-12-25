/**
 * Nutrition Controller
 */

const nutritionService = require('../services/nutrition.service');
const { successResponse, createdResponse, paginatedResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');

class NutritionController {
  // Meal Plan endpoints
  createMealPlan = asyncHandler(async (req, res) => {
    const plan = await nutritionService.createMealPlan(req.user._id, req.body);
    return createdResponse(res, plan, 'Meal plan created successfully');
  });

  getMealPlan = asyncHandler(async (req, res) => {
    const plan = await nutritionService.getMealPlanById(req.params.id);
    return successResponse(res, plan);
  });

  getMealPlans = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, clientId, isActive } = req.query;
    const filters = {};

    // Filter by coach's plans if coach role
    if (req.user.role === 'coach') {
      filters.coachId = req.user._id;
    }

    if (clientId) filters.clientId = clientId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const options = { page: parseInt(page), limit: parseInt(limit), sort };
    const { plans, total } = await nutritionService.getMealPlans(filters, options);

    return paginatedResponse(res, plans, parseInt(page), parseInt(limit), total);
  });

  updateMealPlan = asyncHandler(async (req, res) => {
    const plan = await nutritionService.updateMealPlan(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body
    );
    return successResponse(res, plan, 'Meal plan updated successfully');
  });

  deleteMealPlan = asyncHandler(async (req, res) => {
    const result = await nutritionService.deleteMealPlan(req.params.id, req.user._id, req.user.role);
    return successResponse(res, result);
  });

  assignMealPlan = asyncHandler(async (req, res) => {
    const { clientId } = req.body;
    const plan = await nutritionService.assignMealPlan(
      req.params.id,
      clientId,
      req.user._id,
      req.user.role
    );
    return successResponse(res, plan, 'Meal plan assigned successfully');
  });

  getActiveMealPlan = asyncHandler(async (req, res) => {
    const clientId = req.params.clientId || req.user._id;
    const plan = await nutritionService.getActiveMealPlan(clientId);
    return successResponse(res, plan);
  });

  // Food Log endpoints
  logFood = asyncHandler(async (req, res) => {
    const { date, ...foodEntry } = req.body;
    const log = await nutritionService.logFood(req.user._id, date || new Date(), foodEntry);
    return createdResponse(res, log, 'Food logged successfully');
  });

  getFoodLog = asyncHandler(async (req, res) => {
    const log = await nutritionService.getFoodLogById(req.params.id);
    return successResponse(res, log);
  });

  getFoodLogByDate = asyncHandler(async (req, res) => {
    const { date } = req.params;
    const userId = req.query.userId || req.user._id;
    const log = await nutritionService.getFoodLogByDate(userId, new Date(date));
    return successResponse(res, log);
  });

  getFoodLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, userId, startDate, endDate } = req.query;
    const filters = {};

    if (userId) filters.userId = userId;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    const options = { page: parseInt(page), limit: parseInt(limit), sort };
    const { logs, total } = await nutritionService.getFoodLogs(filters, options);

    return paginatedResponse(res, logs, parseInt(page), parseInt(limit), total);
  });

  updateFoodLog = asyncHandler(async (req, res) => {
    const log = await nutritionService.updateFoodLog(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body
    );
    return successResponse(res, log, 'Food log updated successfully');
  });

  getNutritionStats = asyncHandler(async (req, res) => {
    const { userId, startDate, endDate } = req.query;
    const targetUserId = userId || req.user._id;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await nutritionService.getNutritionStats(targetUserId, start, end);
    return successResponse(res, stats);
  });

  getCalorieComparison = asyncHandler(async (req, res) => {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const comparison = await nutritionService.getCalorieComparison(req.user._id, targetDate);
    return successResponse(res, comparison);
  });
}

module.exports = new NutritionController();

