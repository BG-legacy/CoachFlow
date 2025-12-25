/**
 * Check-in Service
 */

const checkinRepository = require('../repositories/checkin.repository');
const { NotFoundError, ForbiddenError } = require('../../../common/utils/errors');
const logger = require('../../../common/utils/logger');

class CheckinService {
  async createCheckin(clientId, checkinData) {
    const checkin = await checkinRepository.create({
      clientId,
      ...checkinData,
    });

    logger.info(`Check-in created for client: ${clientId}`);

    return checkin;
  }

  async getCheckinById(checkinId) {
    const checkin = await checkinRepository.findById(checkinId);

    if (!checkin) {
      throw new NotFoundError('Check-in');
    }

    return checkin;
  }

  async getCheckins(filters, options) {
    const { checkins, total } = await checkinRepository.findAll(filters, options);

    return { checkins, total };
  }

  async updateCheckin(checkinId, userId, userRole, updates) {
    const checkin = await checkinRepository.findById(checkinId);

    if (!checkin) {
      throw new NotFoundError('Check-in');
    }

    // Check permissions
    if (
      userRole !== 'admin'
      && checkin.clientId._id.toString() !== userId
      && checkin.coachId._id.toString() !== userId
    ) {
      throw new ForbiddenError('You do not have permission to update this check-in');
    }

    const updatedCheckin = await checkinRepository.updateById(checkinId, updates);

    logger.info(`Check-in updated: ${checkinId}`);

    return updatedCheckin;
  }

  async deleteCheckin(checkinId, userId, userRole) {
    const checkin = await checkinRepository.findById(checkinId);

    if (!checkin) {
      throw new NotFoundError('Check-in');
    }

    // Check permissions
    if (
      userRole !== 'admin'
      && checkin.clientId._id.toString() !== userId
      && checkin.coachId._id.toString() !== userId
    ) {
      throw new ForbiddenError('You do not have permission to delete this check-in');
    }

    await checkinRepository.deleteById(checkinId);

    logger.info(`Check-in deleted: ${checkinId}`);

    return { message: 'Check-in deleted successfully' };
  }

  async addCoachFeedback(checkinId, coachId, feedback) {
    const checkin = await checkinRepository.findById(checkinId);

    if (!checkin) {
      throw new NotFoundError('Check-in');
    }

    // Check if coach owns this check-in
    if (checkin.coachId._id.toString() !== coachId) {
      throw new ForbiddenError('You do not have permission to add feedback');
    }

    const updatedCheckin = await checkinRepository.updateById(checkinId, {
      coachFeedback: {
        ...feedback,
        date: new Date(),
      },
      status: 'reviewed',
    });

    logger.info(`Coach feedback added to check-in: ${checkinId}`);

    return updatedCheckin;
  }

  async getLatestCheckin(clientId) {
    const checkin = await checkinRepository.getLatestCheckin(clientId);

    if (!checkin) {
      throw new NotFoundError('Check-in');
    }

    return checkin;
  }

  async getCheckinStats(clientId, startDate, endDate) {
    const stats = await checkinRepository.getCheckinStats(clientId, startDate, endDate);

    return stats.length > 0 ? stats[0] : {
      avgWeight: 0,
      avgBodyFat: 0,
      avgMood: 0,
      avgEnergy: 0,
      avgAdherence: 0,
      totalCheckins: 0,
    };
  }
}

module.exports = new CheckinService();
