/**
 * AI Request Model
 * Tracks AI/LLM API requests for debugging and cost monitoring
 */

const mongoose = require('mongoose');

const aiRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Request identification
    requestId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    service: {
      type: String,
      enum: [
        'openai',
        'anthropic',
        'google_vertex',
        'form_analysis',
        'nutrition_ai',
        'workout_generator',
        'chat_assistant',
        'custom',
      ],
      required: true,
      index: true,
    },
    model: {
      type: String,
      required: true,
    },
    // Request details
    prompt: {
      raw: String, // The actual prompt sent
      template: String, // Template identifier if using templates
      variables: mongoose.Schema.Types.Mixed, // Variables used in template
      systemPrompt: String,
      temperature: Number,
      maxTokens: Number,
      otherParams: mongoose.Schema.Types.Mixed,
    },
    // Response details
    response: {
      raw: String, // Full response
      summary: String, // Truncated/summarized response
      structured: mongoose.Schema.Types.Mixed, // Parsed structured response
      finishReason: String,
    },
    // Token usage and costs
    usage: {
      promptTokens: {
        type: Number,
        default: 0,
      },
      completionTokens: {
        type: Number,
        default: 0,
      },
      totalTokens: {
        type: Number,
        default: 0,
      },
      estimatedCost: Number, // in USD
    },
    // Performance metrics
    performance: {
      requestStartTime: Date,
      requestEndTime: Date,
      latency: Number, // milliseconds
      retries: {
        type: Number,
        default: 0,
      },
    },
    // Request status
    status: {
      type: String,
      enum: ['pending', 'success', 'error', 'timeout', 'cancelled'],
      default: 'pending',
      index: true,
    },
    error: {
      code: String,
      message: String,
      details: mongoose.Schema.Types.Mixed,
    },
    // Context
    context: {
      feature: String, // Which feature triggered this request
      action: String, // What action was being performed
      sessionId: String,
      ipAddress: String,
      userAgent: String,
    },
    // Related entities
    relatedEntity: {
      type: {
        type: String,
        enum: ['form_analysis', 'workout', 'meal_plan', 'chat', 'report', 'other'],
      },
      id: mongoose.Schema.Types.ObjectId,
    },
    // Feedback and quality
    feedback: {
      userRating: Number, // 1-5
      wasHelpful: Boolean,
      qualityScore: Number, // 0-100
      flagged: {
        type: Boolean,
        default: false,
      },
      flagReason: String,
    },
    // Privacy and compliance
    containsPII: {
      type: Boolean,
      default: false,
    },
    dataRetentionDays: {
      type: Number,
      default: 90,
    },
    scheduledDeletionDate: Date,
    // Metadata
    metadata: {
      environment: String, // 'development', 'staging', 'production'
      version: String,
      tags: [String],
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics and monitoring
aiRequestSchema.index({ userId: 1, createdAt: -1 });
aiRequestSchema.index({ service: 1, model: 1, createdAt: -1 });
aiRequestSchema.index({ status: 1, createdAt: -1 });
aiRequestSchema.index({ 'context.feature': 1 });
aiRequestSchema.index({ scheduledDeletionDate: 1 });
aiRequestSchema.index({ 'feedback.flagged': 1 });

// Compound index for cost analysis
aiRequestSchema.index({ service: 1, model: 1, 'usage.totalTokens': -1 });

// Calculate cost statistics
aiRequestSchema.statics.getCostStats = async function(startDate, endDate, service) {
  const match = {
    createdAt: { $gte: startDate, $lte: endDate },
    status: 'success',
  };
  
  if (service) {
    match.service = service;
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$service',
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: '$usage.totalTokens' },
        totalCost: { $sum: '$usage.estimatedCost' },
        avgLatency: { $avg: '$performance.latency' },
      },
    },
  ]);
  
  return stats;
};

// TTL index for automatic deletion based on retention policy
aiRequestSchema.index({ scheduledDeletionDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AIRequest', aiRequestSchema);




