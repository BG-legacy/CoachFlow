/**
 * Meal Plan Model
 */

const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true,
  },
  time: String,
  foods: [{
    name: String,
    quantity: Number,
    unit: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
  }],
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFats: Number,
  instructions: String,
  prepTime: Number, // in minutes
  imageUrl: String,
});

const mealPlanSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    goal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'maintenance', 'performance', 'health'],
    },
    // Versioning with activeVersionId pointer
    version: {
      type: Number,
      default: 1,
    },
    parentPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
    },
    activeVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
    },
    versionNotes: String,
    isCurrentVersion: {
      type: Boolean,
      default: true,
    },
    dailyTargets: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number,
      fiber: Number,
      water: Number, // in liters
    },
    meals: [mealSchema],
    dietType: {
      type: String,
      enum: ['none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'other'],
    },
    restrictions: [String],
    startDate: Date,
    endDate: Date,
    duration: Number, // in days
    isTemplate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
    tags: [String],
  },
  {
    timestamps: true,
  },
);

// Indexes
mealPlanSchema.index({ coachId: 1 });
mealPlanSchema.index({ clientId: 1 });
mealPlanSchema.index({ isActive: 1 });
mealPlanSchema.index({ parentPlanId: 1, version: -1 });
mealPlanSchema.index({ activeVersionId: 1 });
mealPlanSchema.index({ isCurrentVersion: 1 });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
