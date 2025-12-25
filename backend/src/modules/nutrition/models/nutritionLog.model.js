/**
 * Nutrition Log Model
 * Enhanced daily nutrition tracking with sleep and mood
 */

const mongoose = require('mongoose');

const nutritionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    // Required fields
    calories: {
      type: Number,
      required: true,
    },
    protein: {
      type: Number,
      required: true,
    },
    // Optional macros
    carbs: Number,
    fats: Number,
    fiber: Number,
    // Optional lifestyle tracking
    sleep: {
      hours: Number,
      quality: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent'],
      },
    },
    mood: {
      type: String,
      enum: ['very_poor', 'poor', 'neutral', 'good', 'very_good'],
    },
    energy: {
      type: String,
      enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
    },
    // Water intake
    water: Number, // liters
    // Weight
    weight: Number, // kg
    // Targets from nutrition target
    nutritionTargetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NutritionTarget',
    },
    targets: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number,
    },
    // Adherence metrics
    adherence: {
      calories: Number, // percentage
      protein: Number,
      withinTarget: Boolean,
    },
    // Notes
    notes: String,
    // Auto-populated
    weekNumber: Number, // ISO week number
    year: Number,
  },
  {
    timestamps: true,
  },
);

// Compound indexes for queries
nutritionLogSchema.index({ userId: 1, date: -1 });
nutritionLogSchema.index({ userId: 1, year: 1, weekNumber: 1 });
nutritionLogSchema.index({ nutritionTargetId: 1 });

// Pre-save middleware
nutritionLogSchema.pre('save', async function (next) {
  // Auto-populate week number
  const date = new Date(this.date);
  this.weekNumber = this._getISOWeek(date);
  this.year = date.getFullYear();

  // Auto-populate targets if not set
  if (!this.targets?.calories && !this.nutritionTargetId) {
    try {
      const NutritionTarget = mongoose.model('NutritionTarget');
      const activeTarget = await NutritionTarget.findOne({
        userId: this.userId,
        isActive: true,
      });

      if (activeTarget) {
        this.nutritionTargetId = activeTarget._id;
        this.targets = {
          calories: activeTarget.calorieTarget.value,
          protein: activeTarget.macroTargets.protein.grams,
          carbs: activeTarget.macroTargets.carbs.grams,
          fats: activeTarget.macroTargets.fats.grams,
        };
      }
    } catch (error) {
      // Continue without targets
    }
  }

  // Calculate adherence
  if (this.targets?.calories) {
    this.adherence = {
      calories: Math.round((this.calories / this.targets.calories) * 100),
      protein: Math.round((this.protein / this.targets.protein) * 100),
      withinTarget: Math.abs(this.calories - this.targets.calories) / this.targets.calories <= 0.1,
    };
  }

  next();
});

// Helper method to calculate ISO week number
nutritionLogSchema.methods._getISOWeek = function (date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);

