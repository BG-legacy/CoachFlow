/**
 * Client Profile Repository
 */

const ClientProfile = require('../models/clientProfile.model');

class ClientProfileRepository {
  async create(profileData) {
    return await ClientProfile.create(profileData);
  }

  async findById(id) {
    return await ClientProfile.findById(id).populate('userId coachId', 'firstName lastName email');
  }

  async findByUserId(userId) {
    return await ClientProfile.findOne({ userId }).populate('userId coachId', 'firstName lastName email');
  }

  async findByCoachId(coachId, options = {}) {
    const {
      page = 1, limit = 10, sort = '-createdAt', status,
    } = options;
    const skip = (page - 1) * limit;

    const filter = { coachId };
    if (status) {
      filter.status = status;
    }

    const profiles = await ClientProfile.find(filter)
      .populate('userId', 'firstName lastName email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await ClientProfile.countDocuments(filter);

    return { profiles, total };
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const profiles = await ClientProfile.find(filters)
      .populate('userId coachId', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await ClientProfile.countDocuments(filters);

    return { profiles, total };
  }

  async updateById(id, updates) {
    return await ClientProfile.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('userId coachId', 'firstName lastName email');
  }

  async updateByUserId(userId, updates) {
    return await ClientProfile.findOneAndUpdate({ userId }, updates, {
      new: true,
      runValidators: true,
    }).populate('userId coachId', 'firstName lastName email');
  }

  async deleteById(id) {
    return await ClientProfile.findByIdAndDelete(id);
  }

  async addMeasurement(userId, measurementData) {
    return await ClientProfile.findOneAndUpdate(
      { userId },
      { $push: { measurements: measurementData } },
      { new: true },
    );
  }

  async getLatestMeasurement(userId) {
    const profile = await ClientProfile.findOne({ userId });
    if (!profile || !profile.measurements.length) {
      return null;
    }
    return profile.measurements[profile.measurements.length - 1];
  }

  async assignCoach(userId, coachId) {
    return await this.updateByUserId(userId, { coachId });
  }

  async getClientsByGoal(goal, options = {}) {
    return await this.findAll({ 'fitnessProfile.goals': goal }, options);
  }
}

module.exports = new ClientProfileRepository();
