/**
 * Nutrition Log Controller
 */

const nutritionLogService = require('../services/nutritionLog.service');
const logger = require('../../../common/utils/logger');

class NutritionLogController {
  async createLog(req, res, next) {
    try {
      const userId = req.body.userId || req.user._id;

      // Only allow creating for self unless coach/admin
      if (userId !== req.user._id.toString() && req.user.role !== 'coach' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const log = await nutritionLogService.createLog(userId, req.body);

      res.status(201).json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }

  async updateLog(req, res, next) {
    try {
      const { logId } = req.params;
      const userId = req.user._id;

      const log = await nutritionLogService.updateLog(logId, userId, req.body);

      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }

  async getLogsForRange(req, res, next) {
    try {
      const userId = req.params.userId || req.user._id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const logs = await nutritionLogService.getLogsForRange(userId, startDate, endDate);

      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  async getWeeklySummary(req, res, next) {
    try {
      const userId = req.params.userId || req.user._id;
      const weekStart = req.query.weekStart || new Date();

      const summary = await nutritionLogService.getWeeklySummary(userId, weekStart);

      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req, res, next) {
    try {
      const userId = req.params.userId || req.user._id;
      const weeks = parseInt(req.query.weeks) || 4;

      const trends = await nutritionLogService.getNutritionTrends(userId, weeks);

      res.json({ success: true, data: trends });
    } catch (error) {
      next(error);
    }
  }

  async deleteLog(req, res, next) {
    try {
      const { logId } = req.params;
      const userId = req.user._id;

      const result = await nutritionLogService.deleteLog(logId, userId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NutritionLogController();

