/**
 * Meal Plan Generator Service
 * AI-powered meal plan generation integrated with nutrition targets
 */

const MealPlan = require('../models/mealPlan.model');
const NutritionTarget = require('../models/nutritionTarget.model');
const ClientProfile = require('../../clients/models/clientProfile.model');
const mealPlanVersionService = require('./mealPlanVersion.service');
const openaiService = require('../../ai-programs/services/openai.service');
const logger = require('../../../common/utils/logger');

class MealPlanGeneratorService {
  /**
   * Generate AI-powered meal plan based on nutrition target
   */
  async generateMealPlan(clientId, coachId, options = {}) {
    const {
      duration = 7, // days
      mealsPerDay = 4,
      includeSnacks = true,
      useNutritionTarget = true,
      customTargets = null,
      notes = '',
    } = options;

    // Get client profile
    const clientProfile = await ClientProfile.findOne({ userId: clientId })
      .populate('userId', 'firstName lastName');
    
    if (!clientProfile) {
      throw new Error('Client profile not found');
    }

    // Get nutrition target if requested
    let nutritionTarget = null;
    let targets = customTargets;

    if (useNutritionTarget && !customTargets) {
      nutritionTarget = await NutritionTarget.findOne({
        userId: clientId,
      isActive: true,
    });

      if (nutritionTarget) {
        targets = {
        calories: nutritionTarget.calorieTarget.value,
        protein: nutritionTarget.macroTargets.protein.grams,
        carbs: nutritionTarget.macroTargets.carbs.grams,
        fats: nutritionTarget.macroTargets.fats.grams,
        fiber: nutritionTarget.macroTargets.fiber?.grams || 25,
        water: nutritionTarget.additionalTargets?.water?.value || 2.5,
        };
      }
    }

    if (!targets) {
      throw new Error('No nutrition targets available. Please create a nutrition target first.');
    }

    // Build AI prompt
    const prompt = this._buildMealPlanPrompt(clientProfile, targets, options);

    // Generate meal plan with AI
    logger.info(`Generating meal plan for client ${clientId}`);
    const messages = [
      {
        role: 'system',
        content: 'You are an expert nutritionist and meal planning assistant. Generate detailed, practical meal plans with accurate nutritional information.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const aiResponse = await openaiService.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 3000,
      userId: clientId,
      context: { type: 'meal_plan_generation', clientId },
    });

    // Parse AI response
    const generatedMeals = this._parseAIResponse(aiResponse.content, targets);

    // Map diet type to valid enum values
    const dietTypeMap = {
      flexible_dieting: 'none',
      intermittent_fasting: 'none',
    };
    
    let dietType = clientProfile.nutritionPreferences?.dietType || 'none';
    if (dietTypeMap[dietType]) {
      dietType = dietTypeMap[dietType];
    }

    // Create meal plan document
    const mealPlan = new MealPlan({
      coachId,
      clientId,
      name: `${clientProfile.userId.firstName}'s ${this._getGoalName(nutritionTarget?.calorieTarget.goal)} Meal Plan`,
      description: `AI-generated ${duration}-day meal plan tailored to client's nutrition targets and preferences`,
      goal: nutritionTarget?.calorieTarget.goal || 'maintenance',
      version: 1,
      dailyTargets: targets,
      meals: generatedMeals,
      dietType,
      restrictions: clientProfile.nutritionPreferences?.dietaryRestrictions || [],
      startDate: new Date(),
      duration,
      isTemplate: false,
      isActive: true,
      isCurrentVersion: true,
      notes: notes || 'AI-generated meal plan based on nutrition targets',
      tags: ['ai-generated', nutritionTarget?.calorieTarget.goal || 'general'],
    });

    mealPlan.activeVersionId = mealPlan._id;
    await mealPlan.save();

    logger.info(`Meal plan generated: ${mealPlan._id} for client ${clientId}`);

    return mealPlan;
  }

