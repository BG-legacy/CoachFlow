/**
 * Nutrition Target Model
 * Stores calculated TDEE, BMR, and nutrition targets with rationale
 */

const mongoose = require('mongoose');

const nutritionTargetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Basic Metabolic Rate calculation
    bmr: {
      value: {
        type: Number,
        required: true,
      },
      formula: {
        type: String,
        enum: ['mifflin_st_jeor', 'harris_benedict', 'katch_mcardle'],
        default: 'mifflin_st_jeor',
      },
      calculationInputs: {
        weight: Number, // kg
        height: Number, // cm
        age: Number,
        gender: {
          type: String,
          enum: ['male', 'female', 'other'],
        },
        bodyFatPercentage: Number, // For Katch-McArdle formula
      },
      calculationDate: {
        type: Date,
        default: Date.now,
      },
      rationale: {
        type: String,
        default: 'Calculated using scientifically validated formula based on client metrics',
      },
    },
    // Total Daily Energy Expenditure
    tdee: {
      value: {
        type: Number,
        required: true,
      },
      activityLevel: {
        type: String,
        enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
        required: true,
      },
      activityMultiplier: {
        type: Number,
        required: true,
      },
      calculationDate: {
        type: Date,
        default: Date.now,
      },
      rationale: String, // e.g., "Client trains 5x/week + has active job = Very Active"
    },
    // Calorie Target (TDEE adjusted for goals)
    calorieTarget: {
      value: {
        type: Number,
        required: true,
      },
      goal: {
        type: String,
        enum: ['weight_loss', 'muscle_gain', 'maintenance', 'performance', 'body_recomp', 'health'],
        required: true,
      },
      adjustment: {
        type: Number, // +/- from TDEE
        required: true,
      },
      adjustmentPercentage: Number, // Percentage adjustment from TDEE
      rateOfChange: {
        amount: Number, // kg or lbs per week
        unit: {
          type: String,
          enum: ['kg', 'lbs'],
          default: 'kg',
        },
      },
      rationale: String, // e.g., "500 cal deficit for 0.5kg/week fat loss without muscle loss"
    },
    // Macronutrient Targets
    macroTargets: {
      protein: {
        grams: {
          type: Number,
          required: true,
        },
        percentage: Number, // % of total calories
        gramsPerKg: Number, // g/kg bodyweight
        rationale: String, // e.g., "2.2g/kg for muscle preservation during cut"
      },
      carbs: {
        grams: {
          type: Number,
          required: true,
        },
        percentage: Number,
        gramsPerKg: Number,
        rationale: String, // e.g., "5g/kg for high training volume and performance"
      },
      fats: {
        grams: {
          type: Number,
          required: true,
        },
        percentage: Number,
        gramsPerKg: Number,
        rationale: String, // e.g., "25% of calories for hormone health and satiety"
      },
      fiber: {
        grams: Number,
        rationale: String,
      },
    },
    // Additional targets
    additionalTargets: {
      water: {
        value: Number, // liters per day
        rationale: String, // e.g., "35ml/kg bodyweight + 1L for training days"
      },
      sodium: {
        value: Number, // mg
        rationale: String,
      },
      micronutrients: [{
        name: String,
        value: Number,
        unit: String,
        rationale: String,
      }],
    },
    // Meal timing strategy
    mealTiming: {
      mealsPerDay: {
        type: Number,
        min: 1,
        max: 8,
      },
      preworkoutNutrition: {
        enabled: Boolean,
        timing: String, // e.g., "60-90 minutes before"
        macros: {
          carbs: Number,
          protein: Number,
        },
      },
      postworkoutNutrition: {
        enabled: Boolean,
        timing: String, // e.g., "Within 2 hours"
        macros: {
          carbs: Number,
          protein: Number,
        },
      },
      rationale: String, // e.g., "4 meals for better protein distribution and satiety"
    },
    // Adjustments and modifications
    adjustments: [{
      date: {
        type: Date,
        default: Date.now,
      },
      field: String, // e.g., "calorieTarget.value"
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      reason: {
        type: String,
        required: true,
      },
      adjustedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      clientFeedback: String, // Client's reported experience leading to adjustment
    }],
    // Refeed/Diet Break Strategy
    refeedStrategy: {
      enabled: Boolean,
      frequency: String, // e.g., "weekly", "biweekly"
      dayOfWeek: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
      calorieIncrease: Number,
      macroAdjustments: {
        carbs: Number,
        protein: Number,
        fats: Number,
      },
      rationale: String, // e.g., "Weekly refeed to support metabolic adaptation and adherence"
    },
    // Diet Break Strategy (for extended cuts)
    dietBreakStrategy: {
      enabled: Boolean,
      frequency: String, // e.g., "every 8-12 weeks"
      duration: Number, // days
      targetCalories: Number, // Usually at maintenance
      rationale: String, // e.g., "2-week diet break every 10 weeks to restore metabolic rate"
    },
    // Periodization
    periodization: {
      type: {
        type: String,
        enum: ['linear', 'undulating', 'block', 'reverse_diet', 'maintenance'],
      },
      currentPhase: String,
      phaseStartDate: Date,
      phaseDuration: Number, // weeks
      nextPhaseAdjustment: String,
      rationale: String,
    },
    // Validity period
    effectiveDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expirationDate: Date, // When to reassess
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastReviewedDate: Date,
    nextReviewDate: Date,
    notes: String,
    tags: [String],
  },
  {
    timestamps: true,
  },
);

