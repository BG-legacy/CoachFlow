/**
 * User Repository
 * Data access layer for User model
 */

const User = require('../models/user.model');

class UserRepository {
  /**
   * Create a new user
   */
  async create(userData) {
    return await User.create(userData);
  }

  /**
   * Find user by ID
   */
  async findById(id, includePassword = false) {
    const query = User.findById(id);
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  /**
   * Find user by email
   */
  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  /**
   * Find all users with filters
   */
  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const query = User.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const users = await query;
    const total = await User.countDocuments(filters);

    return { users, total };
  }

  /**
   * Update user by ID
   */
  async updateById(id, updates) {
    return await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete user by ID
   */
  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }

  /**
   * Find user by reset token
   */
  async findByResetToken(token) {
    return await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token) {
    return await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');
  }

  /**
   * Check if email exists
   */
  async emailExists(email) {
    const count = await User.countDocuments({ email });
    return count > 0;
  }

  /**
   * Get users by role
   */
  async findByRole(role, options = {}) {
    return await this.findAll({ role }, options);
  }

  /**
   * Update last login
   */
  async updateLastLogin(id) {
    return await User.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  /**
   * Find user by any filter (generic)
   */
  async findOne(filter, includePassword = false) {
    const query = User.findOne(filter);
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId, includePassword = false) {
    return await this.findOne({ googleId }, includePassword);
  }
}

module.exports = new UserRepository();
