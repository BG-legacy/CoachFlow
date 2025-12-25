/**
 * Session/Booking Model
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['consultation', 'training', 'follow_up', 'assessment', 'virtual', 'in_person'],
      default: 'training',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: Number, // in minutes
    location: String,
    meetingLink: String,
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
    },
    notes: String,
    coachNotes: String,
    price: Number,
    isPaid: {
      type: Boolean,
      default: false,
    },
    reminder: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
    },
    cancellationReason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: Date,
  },
  {
    timestamps: true,
  },
);

// Indexes
// Hot query: coachId + startTime (trainer's schedule)
sessionSchema.index({ coachId: 1, startTime: 1 });
// Hot query: clientId + startTime (client's bookings)
sessionSchema.index({ clientId: 1, startTime: 1 });
sessionSchema.index({ status: 1 });
// Hot query: status + startTime (upcoming sessions)
sessionSchema.index({ status: 1, startTime: 1 });

module.exports = mongoose.model('Session', sessionSchema);
