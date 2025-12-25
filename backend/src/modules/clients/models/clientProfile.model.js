/**
 * Client Profile Model
 */

const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Onboarding tracking
    onboarding: {
      isCompleted: {
        type: Boolean,
        default: false,
      },
      completedAt: Date,
      currentStep: {
        type: String,
        enum: ['goals', 'experience', 'equipment', 'schedule', 'limitations', 'nutrition', 'completed'],
        default: 'goals',
      },
      stepsCompleted: [{
        step: String,
        completedAt: Date,
      }],
    },
    personalInfo: {
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      },
      height: Number, // in cm
      weight: Number, // in kg
      bodyFatPercentage: Number,
    },
    fitnessProfile: {
      // Experience level (renamed from fitnessLevel for clarity)
      experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'elite'],
        default: 'beginner',
      },
      // Fitness goals
      goals: [{
        type: String,
        enum: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness', 'sports_performance', 'rehabilitation'],
      }],
      primaryGoal: {
        type: String,
        enum: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness', 'sports_performance', 'rehabilitation'],
      },
      targetWeight: Number,
      activityLevel: {
        type: String,
        enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
      },
      // Training history
      yearsOfTraining: Number,
      previousPrograms: [String],
    },
    // Medical info (injuries and limitations)
    medicalInfo: {
      injuries: [{
        type: { type: String },
        description: String,
        severity: {
          type: String,
          enum: ['mild', 'moderate', 'severe'],
        },
        affectedAreas: [String],
      }],
      chronicConditions: [String],
      medications: [String],
      allergies: [String],
      limitations: [{
        type: { type: String },
        description: String,
        affectedExercises: [String],
      }],
      doctorClearance: {
        type: Boolean,
        default: false,
      },
      clearanceDate: Date,
      notes: String,
    },
    measurements: [{
      date: {
        type: Date,
        default: Date.now,
      },
      weight: Number,
      bodyFatPercentage: Number,
      chest: Number,
      waist: Number,
      hips: Number,
      biceps: Number,
      thighs: Number,
      notes: String,
    }],
    // Schedule and session preferences
    schedule: {
      availableDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      }],
      preferredTimeOfDay: {
        type: String,
        enum: ['early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night'],
      },
      sessionDuration: {
        type: Number, // in minutes
        min: 15,
        max: 180,
      },
      sessionsPerWeek: {
        type: Number,
        min: 1,
        max: 7,
      },
      timeZone: String,
    },
    // Equipment availability
    equipment: {
      hasGymAccess: {
        type: Boolean,
        default: false,
      },
      gymName: String,
      homeEquipment: [{
        type: String,
        enum: [
          'none',
          'dumbbells',
          'barbells',
          'kettlebells',
          'resistance_bands',
          'pull_up_bar',
          'bench',
          'squat_rack',
          'cable_machine',
          'cardio_machine',
          'yoga_mat',
          'foam_roller',
          'medicine_ball',
          'suspension_trainer',
          'other',
        ],
      }],
      equipmentNotes: String,
    },
    // Exercise preferences
    preferences: {
      preferredExercises: [String],
      dislikedExercises: [String],
      exerciseRestrictions: [String],
    },
    // Nutrition preferences
    nutritionPreferences: {
      dietType: {
        type: String,
        enum: ['none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'intermittent_fasting', 'flexible_dieting', 'other'],
      },
      dietaryRestrictions: [String],
      foodAllergies: [{
        allergen: String,
        severity: {
          type: String,
          enum: ['mild', 'moderate', 'severe', 'life_threatening'],
        },
      }],
      foodDislikes: [String],
      calorieTarget: Number,
      macroTargets: {
        protein: Number, // grams
        carbs: Number,
        fats: Number,
      },
      mealsPerDay: {
        type: Number,
        min: 1,
        max: 8,
      },
      waterIntakeGoal: Number, // liters per day
      supplementation: [String],
      nutritionNotes: String,
    },
    // Constraint change history (for audit purposes)
    constraintHistory: [{
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      reason: String,
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_hold', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
clientProfileSchema.index({ userId: 1 });
clientProfileSchema.index({ coachId: 1 });
clientProfileSchema.index({ status: 1 });
clientProfileSchema.index({ 'onboarding.isCompleted': 1 });
clientProfileSchema.index({ 'onboarding.currentStep': 1 });

// Method to track constraint changes
clientProfileSchema.methods.addConstraintChange = function (changedBy, field, oldValue, newValue, reason) {
  this.constraintHistory.push({
    changedBy,
    changedAt: new Date(),
    field,
    oldValue,
    newValue,
    reason,
  });
};

module.exports = mongoose.model('ClientProfile', clientProfileSchema);
