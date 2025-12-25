/**
 * Report Controller
 */

const reportService = require('../services/report.service');
const { successResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');

class ReportController {
  getWeeklySummary = asyncHandler(async (req, res) => {
    const { userId, weekStart } = req.query;
    const targetUserId = userId || req.user._id;
    const weekStartDate = weekStart ? new Date(weekStart) : new Date();

    const summary = await reportService.generateWeeklySummary(targetUserId, weekStartDate);
    return successResponse(res, summary);
  });

  getMonthlyReport = asyncHandler(async (req, res) => {
    const { userId, month, year } = req.query;
    const targetUserId = userId || req.user._id;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    const report = await reportService.generateMonthlyReport(
      targetUserId,
      parseInt(targetMonth),
      parseInt(targetYear)
    );
    return successResponse(res, report);
  });

  getCoachDashboard = asyncHandler(async (req, res) => {
    const stats = await reportService.getCoachDashboardStats(req.user._id);
    return successResponse(res, stats);
  });
}

module.exports = new ReportController();

