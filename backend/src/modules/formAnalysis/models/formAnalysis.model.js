/**
 * Form Analysis Model
 * Stores video uploads and Python analysis results
 */

const mongoose = require('mongoose');

const formAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    exerciseName: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    videoFileName: String,
    analysisStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    analysisResults: {
      overallScore: Number, // 0-100
      formQuality: {
        type: String,
        enum: ['excellent', 'good', 'needs_improvement', 'poor'],
      },
      keyPoints: [{
        joint: String,
        angle: Number,
        quality: String,
        timestamp: Number,
      }],
      feedback: [{
        issue: String,
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
        suggestion: String,
        timestamp: Number,
      }],
      repAnalysis: [{
        repNumber: Number,
        quality: String,
        score: Number,
        notes: String,
      }],
      insights: [String],
      recommendations: [String],
    },
    coachFeedback: {
      text: String,
      addedAt: Date,
    },
    metadata: {
      duration: Number, // in seconds
      repsDetected: Number,
      processedAt: Date,
      processingTime: Number, // in milliseconds
      modelVersion: String,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'reviewed'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
formAnalysisSchema.index({ userId: 1, createdAt: -1 });
formAnalysisSchema.index({ coachId: 1 });
formAnalysisSchema.index({ analysisStatus: 1 });

module.exports = mongoose.model('FormAnalysis', formAnalysisSchema);
