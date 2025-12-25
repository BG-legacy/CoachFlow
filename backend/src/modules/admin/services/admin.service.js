/**
 * Admin Service
 * Admin and Coach Dashboard APIs
 */

const User = require('../../auth/models/user.model');
const ClientProfile = require('../../clients/models/clientProfile.model');
const Program = require('../../workouts/models/program.model');
const Session = require('../../sessions/models/session.model');
const Checkin = require('../../checkins/models/checkin.model');
const logger = require('../../../common/utils/logger');

class AdminService {
  /**
   * Get admin dashboard overview
   */
  async getAdminDashboard() {
    const [
      totalUsers,
      totalCoaches,
      totalClients,
      activePrograms,
      totalSessions,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'coach' }),
      User.countDocuments({ role: 'client' }),
      Program.countDocuments({ status: 'active' }),
      Session.countDocuments(),
      User.find().sort('-createdAt').limit(10).select('firstName lastName email role createdAt'),
    ]);

    return {
      stats: {
        totalUsers,
        totalCoaches,
        totalClients,
        activePrograms,
        totalSessions,
      },
      recentUsers,
    };
  }

  /**
   * Get coach dashboard overview
   */
  async getCoachDashboard(coachId) {
    const [
      totalClients,
      activePrograms,
      upcomingSessions,
      pendingCheckins,
      recentClients,
    ] = await Promise.all([
      ClientProfile.countDocuments({ coachId }),
      Program.countDocuments({ coachId, status: 'active' }),
      Session.countDocuments({
        coachId,
        startTime: { $gte: new Date() },
        status: { $in: ['scheduled', 'confirmed'] },
      }),
      Checkin.countDocuments({ coachId, status: 'pending' }),
      ClientProfile.find({ coachId })
        .sort('-createdAt')
        .limit(10)
        .populate('userId', 'firstName lastName email avatar'),
    ]);

    // Get upcoming sessions
    const sessions = await Session.find({
      coachId,
      startTime: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] },
    })
      .sort('startTime')
      .limit(5)
      .populate('clientId', 'firstName lastName');

    return {
      stats: {
        totalClients,
        activePrograms,
        upcomingSessions,
        pendingCheckins,
      },
      recentClients,
      upcomingSessionsList: sessions,
    };
  }

  /**
   * Get system analytics
   */
  async getSystemAnalytics(startDate, endDate) {
    // User growth
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Session stats
    const sessionStats = await Session.aggregate([
      {
        $match: {
          startTime: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      userGrowth,
      sessionStats,
      period: { startDate, endDate },
    };
  }

  /**
   * Manage user roles and status
   */
  async updateUserRole(userId, role) {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true },
    );

    logger.info(`User ${userId} role updated to: ${role}`);

    return user;
  }

  async toggleUserStatus(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`User ${userId} status toggled to: ${user.isActive}`);

    return user;
  }

  /**
   * Get all users with filters
   */
  async getAllUsers(filters, options) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const users = await User.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-password');

    const total = await User.countDocuments(filters);

    return { users, total };
  }
}

module.exports = new AdminService();
