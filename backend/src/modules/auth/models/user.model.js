/**
 * User Model
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required() {
        // Password is only required if no OAuth providers are linked
        return !this.authProviders || this.authProviders.length === 0;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    // OAuth provider information
    authProviders: [{
      provider: {
        type: String,
        enum: ['local', 'google'],
        required: true,
      },
      providerId: {
        type: String, // Google ID, etc.
      },
      email: {
        type: String, // Email from provider
      },
      linkedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Store Google ID separately for quick lookups
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['client', 'coach', 'admin'],
      default: 'client',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
    },
    // Coach-specific fields
    coachProfile: {
      bio: String,
      specializations: [String],
      certifications: [String],
      yearsOfExperience: Number,
      hourlyRate: Number,
    },
    // Privacy & Consent fields
    consent: {
      termsAcceptedAt: {
        type: Date,
        required: false, // Will be required for new registrations
      },
      termsVersion: {
        type: String,
        default: '1.0',
      },
      privacyPolicyAcceptedAt: {
        type: Date,
        required: false,
      },
      privacyPolicyVersion: {
        type: String,
        default: '1.0',
      },
      marketingConsent: {
        type: Boolean,
        default: false,
      },
      marketingConsentDate: Date,
      dataProcessingConsent: {
        type: Boolean,
        default: true,
      },
      dataProcessingConsentDate: Date,
    },
    consentHistory: [{
      type: {
        type: String,
        enum: ['terms', 'privacy', 'marketing', 'data_processing'],
      },
      version: String,
      accepted: Boolean,
      timestamp: Date,
      ipAddress: String,
    }],
    // Soft delete fields
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletionRequestedAt: Date,
    deletionReason: String,
    deletionScheduledFor: Date,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ deletionScheduledFor: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ 'authProviders.provider': 1 });
userSchema.index({ 'authProviders.providerId': 1 });

// Query middleware - exclude soft-deleted users by default
userSchema.pre(/^find/, function (next) {
  // Don't exclude if explicitly requested
  if (this.getOptions().includeDeleted) {
    return next();
  }

  // Automatically exclude soft-deleted users
  this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('User', userSchema);
