/**
 * Check-in Model
 */

const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['weekly', 'monthly', 'custom'],
      default: 'weekly',
    },
    metrics: {
      weight: Number,
      bodyFat: Number,
      mood: {
        type: Number,
        min: 1,
        max: 10,
      },
      energy: {
        type: Number,
        min: 1,
        max: 10,
      },
      stress: {
        type: Number,
        min: 1,
        max: 10,
      },
      sleep: {
        hours: Number,
        quality: {
          type: Number,
          min: 1,
          max: 10,
        },
      },
      measurements: {
        chest: Number,
        waist: Number,
        hips: Number,
        biceps: Number,
        thighs: Number,
      },
    },
    adherence: {
      workouts: {
        completed: Number,
        planned: Number,
        percentage: Number,
      },
      nutrition: {
        daysCompleted: Number,
        totalDays: Number,
        percentage: Number,
      },
      overall: Number,
    },
    progress: {
      achievements: [String],
      challenges: [String],
      notes: String,
    },
    photos: [{
      url: String,
      type: {
        type: String,
        enum: ['front', 'back', 'side', 'other'],
      },
    }],
    coachFeedback: {
      text: String,
      date: Date,
      recommendations: [String],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
// Hot query: userId + date (client's check-in history)
checkinSchema.index({ clientId: 1, date: -1 });
// Hot query: coachId + status (pending reviews)
checkinSchema.index({ coachId: 1, status: 1 });

module.exports = mongoose.model('Checkin', checkinSchema);
