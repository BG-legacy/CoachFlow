/**
 * Food Log Model
 */

const mongoose = require('mongoose');

const foodEntrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: Number,
  unit: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
  fiber: Number,
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
  },
  time: Date,
});

const foodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    nutritionTargetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NutritionTarget',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    entries: [foodEntrySchema],
    totals: {
      calories: {
        type: Number,
        default: 0,
      },
      protein: {
        type: Number,
        default: 0,
      },
      carbs: {
        type: Number,
        default: 0,
      },
      fats: {
        type: Number,
        default: 0,
      },
      fiber: {
        type: Number,
        default: 0,
      },
    },
    water: {
      type: Number,
      default: 0,
    }, // in liters
    targets: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number,
      fiber: Number,
      water: Number,
    },
    adherence: {
      calories: Number, // percentage
      protein: Number,
      carbs: Number,
      fats: Number,
      withinTarget: Boolean, // overall adherence within acceptable range
    },
    notes: String,
  },
  {
    timestamps: true,
  },
);

// Calculate totals and adherence before saving
foodLogSchema.pre('save', async function (next) {
  // Calculate totals
  if (this.entries && this.entries.length > 0) {
    this.totals = this.entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + (entry.calories || 0),
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fats: acc.fats + (entry.fats || 0),
        fiber: acc.fiber + (entry.fiber || 0),
      }),
      {
        calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0,
      },
    );
  }

  // Auto-populate targets from nutrition target if not manually set
  if (this.isNew && !this.targets?.calories) {
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
          fiber: activeTarget.macroTargets.fiber?.grams,
          water: activeTarget.additionalTargets?.water?.value,
        };
      }
    } catch (error) {
      // If we can't fetch nutrition target, continue without it
      // (targets can be set manually)
    }
  }

  // Calculate adherence if targets exist
  if (this.targets?.calories && this.totals?.calories !== undefined) {
    this.adherence = {
      calories: this.targets.calories > 0
        ? Math.round((this.totals.calories / this.targets.calories) * 100)
        : 0,
      protein: this.targets.protein > 0
        ? Math.round((this.totals.protein / this.targets.protein) * 100)
        : 0,
      carbs: this.targets.carbs > 0
        ? Math.round((this.totals.carbs / this.targets.carbs) * 100)
        : 0,
      fats: this.targets.fats > 0
        ? Math.round((this.totals.fats / this.targets.fats) * 100)
        : 0,
    };

    // Consider within target if calories are within +/- 10%
    const calorieDeviation = Math.abs(
      (this.totals.calories - this.targets.calories) / this.targets.calories,
    );
    this.adherence.withinTarget = calorieDeviation <= 0.1;
  }

  next();
});

// Indexes
// Hot query: userId + date (user's nutrition history)
foodLogSchema.index({ userId: 1, date: -1 });
foodLogSchema.index({ nutritionTargetId: 1, date: -1 });
foodLogSchema.index({ userId: 1, 'adherence.withinTarget': 1 });

module.exports = mongoose.model('FoodLog', foodLogSchema);