// Indexes
nutritionTargetSchema.index({ userId: 1, isActive: 1 });
nutritionTargetSchema.index({ userId: 1, effectiveDate: -1 });
nutritionTargetSchema.index({ createdBy: 1 });
nutritionTargetSchema.index({ isActive: 1, effectiveDate: -1 });
nutritionTargetSchema.index({ nextReviewDate: 1 });

// Pre-save validation
nutritionTargetSchema.pre('save', function (next) {
  // Ensure only one active target per user
  if (this.isActive && this.isNew) {
    this.constructor
      .updateMany(
        { userId: this.userId, isActive: true, _id: { $ne: this._id } },
        { $set: { isActive: false } },
      )
      .exec();
  }

  // Calculate percentages if not provided
  if (this.macroTargets && this.calorieTarget.value) {
    const totalCalories = this.calorieTarget.value;
    
    if (this.macroTargets.protein && !this.macroTargets.protein.percentage) {
      this.macroTargets.protein.percentage = Math.round(
        (this.macroTargets.protein.grams * 4 / totalCalories) * 100,
      );
    }
    
    if (this.macroTargets.carbs && !this.macroTargets.carbs.percentage) {
      this.macroTargets.carbs.percentage = Math.round(
        (this.macroTargets.carbs.grams * 4 / totalCalories) * 100,
      );
    }
    
    if (this.macroTargets.fats && !this.macroTargets.fats.percentage) {
      this.macroTargets.fats.percentage = Math.round(
        (this.macroTargets.fats.grams * 9 / totalCalories) * 100,
      );
    }
  }

  // Set next review date if not provided (default 4 weeks)
  if (!this.nextReviewDate && this.effectiveDate) {
    this.nextReviewDate = new Date(this.effectiveDate);
    this.nextReviewDate.setDate(this.nextReviewDate.getDate() + 28);
  }

  next();
});

// Methods
nutritionTargetSchema.methods.addAdjustment = function (field, oldValue, newValue, reason, adjustedBy, clientFeedback) {
  this.adjustments.push({
    date: new Date(),
    field,
    oldValue,
    newValue,
    reason,
    adjustedBy,
    clientFeedback,
  });
  return this.save();
};

nutritionTargetSchema.methods.calculateAdherence = async function (startDate, endDate) {
  const FoodLog = require('./foodLog.model');
  
  const logs = await FoodLog.find({
    userId: this.userId,
    date: { $gte: startDate, $lte: endDate },
  });

  if (logs.length === 0) {
    return null;
  }

  const adherenceData = logs.map((log) => {
    const calorieAdherence = log.targets?.calories
      ? Math.abs((log.totals.calories - log.targets.calories) / log.targets.calories) * 100
      : null;
    const proteinAdherence = log.targets?.protein
      ? Math.abs((log.totals.protein - log.targets.protein) / log.targets.protein) * 100
      : null;

    return {
      date: log.date,
      calorieAdherence,
      proteinAdherence,
      withinRange: calorieAdherence !== null && calorieAdherence < 10, // Within 10%
    };
  });

  const avgCalorieAdherence = adherenceData
    .filter(d => d.calorieAdherence !== null)
    .reduce((sum, d) => sum + d.calorieAdherence, 0) / logs.length;

  const daysWithinRange = adherenceData.filter(d => d.withinRange).length;
  const adherenceRate = (daysWithinRange / logs.length) * 100;

  return {
    totalDays: logs.length,
    daysWithinRange,
    adherenceRate,
    avgCalorieDeviation: avgCalorieAdherence,
    dailyAdherence: adherenceData,
  };
};

module.exports = mongoose.model('NutritionTarget', nutritionTargetSchema);

