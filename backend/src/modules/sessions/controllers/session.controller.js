/**
 * Session Controller
 */

const sessionService = require('../services/session.service');
const { successResponse, createdResponse, paginatedResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');

class SessionController {
  createSession = asyncHandler(async (req, res) => {
    const session = await sessionService.createSession(req.user._id, req.body);
    return createdResponse(res, session, 'Session created successfully');
  });

  getSession = asyncHandler(async (req, res) => {
    const session = await sessionService.getSessionById(req.params.id);
    return successResponse(res, session);
  });

  getSessions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, clientId, coachId, status } = req.query;
    const filters = {};

    if (clientId) filters.clientId = clientId;
    if (coachId) filters.coachId = coachId;
    if (status) filters.status = status;

    const options = { page: parseInt(page), limit: parseInt(limit), sort };
    const { sessions, total } = await sessionService.getSessions(filters, options);

    return paginatedResponse(res, sessions, parseInt(page), parseInt(limit), total);
  });

  updateSession = asyncHandler(async (req, res) => {
    const session = await sessionService.updateSession(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body
    );
    return successResponse(res, session, 'Session updated successfully');
  });

  cancelSession = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const session = await sessionService.cancelSession(req.params.id, req.user._id, reason);
    return successResponse(res, session, 'Session cancelled successfully');
  });

  getUpcomingSessions = asyncHandler(async (req, res) => {
    const sessions = await sessionService.getUpcomingSessions(req.user._id, req.user.role);
    return successResponse(res, sessions);
  });
}

module.exports = new SessionController();

