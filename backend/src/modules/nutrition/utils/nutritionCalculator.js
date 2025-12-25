/**
 * Nutrition Calculator Utilities
 * Calculate BMR, TDEE, and macro targets with rationale generation
 */

class NutritionCalculator {
  /**
   * Calculate BMR using specified formula
   */
  calculateBMR(inputs, formula = 'mifflin_st_jeor') {
    const { weight, height, age, gender, bodyFatPercentage } = inputs;

    let bmr;
    let rationale;

    switch (formula) {
      case 'mifflin_st_jeor':
        // Most accurate for general population
        if (gender === 'male') {
          bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
          bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
        rationale = 'Calculated using Mifflin-St Jeor equation (considered most accurate for general population)';
        break;

      case 'harris_benedict':
        // Original formula, slightly less accurate
        if (gender === 'male') {
          bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
        } else {
          bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
        }
        rationale = 'Calculated using Harris-Benedict equation';
        break;

      case 'katch_mcardle':
        // Most accurate if body fat % is known
        if (!bodyFatPercentage) {
          throw new Error('Body fat percentage required for Katch-McArdle formula');
        }
        const leanBodyMass = weight * (1 - bodyFatPercentage / 100);
        bmr = 370 + 21.6 * leanBodyMass;
        rationale = `Calculated using Katch-McArdle equation based on lean body mass (${leanBodyMass.toFixed(1)}kg). Most accurate when body composition is known.`;
        break;

      default:
        throw new Error(`Unknown BMR formula: ${formula}`);
    }

    return {
      value: Math.round(bmr),
      formula,
      calculationInputs: inputs,
      rationale,
    };
  }

  /**
   * Calculate TDEE from BMR and activity level
   */
  calculateTDEE(bmr, activityLevel, customActivityDescription = null) {
    const activityMultipliers = {
      sedentary: {
        multiplier: 1.2,
        description: 'Little to no exercise, desk job',
      },
      lightly_active: {
        multiplier: 1.375,
        description: 'Light exercise 1-3 days/week',
      },
      moderately_active: {
        multiplier: 1.55,
        description: 'Moderate exercise 3-5 days/week',
      },
      very_active: {
        multiplier: 1.725,
        description: 'Hard exercise 6-7 days/week',
      },
      extremely_active: {
        multiplier: 1.9,
        description: 'Very hard exercise, physical job, or training 2x/day',
      },
    };

    const activity = activityMultipliers[activityLevel];
    if (!activity) {
      throw new Error(`Unknown activity level: ${activityLevel}`);
    }

    const tdee = Math.round(bmr * activity.multiplier);

    const rationale = customActivityDescription
      ? `TDEE calculated with ${activity.multiplier}x multiplier. ${customActivityDescription}`
      : `TDEE calculated with ${activity.multiplier}x multiplier for ${activity.description}`;

    return {
      value: tdee,
      activityLevel,
      activityMultiplier: activity.multiplier,
      rationale,
    };
  }

  /**
   * Calculate calorie target based on goal
   */
  calculateCalorieTarget(tdee, goal, options = {}) {
    const {
      customAdjustment = null,
      targetRate = null, // kg/week
      bodyWeight = null,
    } = options;

    let adjustment;
    let adjustmentPercentage;
    let rateOfChange;
    let rationale;

    // Custom adjustment overrides everything
    if (customAdjustment !== null) {
      adjustment = customAdjustment;
      adjustmentPercentage = Math.round((adjustment / tdee) * 100);
      rateOfChange = {
        amount: Math.abs(adjustment / 7700), // 7700 cal = 1kg fat
        unit: 'kg',
      };
      rationale = `Custom adjustment of ${adjustment > 0 ? '+' : ''}${adjustment} calories (${adjustmentPercentage > 0 ? '+' : ''}${adjustmentPercentage}%) from TDEE`;
      
      return {
        value: tdee + adjustment,
        goal,
        adjustment,
        adjustmentPercentage,
        rateOfChange,
        rationale,
      };
    }

    // Calculate based on goal
    switch (goal) {
      case 'weight_loss':
        adjustment = targetRate ? Math.round(-targetRate * 7700 / 7) : -500;
        rateOfChange = {
          amount: targetRate || 0.5,
          unit: 'kg',
        };
        adjustmentPercentage = Math.round((adjustment / tdee) * 100);
        rationale = `${adjustment} calorie deficit (${adjustmentPercentage}% below TDEE) for ${rateOfChange.amount}kg/week fat loss. ` +
                   'Moderate deficit to preserve muscle mass and maintain energy levels.';
        break;

      case 'muscle_gain':
        adjustment = targetRate ? Math.round(targetRate * 7700 / 7) : 300;
        rateOfChange = {
          amount: targetRate || 0.25,
          unit: 'kg',
        };
        adjustmentPercentage = Math.round((adjustment / tdee) * 100);
        rationale = `${adjustment} calorie surplus (${adjustmentPercentage}% above TDEE) for ${rateOfChange.amount}kg/week muscle gain. ` +
                   'Conservative surplus to maximize muscle gain while minimizing fat accumulation.';
        break;

      case 'body_recomp':
        adjustment = 0;
        adjustmentPercentage = 0;
        rateOfChange = { amount: 0, unit: 'kg' };
        rationale = 'At maintenance calories for body recomposition. Focus on training and protein intake to build muscle while losing fat simultaneously.';
        break;

      case 'performance':
        adjustment = 200;
        adjustmentPercentage = Math.round((adjustment / tdee) * 100);
        rationale = `Small surplus (${adjustmentPercentage}% above TDEE) to support training performance and recovery without excess fat gain.`;
        break;

      case 'maintenance':
        adjustment = 0;
        adjustmentPercentage = 0;
        rationale = 'At maintenance calories to maintain current weight and body composition.';
        break;

      case 'health':
        adjustment = 0;
        adjustmentPercentage = 0;
        rationale = 'At maintenance calories. Focus on nutrient quality and overall health rather than body composition changes.';
        break;

      default:
        throw new Error(`Unknown goal: ${goal}`);
    }

    return {
      value: tdee + adjustment,
      goal,
      adjustment,
      adjustmentPercentage,
      rateOfChange,
      rationale,
    };
  }

  /**
   * Calculate macro targets based on goal and preferences
   */
  calculateMacros(calorieTarget, bodyWeight, goal, options = {}) {
    const {
      proteinGramsPerKg = null,
      carbPreference = 'moderate', // low, moderate, high
      fatMinimum = 0.8, // g/kg minimum for hormones
      customSplit = null, // { protein: 40, carbs: 40, fats: 20 } percentages
    } = options;

    let protein;
    let carbs;
    let fats;

    // Custom split
    if (customSplit) {
      protein = {
        grams: Math.round((calorieTarget * (customSplit.protein / 100)) / 4),
        percentage: customSplit.protein,
        gramsPerKg: Math.round((calorieTarget * (customSplit.protein / 100)) / 4 / bodyWeight * 10) / 10,
        rationale: 'Custom macro split based on individual preferences and tolerance',
      };

      carbs = {
        grams: Math.round((calorieTarget * (customSplit.carbs / 100)) / 4),
        percentage: customSplit.carbs,
        gramsPerKg: Math.round((calorieTarget * (customSplit.carbs / 100)) / 4 / bodyWeight * 10) / 10,
        rationale: 'Custom macro split based on individual preferences and tolerance',
      };

      fats = {
        grams: Math.round((calorieTarget * (customSplit.fats / 100)) / 9),
        percentage: customSplit.fats,
        gramsPerKg: Math.round((calorieTarget * (customSplit.fats / 100)) / 9 / bodyWeight * 10) / 10,
        rationale: 'Custom macro split based on individual preferences and tolerance',
      };

      return { protein, carbs, fats };
    }

    // Calculate protein based on goal
    let proteinPerKg;
    let proteinRationale;

    if (proteinGramsPerKg) {
      proteinPerKg = proteinGramsPerKg;
      proteinRationale = `${proteinPerKg}g/kg as specified for individual needs`;
    } else {
      switch (goal) {
        case 'weight_loss':
          proteinPerKg = 2.2;
          proteinRationale = '2.2g/kg to preserve muscle mass during caloric deficit';
          break;
        case 'muscle_gain':
          proteinPerKg = 2.0;
          proteinRationale = '2.0g/kg to support muscle protein synthesis and recovery';
          break;
        case 'body_recomp':
          proteinPerKg = 2.4;
          proteinRationale = '2.4g/kg (high protein) to support simultaneous fat loss and muscle gain';
          break;
        case 'performance':
          proteinPerKg = 1.8;
          proteinRationale = '1.8g/kg for recovery and adaptation to training stimulus';
          break;
        default:
          proteinPerKg = 1.6;
          proteinRationale = '1.6g/kg for general health and maintenance';
      }
    }

    const proteinGrams = Math.round(proteinPerKg * bodyWeight);
    const proteinCalories = proteinGrams * 4;
    const proteinPercentage = Math.round((proteinCalories / calorieTarget) * 100);

    protein = {
      grams: proteinGrams,
      percentage: proteinPercentage,
      gramsPerKg: proteinPerKg,
      rationale: proteinRationale,
    };

    // Calculate fats (minimum for health)
    const minFatGrams = Math.round(fatMinimum * bodyWeight);
    let fatGrams;
    let fatRationale;

    if (carbPreference === 'low' || goal === 'weight_loss') {
      // Higher fat, lower carb
      const fatPercentage = 30;
      fatGrams = Math.round((calorieTarget * (fatPercentage / 100)) / 9);
      fatGrams = Math.max(fatGrams, minFatGrams);
      fatRationale = `${fatPercentage}% of calories for satiety, hormone health, and fat-soluble vitamin absorption`;
    } else if (carbPreference === 'high' || goal === 'performance') {
      // Lower fat, higher carb
      const fatPercentage = 20;
      fatGrams = Math.round((calorieTarget * (fatPercentage / 100)) / 9);
      fatGrams = Math.max(fatGrams, minFatGrams);
      fatRationale = `${fatPercentage}% of calories (minimum for hormone health) to allow higher carbs for performance`;
    } else {
      // Moderate
      const fatPercentage = 25;
      fatGrams = Math.round((calorieTarget * (fatPercentage / 100)) / 9);
      fatRationale = `${fatPercentage}% of calories for balanced energy, satiety, and health`;
    }

    const fatCalories = fatGrams * 9;
    const fatPercentage = Math.round((fatCalories / calorieTarget) * 100);
    const fatPerKg = Math.round(fatGrams / bodyWeight * 10) / 10;

    fats = {
      grams: fatGrams,
      percentage: fatPercentage,
      gramsPerKg: fatPerKg,
      rationale: fatRationale,
    };

    // Calculate carbs (remaining calories)
    const remainingCalories = calorieTarget - proteinCalories - fatCalories;
    const carbGrams = Math.round(remainingCalories / 4);
    const carbPercentage = Math.round((carbGrams * 4 / calorieTarget) * 100);
    const carbPerKg = Math.round(carbGrams / bodyWeight * 10) / 10;

    let carbRationale;
    if (goal === 'performance' || goal === 'muscle_gain') {
      carbRationale = `${carbPerKg}g/kg to fuel training, support recovery, and optimize performance`;
    } else if (goal === 'weight_loss') {
      carbRationale = `${carbPerKg}g/kg remaining after protein/fat targets. Adjust based on training volume and preference`;
    } else {
      carbRationale = `${carbPerKg}g/kg for energy and to meet calorie target`;
    }

    carbs = {
      grams: carbGrams,
      percentage: carbPercentage,
      gramsPerKg: carbPerKg,
      rationale: carbRationale,
    };

    return { protein, carbs, fats };
  }

  /**
   * Calculate water intake recommendation
   */
  calculateWaterIntake(bodyWeight, activityLevel, climate = 'moderate') {
    // Base: 35ml/kg bodyweight
    let waterLiters = (bodyWeight * 35) / 1000;

    // Adjust for activity
    const activityAdjustments = {
      sedentary: 0,
      lightly_active: 0.5,
      moderately_active: 1.0,
      very_active: 1.5,
      extremely_active: 2.0,
    };

    waterLiters += activityAdjustments[activityLevel] || 1.0;

    // Adjust for climate
    if (climate === 'hot') {
      waterLiters += 1.0;
    }

    waterLiters = Math.round(waterLiters * 10) / 10;

    const rationale = `${Math.round(bodyWeight * 35)}ml base (35ml/kg) + ` +
                     `${activityAdjustments[activityLevel] || 1.0}L for activity level` +
                     (climate === 'hot' ? ' + 1L for hot climate' : '');

    return {
      value: waterLiters,
      rationale,
    };
  }

  /**
   * Calculate fiber recommendation
   */
  calculateFiber(calorieTarget, goal) {
    // General recommendation: 14g per 1000 calories
    let fiberGrams = Math.round((calorieTarget / 1000) * 14);

    // Adjust for weight loss (higher fiber for satiety)
    if (goal === 'weight_loss') {
      fiberGrams = Math.round(fiberGrams * 1.2);
    }

    const rationale = goal === 'weight_loss'
      ? `${fiberGrams}g (increased for satiety and digestive health during deficit)`
      : `${fiberGrams}g for digestive health and satiety (14g per 1000 calories)`;

    return {
      value: fiberGrams,
      rationale,
    };
  }

  /**
   * Generate refeed strategy for weight loss
   */
  generateRefeedStrategy(calorieTarget, tdee, dietDuration, bodyFatPercentage = null) {
    // Refeeds primarily for longer diets or lower body fat
    if (dietDuration < 4) {
      return {
        enabled: false,
        rationale: 'No refeed needed for short-term diets (<4 weeks)',
      };
    }

    const deficit = tdee - calorieTarget;
    const deficitPercentage = (deficit / tdee) * 100;

    // Larger deficits or lower body fat = more frequent refeeds
    let frequency;
    let calorieIncrease;
    let rationale;

    if (deficitPercentage > 25 || (bodyFatPercentage && bodyFatPercentage < 15)) {
      frequency = 'weekly';
      calorieIncrease = Math.round(deficit * 0.8); // Almost at maintenance
      rationale = 'Weekly refeed due to aggressive deficit or lower body fat. Helps maintain metabolic rate, training performance, and adherence.';
    } else if (deficitPercentage > 15 || (bodyFatPercentage && bodyFatPercentage < 20)) {
      frequency = 'biweekly';
      calorieIncrease = Math.round(deficit * 0.7);
      rationale = 'Biweekly refeed to support metabolic adaptation and psychological break from dieting.';
    } else {
      frequency = 'monthly';
      calorieIncrease = Math.round(deficit * 0.6);
      rationale = 'Monthly refeed for diet break and adherence support.';
    }

    // Refeed = mostly carbs
    const carbIncrease = Math.round((calorieIncrease * 0.8) / 4);

    return {
      enabled: true,
      frequency,
      dayOfWeek: 'saturday',
      calorieIncrease,
      macroAdjustments: {
        carbs: carbIncrease,
        protein: 0,
        fats: 0,
      },
      rationale,
    };
  }

  /**
   * Generate diet break strategy for extended cuts
   */
  generateDietBreakStrategy(dietDuration, deficitPercentage) {
    if (dietDuration < 8) {
      return {
        enabled: false,
        rationale: 'No diet break needed for short diets (<8 weeks)',
      };
    }

    const frequency = deficitPercentage > 20 ? 'every 8 weeks' : 'every 12 weeks';
    const duration = 14; // 2 weeks

    return {
      enabled: true,
      frequency,
      duration,
      rationale: `2-week full diet break ${frequency} at maintenance calories to restore metabolic rate, reduce adaptive thermogenesis, and provide psychological break. Critical for long-term diet success.`,
    };
  }
}

module.exports = new NutritionCalculator();

