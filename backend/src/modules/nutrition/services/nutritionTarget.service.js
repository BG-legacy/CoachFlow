/**
 * Nutrition Target Service
 * Manages TDEE, BMR, and nutrition target calculations with rationale
 */

const NutritionTarget = require('../models/nutritionTarget.model');
const ClientProfile = require('../../clients/models/clientProfile.model');
const nutritionCalculator = require('../utils/nutritionCalculator');
const { NotFoundError, ValidationError } = require('../../../common/utils/errors');
const logger = require('../../../common/utils/logger');

class NutritionTargetService {
  /**
   * Create a new nutrition target with full calculations
   */
  async createNutritionTarget(userId, createdBy, options = {}) {
    // Get client profile
    const clientProfile = await ClientProfile.findOne({ userId });
    if (!clientProfile) {
      throw new NotFoundError('Client profile');
    }

    const {
      bmrFormula = 'mifflin_st_jeor',
      activityLevel,
      activityDescription = null,
      goal,
      targetRate = null,
      proteinGramsPerKg = null,
      carbPreference = 'moderate',
      customCalorieAdjustment = null,
      customMacroSplit = null,
      mealsPerDay = 4,
      enablePreWorkoutNutrition = false,
      enablePostWorkoutNutrition = true,
      dietDuration = null, // weeks
      notes = '',
    } = options;

    // Validate required fields
    if (!activityLevel) {
      throw new ValidationError('Activity level is required');
    }
    if (!goal) {
      throw new ValidationError('Goal is required');
    }

    // Extract personal info
    const { weight, height, dateOfBirth, gender } = clientProfile.personalInfo;
    
    if (!weight || !height || !dateOfBirth || !gender) {
      throw new ValidationError('Complete personal info (weight, height, date of birth, gender) required');
    }

    // Calculate age
    const age = Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));

    // Step 1: Calculate BMR
    const bmrData = nutritionCalculator.calculateBMR(
      {
        weight,
        height,
        age,
        gender,
        bodyFatPercentage: clientProfile.personalInfo.bodyFatPercentage,
      },
      bmrFormula,
    );

    logger.info(`Calculated BMR for user ${userId}: ${bmrData.value} kcal`);

    // Step 2: Calculate TDEE
    const tdeeData = nutritionCalculator.calculateTDEE(
      bmrData.value,
      activityLevel,
      activityDescription,
    );

    logger.info(`Calculated TDEE for user ${userId}: ${tdeeData.value} kcal`);

    // Step 3: Calculate calorie target
    const calorieTargetData = nutritionCalculator.calculateCalorieTarget(
      tdeeData.value,
      goal,
      {
        customAdjustment: customCalorieAdjustment,
        targetRate,
        bodyWeight: weight,
      },
    );

    logger.info(`Calculated calorie target for user ${userId}: ${calorieTargetData.value} kcal`);

    // Step 4: Calculate macros
    const macroData = nutritionCalculator.calculateMacros(
      calorieTargetData.value,
      weight,
      goal,
      {
        proteinGramsPerKg,
        carbPreference,
        customSplit: customMacroSplit,
      },
    );

    // Step 5: Calculate water intake
    const waterData = nutritionCalculator.calculateWaterIntake(
      weight,
      activityLevel,
      clientProfile.personalInfo.climate || 'moderate',
    );

    // Step 6: Calculate fiber
    const fiberData = nutritionCalculator.calculateFiber(
      calorieTargetData.value,
      goal,
    );

    // Step 7: Generate meal timing strategy
    const mealTimingRationale = this._generateMealTimingRationale(
      mealsPerDay,
      enablePreWorkoutNutrition,
      enablePostWorkoutNutrition,
      goal,
    );

    // Step 8: Generate refeed strategy (if applicable)
    let refeedStrategy = { enabled: false };
    if (goal === 'weight_loss' && dietDuration) {
      refeedStrategy = nutritionCalculator.generateRefeedStrategy(
        calorieTargetData.value,
        tdeeData.value,
        dietDuration,
        clientProfile.personalInfo.bodyFatPercentage,
      );
    }

    // Step 9: Generate diet break strategy (if applicable)
    let dietBreakStrategy = { enabled: false };
    if (goal === 'weight_loss' && dietDuration) {
      const deficitPercentage = Math.abs(calorieTargetData.adjustmentPercentage);
      dietBreakStrategy = nutritionCalculator.generateDietBreakStrategy(
        dietDuration,
        deficitPercentage,
      );
    }

    // Step 10: Set review dates
    const effectiveDate = new Date();
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + 28); // Review every 4 weeks

    // Create nutrition target
    const nutritionTarget = new NutritionTarget({
      userId,
      createdBy,
      bmr: {
        value: bmrData.value,
        formula: bmrData.formula,
        calculationInputs: bmrData.calculationInputs,
        calculationDate: new Date(),
        rationale: bmrData.rationale,
      },
      tdee: {
        value: tdeeData.value,
        activityLevel,
        activityMultiplier: tdeeData.activityMultiplier,
        calculationDate: new Date(),
        rationale: tdeeData.rationale,
      },
      calorieTarget: {
        value: calorieTargetData.value,
        goal,
        adjustment: calorieTargetData.adjustment,
        adjustmentPercentage: calorieTargetData.adjustmentPercentage,
        rateOfChange: calorieTargetData.rateOfChange,
        rationale: calorieTargetData.rationale,
      },
      macroTargets: {
        protein: macroData.protein,
        carbs: macroData.carbs,
        fats: macroData.fats,
        fiber: {
          grams: fiberData.value,
          rationale: fiberData.rationale,
        },
      },
      additionalTargets: {
        water: waterData,
      },
      mealTiming: {
        mealsPerDay,
        preworkoutNutrition: {
          enabled: enablePreWorkoutNutrition,
          timing: '60-90 minutes before',
          macros: enablePreWorkoutNutrition ? {
            carbs: Math.round(macroData.carbs.grams * 0.2),
            protein: Math.round(macroData.protein.grams * 0.15),
          } : {},
        },
        postworkoutNutrition: {
          enabled: enablePostWorkoutNutrition,
          timing: 'Within 2 hours post-workout',
          macros: enablePostWorkoutNutrition ? {
            carbs: Math.round(macroData.carbs.grams * 0.3),
            protein: Math.round(macroData.protein.grams * 0.25),
          } : {},
        },
        rationale: mealTimingRationale,
      },
      refeedStrategy,
      dietBreakStrategy,
      effectiveDate,
      nextReviewDate,
      isActive: true,
      notes,
    });

    await nutritionTarget.save();

    logger.info(`Created nutrition target for user ${userId} by ${createdBy}`);

    return nutritionTarget;
  }

  /**
   * Get active nutrition target for a user
   */
  async getActiveTarget(userId) {
    const target = await NutritionTarget.findOne({
      userId,
      isActive: true,
    }).populate('createdBy', 'firstName lastName email');

    if (!target) {
      throw new NotFoundError('Active nutrition target');
    }

    return target;
  }

  /**
   * Get all nutrition targets for a user (history)
   */
  async getTargetHistory(userId, options = {}) {
    const { limit = 10, skip = 0 } = options;

    const targets = await NutritionTarget.find({ userId })
      .sort({ effectiveDate: -1 })
      .limit(limit)
      .skip(skip)
      .populate('createdBy', 'firstName lastName email');

    const total = await NutritionTarget.countDocuments({ userId });

    return { targets, total };
  }

  /**
   * Update nutrition target
   */
  async updateTarget(targetId, userId, updates, reason, adjustedBy) {
    const target = await NutritionTarget.findById(targetId);

    if (!target) {
      throw new NotFoundError('Nutrition target');
    }

    if (target.userId.toString() !== userId) {
      throw new ValidationError('Cannot update target for different user');
    }

    // Track adjustments
    const adjustments = [];

    // Helper to track field changes
    const trackChange = (field, oldValue, newValue) => {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        adjustments.push({
          date: new Date(),
          field,
          oldValue,
          newValue,
          reason,
          adjustedBy,
        });
      }
    };

    // Update calorie target
    if (updates.calorieTarget !== undefined) {
      trackChange(
        'calorieTarget.value',
        target.calorieTarget.value,
        updates.calorieTarget,
      );
      target.calorieTarget.value = updates.calorieTarget;
      target.calorieTarget.adjustment = updates.calorieTarget - target.tdee.value;
      target.calorieTarget.adjustmentPercentage = Math.round(
        (target.calorieTarget.adjustment / target.tdee.value) * 100,
      );
    }

    // Update macros
    if (updates.macroTargets) {
      if (updates.macroTargets.protein) {
        trackChange(
          'macroTargets.protein.grams',
          target.macroTargets.protein.grams,
          updates.macroTargets.protein,
        );
        target.macroTargets.protein.grams = updates.macroTargets.protein;
      }
      if (updates.macroTargets.carbs) {
        trackChange(
          'macroTargets.carbs.grams',
          target.macroTargets.carbs.grams,
          updates.macroTargets.carbs,
        );
        target.macroTargets.carbs.grams = updates.macroTargets.carbs;
      }
      if (updates.macroTargets.fats) {
        trackChange(
          'macroTargets.fats.grams',
          target.macroTargets.fats.grams,
          updates.macroTargets.fats,
        );
        target.macroTargets.fats.grams = updates.macroTargets.fats;
      }
    }

    // Update activity level (recalculates TDEE)
    if (updates.activityLevel && updates.activityLevel !== target.tdee.activityLevel) {
      const oldTDEE = target.tdee.value;
      const tdeeData = nutritionCalculator.calculateTDEE(
        target.bmr.value,
        updates.activityLevel,
        updates.activityDescription,
      );
      
      trackChange('tdee.value', oldTDEE, tdeeData.value);
      
      target.tdee.value = tdeeData.value;
      target.tdee.activityLevel = updates.activityLevel;
      target.tdee.activityMultiplier = tdeeData.activityMultiplier;
      target.tdee.rationale = tdeeData.rationale;
    }

    // Add adjustments to history
    if (adjustments.length > 0) {
      target.adjustments.push(...adjustments);
      target.lastReviewedDate = new Date();
    }

    await target.save();

    logger.info(`Updated nutrition target ${targetId} for user ${userId}`);

    return target;
  }

  /**
   * Recalculate nutrition target based on updated client profile
   */
  async recalculateTarget(userId, createdBy, reason = 'Profile update') {
    const currentTarget = await this.getActiveTarget(userId);

    // Mark current target as inactive
    currentTarget.isActive = false;
    await currentTarget.save();

    // Create new target with same options but new calculations
    const newTarget = await this.createNutritionTarget(userId, createdBy, {
      bmrFormula: currentTarget.bmr.formula,
      activityLevel: currentTarget.tdee.activityLevel,
      goal: currentTarget.calorieTarget.goal,
      proteinGramsPerKg: currentTarget.macroTargets.protein.gramsPerKg,
      mealsPerDay: currentTarget.mealTiming.mealsPerDay,
      enablePreWorkoutNutrition: currentTarget.mealTiming.preworkoutNutrition.enabled,
      enablePostWorkoutNutrition: currentTarget.mealTiming.postworkoutNutrition.enabled,
      notes: `Recalculated from previous target. Reason: ${reason}`,
    });

    logger.info(`Recalculated nutrition target for user ${userId}. Old: ${currentTarget._id}, New: ${newTarget._id}`);

    return newTarget;
  }

  /**
   * Get adherence report for a target
   */
  async getAdherenceReport(targetId, startDate, endDate) {
    const target = await NutritionTarget.findById(targetId);

    if (!target) {
      throw new NotFoundError('Nutrition target');
    }

    const adherence = await target.calculateAdherence(startDate, endDate);

    return {
      target: {
        calories: target.calorieTarget.value,
        protein: target.macroTargets.protein.grams,
        carbs: target.macroTargets.carbs.grams,
        fats: target.macroTargets.fats.grams,
      },
      adherence,
      recommendations: this._generateAdherenceRecommendations(adherence),
    };
  }

  /**
   * Get targets due for review
   */
  async getTargetsDueForReview(coachId = null) {
    const query = {
      isActive: true,
      nextReviewDate: { $lte: new Date() },
    };

    if (coachId) {
      query.createdBy = coachId;
    }

    const targets = await NutritionTarget.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ nextReviewDate: 1 });

    return targets;
  }

  /**
   * Compare current target with previous
   */
  async compareTargets(userId, currentTargetId, previousTargetId = null) {
    const currentTarget = await NutritionTarget.findById(currentTargetId);

    if (!currentTarget) {
      throw new NotFoundError('Current nutrition target');
    }

    let previousTarget;
    if (previousTargetId) {
      previousTarget = await NutritionTarget.findById(previousTargetId);
    } else {
      // Get most recent previous target
      const targets = await NutritionTarget.find({
        userId,
        _id: { $ne: currentTargetId },
      })
        .sort({ effectiveDate: -1 })
        .limit(1);
      
      previousTarget = targets[0];
    }

    if (!previousTarget) {
      return {
        message: 'No previous target to compare',
        current: currentTarget,
      };
    }

    const comparison = {
      effectiveDateDiff: Math.round(
        (currentTarget.effectiveDate - previousTarget.effectiveDate) / (1000 * 60 * 60 * 24),
      ),
      bmr: {
        current: currentTarget.bmr.value,
        previous: previousTarget.bmr.value,
        change: currentTarget.bmr.value - previousTarget.bmr.value,
        percentChange: ((currentTarget.bmr.value - previousTarget.bmr.value) / previousTarget.bmr.value) * 100,
      },
      tdee: {
        current: currentTarget.tdee.value,
        previous: previousTarget.tdee.value,
        change: currentTarget.tdee.value - previousTarget.tdee.value,
        percentChange: ((currentTarget.tdee.value - previousTarget.tdee.value) / previousTarget.tdee.value) * 100,
      },
      calories: {
        current: currentTarget.calorieTarget.value,
        previous: previousTarget.calorieTarget.value,
        change: currentTarget.calorieTarget.value - previousTarget.calorieTarget.value,
        percentChange: ((currentTarget.calorieTarget.value - previousTarget.calorieTarget.value) / previousTarget.calorieTarget.value) * 100,
      },
      protein: {
        current: currentTarget.macroTargets.protein.grams,
        previous: previousTarget.macroTargets.protein.grams,
        change: currentTarget.macroTargets.protein.grams - previousTarget.macroTargets.protein.grams,
      },
      carbs: {
        current: currentTarget.macroTargets.carbs.grams,
        previous: previousTarget.macroTargets.carbs.grams,
        change: currentTarget.macroTargets.carbs.grams - previousTarget.macroTargets.carbs.grams,
      },
      fats: {
        current: currentTarget.macroTargets.fats.grams,
        previous: previousTarget.macroTargets.fats.grams,
        change: currentTarget.macroTargets.fats.grams - previousTarget.macroTargets.fats.grams,
      },
    };

    return {
      current: currentTarget,
      previous: previousTarget,
      comparison,
    };
  }

  // Helper methods

  _generateMealTimingRationale(mealsPerDay, preWorkout, postWorkout, goal) {
    let rationale = `${mealsPerDay} meals per day for `;

    if (goal === 'muscle_gain') {
      rationale += 'optimal protein distribution and muscle protein synthesis. ';
    } else if (goal === 'weight_loss') {
      rationale += 'satiety and adherence during caloric deficit. ';
    } else {
      rationale += 'convenient and sustainable meal pattern. ';
    }

    if (preWorkout) {
      rationale += 'Pre-workout nutrition for energy and performance. ';
    }

    if (postWorkout) {
      rationale += 'Post-workout nutrition for recovery and adaptation.';
    }

    return rationale.trim();
  }

  _generateAdherenceRecommendations(adherence) {
    if (!adherence) {
      return ['Not enough data to generate recommendations'];
    }

    const recommendations = [];

    if (adherence.adherenceRate < 60) {
      recommendations.push('Adherence is low (<60%). Consider: 1) Simplifying meal plan, 2) Adjusting targets to be more realistic, 3) Addressing barriers to compliance');
    } else if (adherence.adherenceRate < 80) {
      recommendations.push('Adherence is moderate (60-80%). Small adjustments to meal plan or education may improve consistency');
    } else {
      recommendations.push('Adherence is excellent (>80%). Continue current approach');
    }

    if (adherence.avgCalorieDeviation > 15) {
      recommendations.push('Average calorie deviation is high (>15%). Focus on portion control and tracking accuracy');
    }

    if (adherence.totalDays < 7) {
      recommendations.push('Limited tracking data. Encourage more consistent logging for better insights');
    }

    return recommendations;
  }
}

module.exports = new NutritionTargetService();

