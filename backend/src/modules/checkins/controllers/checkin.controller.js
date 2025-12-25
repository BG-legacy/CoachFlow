/**
 * Check-in Controller
 */

const checkinService = require('../services/checkin.service');
const { successResponse, createdResponse, paginatedResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');

class CheckinController {
  createCheckin = asyncHandler(async (req, res) => {
    const checkin = await checkinService.createCheckin(req.user._id, req.body);
    return createdResponse(res, checkin, 'Check-in created successfully');
  });

  getCheckin = asyncHandler(async (req, res) => {
    const checkin = await checkinService.getCheckinById(req.params.id);
    return successResponse(res, checkin);
  });

  getCheckins = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, clientId, coachId, status } = req.query;
    const filters = {};

    if (clientId) filters.clientId = clientId;
    if (coachId) filters.coachId = coachId;
    if (status) filters.status = status;

    const options = { page: parseInt(page), limit: parseInt(limit), sort };
    const { checkins, total } = await checkinService.getCheckins(filters, options);

    return paginatedResponse(res, checkins, parseInt(page), parseInt(limit), total);
  });

  updateCheckin = asyncHandler(async (req, res) => {
    const checkin = await checkinService.updateCheckin(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body
    );
    return successResponse(res, checkin, 'Check-in updated successfully');
  });

  deleteCheckin = asyncHandler(async (req, res) => {
    const result = await checkinService.deleteCheckin(req.params.id, req.user._id, req.user.role);
    return successResponse(res, result);
  });

  addCoachFeedback = asyncHandler(async (req, res) => {
    const checkin = await checkinService.addCoachFeedback(req.params.id, req.user._id, req.body);
    return successResponse(res, checkin, 'Feedback added successfully');
  });

  getLatestCheckin = asyncHandler(async (req, res) => {
    const clientId = req.params.clientId || req.user._id;
    const checkin = await checkinService.getLatestCheckin(clientId);
    return successResponse(res, checkin);
  });

  getCheckinStats = asyncHandler(async (req, res) => {
    const { clientId, startDate, endDate } = req.query;
    const targetClientId = clientId || req.user._id;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await checkinService.getCheckinStats(targetClientId, start, end);
    return successResponse(res, stats);
  });
}

module.exports = new CheckinController();

