/**
 * Session Service with Data Integrity Enforcement
 * Example of enforcing rules in the service layer
 */

const Session = require('../models/session.model');
const dataIntegrity = require('../../../common/utils/dataIntegrity');
const { BadRequestError } = require('../../../common/utils/errors');
const logger = require('../../../common/utils/logger');

class SessionService {
  /**
   * Create session with integrity checks
   */
  async createSession(sessionData) {
    // 1. Validate foreign keys
    await dataIntegrity.validateCoachExists(sessionData.coachId);
    await dataIntegrity.validateClientExists(sessionData.clientId);
    
    // 2. Validate coach-client relationship
    await dataIntegrity.validateCoachClientRelationship(
      sessionData.coachId,
      sessionData.clientId
    );
    
    // 3. Validate date range
    dataIntegrity.validateDateRange(
      sessionData.startTime,
      sessionData.endTime,
      'session time'
    );
    
    // 4. Validate future date
    dataIntegrity.validateFutureDate(sessionData.startTime, 'session start');
    
    // 5. Validate no duplicate session
    await dataIntegrity.validateNoDuplicateSession(
      sessionData.coachId,
      sessionData.clientId,
      sessionData.startTime
    );
    
    // 6. Validate coach availability
    await dataIntegrity.validateCoachAvailability(
      sessionData.coachId,
      sessionData.startTime,
      sessionData.endTime
    );
    
    // 7. Calculate duration
    const start = new Date(sessionData.startTime);
    const end = new Date(sessionData.endTime);
    sessionData.duration = Math.round((end - start) / 1000 / 60); // minutes
    
    // 8. Create session
    const session = new Session(sessionData);
    await session.save();
    
    logger.info(`Session created: ${session._id}`);
    
    return session;
  }

  /**
   * Update session with integrity checks
   */
  async updateSession(sessionId, userId, userRole, updates) {
    // 1. Get existing session
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new BadRequestError('Session not found');
    }
    
    // 2. Validate ownership/access
    if (userRole === 'coach' && session.coachId.toString() !== userId.toString()) {
      throw new BadRequestError('Access denied');
    }
    
    if (userRole === 'client' && session.clientId.toString() !== userId.toString()) {
      throw new BadRequestError('Access denied');
    }
    
    // 3. Validate status transitions
    if (updates.status && updates.status !== session.status) {
      const allowedTransitions = {
        scheduled: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled', 'no_show'],
        completed: [],
        cancelled: [],
        no_show: [],
      };
      
      dataIntegrity.validateStatusTransition(
        session.status,
        updates.status,
        allowedTransitions
      );
    }
    
    // 4. If time is being updated, validate availability
    if (updates.startTime || updates.endTime) {
      const startTime = updates.startTime || session.startTime;
      const endTime = updates.endTime || session.endTime;
      
      dataIntegrity.validateDateRange(startTime, endTime, 'session time');
      
      await dataIntegrity.validateCoachAvailability(
        session.coachId,
        startTime,
        endTime,
        sessionId
      );
      
      // Recalculate duration
      const start = new Date(startTime);
      const end = new Date(endTime);
      updates.duration = Math.round((end - start) / 1000 / 60);
    }
    
    // 5. Apply updates
    Object.assign(session, updates);
    await session.save();
    
    logger.info(`Session updated: ${sessionId}`);
    
    return session;
  }

  /**
   * Cancel session with validation
   */
  async cancelSession(sessionId, userId, cancellationReason) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new BadRequestError('Session not found');
    }
    
    // Validate can be cancelled
    if (session.status === 'completed') {
      throw new BadRequestError('Cannot cancel completed session');
    }
    
    if (session.status === 'cancelled') {
      throw new BadRequestError('Session already cancelled');
    }
    
    // Update session
    session.status = 'cancelled';
    session.cancellationReason = cancellationReason;
    session.cancelledBy = userId;
    session.cancelledAt = new Date();
    
    await session.save();
    
    logger.info(`Session cancelled: ${sessionId} by ${userId}`);
    
    return session;
  }

  /**
   * Get sessions with filters
   */
  async getSessions(filters) {
    const query = {};
    
    if (filters.coachId) query.coachId = filters.coachId;
    if (filters.clientId) query.clientId = filters.clientId;
    if (filters.status) query.status = filters.status;
    
    if (filters.startDate || filters.endDate) {
      query.startTime = {};
      if (filters.startDate) query.startTime.$gte = new Date(filters.startDate);
      if (filters.endDate) query.startTime.$lte = new Date(filters.endDate);
    }
    
    const sessions = await Session.find(query)
      .populate('coachId', 'firstName lastName email')
      .populate('clientId', 'firstName lastName email')
      .sort({ startTime: 1 });
    
    return sessions;
  }

  /**
   * Delete session with validation
   */
  async deleteSession(sessionId, userId, userRole) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new BadRequestError('Session not found');
    }
    
    // Only coaches can delete
    if (userRole !== 'coach' && userRole !== 'admin') {
      throw new BadRequestError('Only coaches can delete sessions');
    }
    
    if (userRole === 'coach' && session.coachId.toString() !== userId.toString()) {
      throw new BadRequestError('Access denied');
    }
    
    // Don't delete completed sessions
    if (session.status === 'completed') {
      throw new BadRequestError('Cannot delete completed sessions');
    }
    
    await session.remove();
    
    logger.info(`Session deleted: ${sessionId}`);
    
    return { message: 'Session deleted successfully' };
  }
}

module.exports = new SessionService();