  /**
   * Build AI prompt for meal plan generation
   */
  _buildMealPlanPrompt(clientProfile, targets, options) {
    const { mealsPerDay = 4, duration = 7, includeSnacks = true } = options;

    const dietType = clientProfile.nutritionPreferences?.dietType || 'none';
    const restrictions = clientProfile.nutritionPreferences?.dietaryRestrictions || [];
    const dislikes = clientProfile.nutritionPreferences?.foodDislikes || [];
    const allergies = clientProfile.nutritionPreferences?.foodAllergies || [];

    return `Generate a detailed ${duration}-day meal plan for a fitness client with the following specifications:

CLIENT PROFILE:
- Name: ${clientProfile.userId?.firstName || 'Client'}
- Goal: ${this._getGoalName(clientProfile.fitnessProfile?.primaryGoal)}
- Diet Type: ${dietType}
- Dietary Restrictions: ${restrictions.length > 0 ? restrictions.join(', ') : 'None'}
- Food Allergies: ${allergies.length > 0 ? allergies.map(a => a.allergen || a).join(', ') : 'None'}
- Food Dislikes: ${dislikes.length > 0 ? dislikes.join(', ') : 'None'}

DAILY NUTRITION TARGETS:
- Calories: ${targets.calories} kcal
- Protein: ${targets.protein}g
- Carbs: ${targets.carbs}g
- Fats: ${targets.fats}g
- Fiber: ${targets.fiber}g
- Water: ${targets.water}L

MEAL STRUCTURE:
- Meals per day: ${mealsPerDay}
- Include snacks: ${includeSnacks ? 'Yes' : 'No'}
- Meal types: Breakfast, Lunch, Dinner${includeSnacks ? ', Snacks' : ''}

REQUIREMENTS:
1. Each meal should list specific foods with quantities and units
2. Calculate nutrition values for each food and meal total
3. Ensure daily totals are within ±5% of targets
4. Provide simple preparation instructions for each meal
5. Estimate prep time in minutes
6. Vary meals across days for diversity
7. Respect all dietary restrictions and preferences
8. Include practical, realistic meals that don't require excessive cooking skill
9. Balance macros throughout the day
10. Consider meal timing for optimal energy and recovery

FORMAT: Return the meal plan as a JSON array of ${mealsPerDay * duration} meals with this structure:
{
  "meals": [
    {
      "day": 1,
      "name": "Oatmeal with Berries and Protein Powder",
      "type": "breakfast",
      "time": "7:00 AM",
      "foods": [
        {
          "name": "Rolled oats",
          "quantity": 60,
          "unit": "g",
          "calories": 225,
          "protein": 7,
          "carbs": 41,
          "fats": 4
        }
      ],
      "totalCalories": 380,
      "totalProtein": 30,
      "totalCarbs": 52,
      "totalFats": 8,
      "instructions": "Cook oats with water, mix in protein powder, top with berries",
      "prepTime": 10
    }
  ]
}

Generate the complete ${duration}-day meal plan now:`;
  }

  /**
   * Parse AI response into structured meal data
   */
  _parseAIResponse(aiResponse, targets) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*"meals"[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response as JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.meals || !Array.isArray(parsed.meals)) {
        throw new Error('Invalid meal plan structure');
      }

