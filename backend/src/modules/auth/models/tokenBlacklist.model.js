/**
 * Token Blacklist Model
 * Stores revoked tokens for session management
 */

const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenType: {
      type: String,
      enum: ['access', 'refresh'],
      required: true,
    },
    reason: {
      type: String,
      enum: ['logout', 'revoked', 'password_change', 'security'],
      default: 'logout',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index - auto-delete after expiration
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
tokenBlacklistSchema.index({ token: 1, tokenType: 1 });
tokenBlacklistSchema.index({ userId: 1, createdAt: -1 });

// Static method to check if token is blacklisted
tokenBlacklistSchema.statics.isBlacklisted = async function (token) {
  const entry = await this.findOne({ token });
  return !!entry;
};

// Static method to blacklist token
tokenBlacklistSchema.statics.blacklistToken = async function (tokenData) {
  return await this.create(tokenData);
};

// Static method to revoke all user tokens
tokenBlacklistSchema.statics.revokeAllUserTokens = async function (userId, reason = 'security') {
  // This would typically be used when password changes or account is compromised
  // Note: You'd need to track active tokens separately for this to work perfectly
  return await this.updateMany(
    { userId },
    { $set: { reason } },
  );
};

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);



