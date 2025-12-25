/**
 * Gamification Controller
 */

const gamificationService = require('../services/gamification.service');
const { successResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');

class GamificationController {
  getProfile = asyncHandler(async (req, res) => {
    const profile = await gamificationService.getUserProfile(req.user._id);
    return successResponse(res, profile);
  });

  getLeaderboard = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const leaderboard = await gamificationService.getLeaderboard(parseInt(limit));
    return successResponse(res, leaderboard);
  });
}

module.exports = new GamificationController();