      // Validate and clean meals
      return parsed.meals.map(meal => ({
        name: meal.name,
        type: meal.type || 'meal',
        time: meal.time,
        foods: meal.foods || [],
        totalCalories: meal.totalCalories || 0,
        totalProtein: meal.totalProtein || 0,
        totalCarbs: meal.totalCarbs || 0,
        totalFats: meal.totalFats || 0,
        instructions: meal.instructions || '',
        prepTime: meal.prepTime || 15,
      }));
    } catch (error) {
      logger.error('Failed to parse AI meal plan response:', error);
      
      // Fallback: Generate template meal plan
      return this._generateFallbackMealPlan(targets);
    }
  }

  /**
   * Generate fallback meal plan if AI fails
   */
  _generateFallbackMealPlan(targets) {
    const caloriesPerMeal = Math.round(targets.calories / 4);
    const proteinPerMeal = Math.round(targets.protein / 4);
    const carbsPerMeal = Math.round(targets.carbs / 4);
    const fatsPerMeal = Math.round(targets.fats / 4);

    return [
      {
        name: 'Breakfast - Oatmeal & Protein',
        type: 'breakfast',
        time: '7:00 AM',
        foods: [
          {
            name: 'Rolled oats',
            quantity: 60,
            unit: 'g',
            calories: 225,
            protein: 7,
            carbs: 41,
            fats: 4,
          },
          {
            name: 'Protein powder',
            quantity: 30,
            unit: 'g',
            calories: 120,
            protein: 25,
            carbs: 3,
            fats: 1,
          },
          {
            name: 'Banana',
            quantity: 100,
            unit: 'g',
            calories: 89,
            protein: 1,
            carbs: 23,
            fats: 0,
          },
        ],
        totalCalories: caloriesPerMeal,
        totalProtein: proteinPerMeal,
        totalCarbs: carbsPerMeal,
        totalFats: fatsPerMeal,
        instructions: 'Cook oats with water, mix in protein powder, slice banana on top',
        prepTime: 10,
      },
      {
        name: 'Lunch - Chicken & Rice',
        type: 'lunch',
        time: '12:30 PM',
        foods: [
          {
            name: 'Chicken breast',
            quantity: 150,
            unit: 'g',
            calories: 247,
            protein: 47,
            carbs: 0,
            fats: 5,
          },
          {
            name: 'Brown rice',
            quantity: 80,
            unit: 'g',
            calories: 280,
            protein: 6,
            carbs: 58,
            fats: 2,
          },
        ],
        totalCalories: caloriesPerMeal,
        totalProtein: proteinPerMeal,
        totalCarbs: carbsPerMeal,
        totalFats: fatsPerMeal,
        instructions: 'Grill chicken, cook rice, serve together with vegetables',
        prepTime: 25,
      },
      {
        name: 'Snack - Greek Yogurt',
        type: 'snack',
        time: '3:30 PM',
        foods: [
          {
            name: 'Greek yogurt',
            quantity: 170,
            unit: 'g',
            calories: 100,
            protein: 17,
            carbs: 6,
            fats: 0,
          },
        ],
        totalCalories: Math.round(caloriesPerMeal / 2),
        totalProtein: Math.round(proteinPerMeal / 2),
        totalCarbs: Math.round(carbsPerMeal / 2),
        totalFats: Math.round(fatsPerMeal / 2),
        instructions: 'Serve chilled',
        prepTime: 2,
      },
      {
        name: 'Dinner - Salmon & Sweet Potato',
        type: 'dinner',
        time: '7:00 PM',
      foods: [
        {
            name: 'Salmon fillet',
            quantity: 150,
          unit: 'g',
            calories: 311,
            protein: 34,
          carbs: 0,
            fats: 18,
        },
        {
            name: 'Sweet potato',
            quantity: 200,
          unit: 'g',
            calories: 172,
            protein: 3,
            carbs: 40,
          fats: 0,
        },
      ],
      totalCalories: caloriesPerMeal,
      totalProtein: proteinPerMeal,
      totalCarbs: carbsPerMeal,
      totalFats: fatsPerMeal,
        instructions: 'Bake salmon and sweet potato, serve with green vegetables',
        prepTime: 30,
      },
    ];
  }

  /**
   * Edit existing meal plan (creates new version)
   */
  async editMealPlan(planId, updates, versionNotes, userId) {
    const existingPlan = await MealPlan.findById(planId);
    
    if (!existingPlan) {
      throw new Error('Meal plan not found');
    }

    // Verify ownership (userId can be string or ObjectId)
    const existingCoachId = existingPlan.coachId.toString();
    const requestUserId = userId.toString();
    
    if (existingCoachId !== requestUserId) {
      throw new Error('Unauthorized to edit this meal plan');
    }

    // Create new version
    const newVersion = await mealPlanVersionService.createNewVersion(
      planId,
      updates,
      versionNotes || 'Manual edit',
    );

    logger.info(`Created new meal plan version: ${newVersion._id} (v${newVersion.version})`);

    return newVersion;
  }

  /**
   * Regenerate meal plan with adjustments
   */
  async regenerateMealPlan(planId, adjustments, versionNotes, userId) {
    const existingPlan = await MealPlan.findById(planId);
    
    if (!existingPlan) {
      throw new Error('Meal plan not found');
    }

    // Generate new meal plan with adjusted parameters
    const newMealPlan = await this.generateMealPlan(
      existingPlan.clientId,
      userId,
      {
        duration: adjustments.duration || existingPlan.duration,
        mealsPerDay: adjustments.mealsPerDay || existingPlan.meals.length / existingPlan.duration,
        customTargets: adjustments.targets || existingPlan.dailyTargets,
        notes: versionNotes || 'Regenerated with adjustments',
      },
    );

    // Link as new version
    newMealPlan.parentPlanId = existingPlan.parentPlanId || existingPlan._id;
    newMealPlan.version = existingPlan.version + 1;
    newMealPlan.versionNotes = versionNotes;
    await newMealPlan.save();

    // Update version pointers
    await MealPlan.updateMany(
      {
        $or: [
          { _id: newMealPlan.parentPlanId },
          { parentPlanId: newMealPlan.parentPlanId },
        ],
      },
      {
        $set: {
          activeVersionId: newMealPlan._id,
          isCurrentVersion: false,
        },
      },
    );

    newMealPlan.isCurrentVersion = true;
    newMealPlan.activeVersionId = newMealPlan._id;
    await newMealPlan.save();

    logger.info(`Regenerated meal plan: ${newMealPlan._id} (v${newMealPlan.version})`);

    return newMealPlan;
  }

  /**
   * Get meal plan with version history
   */
  async getMealPlanWithHistory(planId) {
    const mealPlan = await MealPlan.findById(planId)
      .populate('coachId', 'firstName lastName email')
      .populate('clientId', 'firstName lastName email');

    if (!mealPlan) {
      throw new Error('Meal plan not found');
    }

    const versions = await mealPlanVersionService.getVersionHistory(planId);

    return {
      current: mealPlan,
      versions,
      versionCount: versions.length,
    };
  }

  /**
   * Helper: Get readable goal name
   */
  _getGoalName(goal) {
    const goalNames = {
      weight_loss: 'Weight Loss',
      muscle_gain: 'Muscle Gain',
      maintenance: 'Maintenance',
      performance: 'Performance',
      body_recomp: 'Body Recomposition',
      health: 'Health & Wellness',
    };
    return goalNames[goal] || 'General Fitness';
  }

  /**
   * Calculate daily totals from meals
   */
  calculateDailyTotals(meals) {
    return meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + (meal.totalCalories || 0),
        protein: totals.protein + (meal.totalProtein || 0),
        carbs: totals.carbs + (meal.totalCarbs || 0),
        fats: totals.fats + (meal.totalFats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    );
  }

  /**
   * Validate meal plan meets nutrition targets
   */
  validateMealPlan(mealPlan, tolerance = 0.05) {
    const dailyTotals = this.calculateDailyTotals(mealPlan.meals);
    const targets = mealPlan.dailyTargets;

    const deviations = {
      calories: Math.abs((dailyTotals.calories - targets.calories) / targets.calories),
      protein: Math.abs((dailyTotals.protein - targets.protein) / targets.protein),
      carbs: Math.abs((dailyTotals.carbs - targets.carbs) / targets.carbs),
      fats: Math.abs((dailyTotals.fats - targets.fats) / targets.fats),
    };

    const isValid = Object.values(deviations).every(dev => dev <= tolerance);

    return {
      isValid,
      dailyTotals,
      targets,
      deviations,
      message: isValid
        ? 'Meal plan meets nutrition targets'
        : `Meal plan deviates from targets (tolerance: ${tolerance * 100}%)`,
    };
  }
}

module.exports = new MealPlanGeneratorService();
