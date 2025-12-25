/**
 * Notification Model
 * Tracks scheduled and sent notifications across all channels
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'session_reminder',
        'workout_reminder',
        'checkin_reminder',
        'message',
        'achievement',
        'program_update',
        'meal_plan_ready',
        'welcome',
        'password_reset',
        'custom',
      ],
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['scheduled', 'pending', 'sent', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    // Schedule for future delivery
    scheduledFor: {
      type: Date,
      index: true,
    },
    // Actual send time
    sentAt: Date,
    // Provider tracking
    provider: {
      name: String, // 'nodemailer', 'twilio', 'firebase', etc.
      messageId: String, // Provider's message ID for tracking
      response: mongoose.Schema.Types.Mixed, // Full provider response
    },
    // Notification content
    content: {
      title: String,
      subject: String, // For emails
      body: {
        type: String,
        required: true,
      },
      html: String, // HTML version for email
      data: mongoose.Schema.Types.Mixed, // Additional data payload
    },
    // Recipient details (cached for history)
    recipient: {
      email: String,
      phone: String,
      pushToken: String,
    },
    // Related entity
    relatedEntity: {
      type: {
        type: String,
        enum: ['session', 'workout', 'checkin', 'program', 'meal_plan', 'message'],
      },
      id: mongoose.Schema.Types.ObjectId,
    },
    // Error tracking
    error: {
      message: String,
      code: String,
      timestamp: Date,
    },
    // Retry tracking
    retries: {
      count: {
        type: Number,
        default: 0,
      },
      maxRetries: {
        type: Number,
        default: 3,
      },
      lastRetryAt: Date,
      nextRetryAt: Date,
    },
    // User interaction tracking
    interaction: {
      read: {
        type: Boolean,
        default: false,
      },
      readAt: Date,
      clicked: {
        type: Boolean,
        default: false,
      },
      clickedAt: Date,
    },
    // Metadata
    metadata: {
      campaignId: String,
      source: String,
      tags: [String],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for common queries
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
// Hot query: scheduledFor + status (find notifications ready to send)
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ 'provider.messageId': 1 });
notificationSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });

// Hot query: status + scheduledAt (job processing)
// Compound index for finding notifications to send
notificationSchema.index({
  status: 1,
  scheduledFor: 1,
  'retries.nextRetryAt': 1,
});

module.exports = mongoose.model('Notification', notificationSchema);
