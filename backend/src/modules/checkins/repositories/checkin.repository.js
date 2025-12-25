/**
 * Check-in Repository
 */

const Checkin = require('../models/checkin.model');

class CheckinRepository {
  async create(checkinData) {
    return await Checkin.create(checkinData);
  }

  async findById(id) {
    return await Checkin.findById(id)
      .populate('clientId coachId', 'firstName lastName email avatar');
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-date' } = options;
    const skip = (page - 1) * limit;

    const checkins = await Checkin.find(filters)
      .populate('clientId coachId', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Checkin.countDocuments(filters);

    return { checkins, total };
  }

  async updateById(id, updates) {
    return await Checkin.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('clientId coachId', 'firstName lastName email');
  }

  async deleteById(id) {
    return await Checkin.findByIdAndDelete(id);
  }

  async getLatestCheckin(clientId) {
    return await Checkin.findOne({ clientId })
      .sort('-date')
      .populate('coachId', 'firstName lastName');
  }

  async getCheckinStats(clientId, startDate, endDate) {
    return await Checkin.aggregate([
      {
        $match: {
          clientId: mongoose.Types.ObjectId(clientId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          avgWeight: { $avg: '$metrics.weight' },
          avgBodyFat: { $avg: '$metrics.bodyFat' },
          avgMood: { $avg: '$metrics.mood' },
          avgEnergy: { $avg: '$metrics.energy' },
          avgAdherence: { $avg: '$adherence.overall' },
          totalCheckins: { $sum: 1 },
        },
      },
    ]);
  }
}

module.exports = new CheckinRepository();
