/**
 * Program Generator Service
 * Main service for AI-assisted program generation from structured inputs
 */

const openaiService = require('./openai.service');
const programTemplateService = require('./programTemplate.service');
const GeneratedProgram = require('../models/generatedProgram.model');
const ClientProfile = require('../../clients/models/clientProfile.model');
const Program = require('../../workouts/models/program.model');
const Workout = require('../../workouts/models/workout.model');
const MealPlan = require('../../nutrition/models/mealPlan.model');
const logger = require('../../../common/utils/logger');
const { v4: uuidv4 } = require('uuid');

class ProgramGeneratorService {
  /**
   * Generate a complete program (workout + nutrition) for a client
   */
  async generateCompleteProgram(coachId, clientId, options = {}) {
    const requestId = uuidv4();
    
    try {
      // Fetch client profile
      const clientProfile = await ClientProfile.findOne({ userId: clientId })
        .populate('userId', 'name email');
      
      if (!clientProfile) {
        throw new Error('Client profile not found');
      }

      const inputData = {
        clientProfile: this._extractClientData(clientProfile),
        goals: options.goals || clientProfile.fitnessProfile.goals,
        duration: options.duration || 12, // default 12 weeks
        preferences: options.preferences || {},
        constraints: options.constraints || {},
        additionalRequirements: options.additionalRequirements,
      };

      // Check if we should use an existing template (avoid regeneration)
      if (options.useTemplate !== false) {
        const { template, matchType } = await programTemplateService.findMatchingTemplate(
          inputData,
          { allowSimilar: options.allowSimilar }
        );

        if (template) {
          logger.info('Using existing template instead of regenerating', {
            templateId: template.templateId,
            matchType,
            coachId,
            clientId,
          });

          // Apply template with optional customizations
          const result = await programTemplateService.applyTemplate(
            template.templateId,
            clientId,
            coachId,
            options.customizations || {}
          );

          result.source = 'template';
          result.matchType = matchType;
          return result.generatedProgram;
        }
      }

      // No matching template found - generate new program
      logger.info('No matching template found, generating new program', {
        coachId,
        clientId,
        requestId,
      });

      // Create initial generated program record
      const generatedProgram = new GeneratedProgram({
        coachId,
        clientId,
        requestId,
        generationType: 'combined',
        inputData,
        status: 'generating',
      });

      await generatedProgram.save();

      // Generate workout program
      const workoutProgram = await this._generateWorkoutProgram(
        clientProfile,
        options,
        coachId,
        requestId
      );

      // Generate nutrition plan
      const nutritionPlan = await this._generateNutritionPlan(
        clientProfile,
        options,
        coachId,
        requestId
      );

      // Update generated program with results
      generatedProgram.generatedContent = {
        workoutProgram,
        nutritionPlan,
        summary: this._generateProgramSummary(workoutProgram, nutritionPlan),
        keyRecommendations: this._extractRecommendations(workoutProgram, nutritionPlan),
      };
      generatedProgram.status = 'generated';
      
      // Merge AI metadata from both generations
      const totalTokens = (workoutProgram.aiMetadata?.tokensUsed?.total || 0) + 
                          (nutritionPlan.aiMetadata?.tokensUsed?.total || 0);
      const totalCost = (workoutProgram.aiMetadata?.estimatedCost || 0) + 
                        (nutritionPlan.aiMetadata?.estimatedCost || 0);
      
      generatedProgram.aiMetadata = {
        model: workoutProgram.aiMetadata?.model || 'gpt-4-turbo',
        tokensUsed: {
          total: totalTokens,
          prompt: 0,
          completion: 0,
        },
        estimatedCost: totalCost,
        generationTime: Date.now() - generatedProgram.createdAt.getTime(),
      };

      await generatedProgram.save();

      logger.info('Complete program generated successfully', {
        requestId,
        coachId,
        clientId,
      });

      // Auto-create template if enabled (save as versioned artifact)
      if (options.saveAsTemplate !== false) {
        try {
          const template = await programTemplateService.createTemplateFromGenerated(
            generatedProgram._id,
            {
              visibility: options.templateVisibility || 'private',
              tags: options.templateTags,
            }
          );

          generatedProgram.metadata = {
            ...generatedProgram.metadata,
            templateId: template.templateId,
          };
          await generatedProgram.save();

          logger.info('Program saved as reusable template', {
            generatedProgramId: generatedProgram._id,
            templateId: template.templateId,
          });
        } catch (error) {
          // Template creation failure shouldn't fail the generation
          logger.warn('Failed to create template from generated program', {
            generatedProgramId: generatedProgram._id,
            error: error.message,
          });
        }
      }

      return generatedProgram;
    } catch (error) {
      logger.error('Error generating complete program', {
        requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate workout program only
   */
  async generateWorkoutProgram(coachId, clientId, options = {}) {
    const requestId = uuidv4();
    
    try {
      const clientProfile = await ClientProfile.findOne({ userId: clientId })
        .populate('userId', 'name email');
      
      if (!clientProfile) {
        throw new Error('Client profile not found');
      }

      const generatedProgram = new GeneratedProgram({
        coachId,
        clientId,
        requestId,
        generationType: 'workout_only',
        inputData: {
          clientProfile: this._extractClientData(clientProfile),
          goals: options.goals || clientProfile.fitnessProfile.goals,
          duration: options.duration || 12,
          preferences: options.preferences || {},
          constraints: options.constraints || {},
          additionalRequirements: options.additionalRequirements,
        },
        status: 'generating',
      });

      await generatedProgram.save();

      const workoutProgram = await this._generateWorkoutProgram(
        clientProfile,
        options,
        coachId,
        requestId
      );

      generatedProgram.generatedContent = { workoutProgram };
      generatedProgram.status = 'generated';
      generatedProgram.aiMetadata = {
        model: workoutProgram.aiMetadata?.model || 'gpt-4-turbo',
        tokensUsed: workoutProgram.aiMetadata?.tokensUsed || { total: 0, prompt: 0, completion: 0 },
        estimatedCost: workoutProgram.aiMetadata?.estimatedCost || 0,
        generationTime: Date.now() - generatedProgram.createdAt.getTime(),
      };

      await generatedProgram.save();

      return generatedProgram;
    } catch (error) {
      logger.error('Error generating workout program', {
        requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate nutrition plan only
   */
  async generateNutritionPlan(coachId, clientId, options = {}) {
    const requestId = uuidv4();
    
    try {
      const clientProfile = await ClientProfile.findOne({ userId: clientId })
        .populate('userId', 'name email');
      
      if (!clientProfile) {
        throw new Error('Client profile not found');
      }

      const generatedProgram = new GeneratedProgram({
        coachId,
        clientId,
        requestId,
        generationType: 'meal_plan_only',
        inputData: {
          clientProfile: this._extractClientData(clientProfile),
          goals: options.goals || clientProfile.fitnessProfile.goals,
          duration: options.duration || 4, // weeks
          preferences: options.preferences || {},
          constraints: options.constraints || {},
          additionalRequirements: options.additionalRequirements,
        },
        status: 'generating',
      });

      await generatedProgram.save();

      const nutritionPlan = await this._generateNutritionPlan(
        clientProfile,
        options,
        coachId,
        requestId
      );

      generatedProgram.generatedContent = { nutritionPlan };
      generatedProgram.status = 'generated';
      generatedProgram.aiMetadata = {
        model: nutritionPlan.aiMetadata?.model || 'gpt-4-turbo',
        tokensUsed: nutritionPlan.aiMetadata?.tokensUsed || { total: 0, prompt: 0, completion: 0 },
        estimatedCost: nutritionPlan.aiMetadata?.estimatedCost || 0,
        generationTime: Date.now() - generatedProgram.createdAt.getTime(),
      };

      await generatedProgram.save();

      return generatedProgram;
    } catch (error) {
      logger.error('Error generating nutrition plan', {
        requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Internal: Generate workout program using AI
   */
  async _generateWorkoutProgram(clientProfile, options, coachId, requestId) {
    const prompt = this._buildWorkoutPrompt(clientProfile, options);
    
    const completion = await openaiService.generateCompletion(
      [
        {
          role: 'system',
          content: 'You are an expert fitness coach and program designer. Generate comprehensive, personalized workout programs in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        temperature: 0.7,
        maxTokens: 3000,
        timeout: 120000, // 2 minutes for complex generations
        userId: coachId,
        context: {
          feature: 'ai_program_generation',
          action: 'generate_workout_program',
          requestId,
        },
      }
    );

    const programData = openaiService.parseJSONCompletion(completion.content);

    // Track AI metadata
    const aiMetadata = {
      model: completion.model || 'gpt-4',
      tokensUsed: completion.usage,
      estimatedCost: completion.estimatedCost,
      aiRequestId: completion.aiRequestId,
    };

    return {
      name: programData.name,
      description: programData.description,
      duration: programData.duration,
      workouts: programData.workouts,
      reasoning: programData.reasoning,
      aiMetadata,
    };
  }

  /**
   * Internal: Generate nutrition plan using AI
   */
  async _generateNutritionPlan(clientProfile, options, coachId, requestId) {
    const prompt = this._buildNutritionPrompt(clientProfile, options);
    
    const completion = await openaiService.generateCompletion(
      [
        {
          role: 'system',
          content: 'You are an expert nutritionist and meal planner. Generate comprehensive, personalized nutrition plans in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        temperature: 0.7,
        maxTokens: 3000,
        timeout: 120000, // 2 minutes for complex generations
        userId: coachId,
        context: {
          feature: 'ai_program_generation',
          action: 'generate_nutrition_plan',
          requestId,
        },
      }
    );

    const nutritionData = openaiService.parseJSONCompletion(completion.content);

    const aiMetadata = {
      model: completion.model || 'gpt-4',
      tokensUsed: completion.usage,
      estimatedCost: completion.estimatedCost,
      aiRequestId: completion.aiRequestId,
    };

    return {
      name: nutritionData.name,
      description: nutritionData.description,
      dailyTargets: nutritionData.dailyTargets,
      meals: nutritionData.meals,
      reasoning: nutritionData.reasoning,
      aiMetadata,
    };
  }

  /**
   * Build workout program generation prompt
   */
  _buildWorkoutPrompt(clientProfile, options) {
    const duration = options.duration || 12;
    const goals = options.goals || clientProfile.fitnessProfile.goals;
    const experienceLevel = clientProfile.fitnessProfile.experienceLevel;
    const equipment = clientProfile.equipment;
    const schedule = clientProfile.schedule;
    const medicalInfo = clientProfile.medicalInfo;

    return `Generate a ${duration}-week personalized workout program for a client with the following profile:

CLIENT PROFILE:
- Experience Level: ${experienceLevel}
- Primary Goals: ${goals.join(', ')}
- Available Days: ${schedule.availableDays?.join(', ') || 'Not specified'}
- Sessions Per Week: ${schedule.sessionsPerWeek || 4}
- Session Duration: ${schedule.sessionDuration || 60} minutes
- Equipment: ${equipment.hasGymAccess ? 'Full gym access' : 'Home equipment: ' + equipment.homeEquipment?.join(', ')}

MEDICAL CONSIDERATIONS:
${medicalInfo.injuries?.length > 0 ? '- Injuries: ' + JSON.stringify(medicalInfo.injuries) : '- No reported injuries'}
${medicalInfo.limitations?.length > 0 ? '- Limitations: ' + JSON.stringify(medicalInfo.limitations) : '- No limitations'}

ADDITIONAL REQUIREMENTS:
${options.additionalRequirements || 'None'}

Please generate a comprehensive workout program in the following JSON format:
{
  "name": "Program name",
  "description": "Brief description",
  "duration": {
    "weeks": ${duration},
    "workoutsPerWeek": ${schedule.sessionsPerWeek || 4}
  },
  "workouts": [
    {
      "name": "Workout name",
      "type": "strength|cardio|hiit|mixed",
      "difficulty": "beginner|intermediate|advanced",
      "duration": 60,
      "description": "Workout description",
      "exercises": [
        {
          "exerciseId": "unique_id",
          "name": "Exercise name",
          "sets": 3,
          "reps": "8-12",
          "restTime": 60,
          "notes": "Form cues and tips",
          "order": 1
        }
      ],
      "targetMuscles": ["chest", "triceps"],
      "equipment": ["barbell", "bench"]
    }
  ],
  "reasoning": "Explain why this program is designed this way for this client",
  "progressionEngine": {
    "rpeTargets": {
      "enabled": true,
      "weeklyTargets": [
        {
          "week": 1,
          "targetRPE": 7,
          "notes": "Start conservative to establish baseline"
        }
      ],
      "exerciseSpecificTargets": [
        {
          "exerciseId": "unique_id",
          "targetRPE": 8,
          "adjustmentRules": "Reduce weight if RPE exceeds 9, increase if below 7"
        }
      ]
    },
    "progressionRules": {
      "strategy": "linear|wave|double_progression|percentage_based|autoregulated",
      "weightIncrement": 2.5,
      "repRangeProgression": {
        "minReps": 8,
        "maxReps": 12,
        "incrementWhen": "Complete all sets at maxReps with RPE < 9"
      },
      "weeklyLoad": [
        {
          "week": 1,
          "loadPercentage": 75,
          "volume": "medium"
        }
      ],
      "conditions": [
        {
          "metric": "rpe",
          "threshold": 9,
          "action": "maintain",
          "value": "current_weight"
        },
        {
          "metric": "completedSets",
          "threshold": "all_sets_completed",
          "action": "increase_weight",
          "value": 2.5
        }
      ],
      "customRules": "Specific progression logic for this client"
    },
    "deloadProtocol": {
      "enabled": true,
      "scheduledDeloads": [
        {
          "week": 4,
          "type": "volume_reduction",
          "reduction": 40,
          "notes": "Reduce volume by 40% to promote recovery"
        }
      ],
      "autoDeloadTriggers": [
        {
          "condition": "consecutive_failed_workouts",
          "threshold": 2,
          "protocol": "reduce_volume",
          "reductionPercentage": 30,
          "notes": "If 2 consecutive workouts are failed, reduce volume by 30%"
        },
        {
          "condition": "high_avg_rpe",
          "threshold": 9.5,
          "protocol": "schedule_next_week",
          "reductionPercentage": 40,
          "notes": "If average RPE exceeds 9.5, schedule deload for next week"
        }
      ],
      "recoveryIndicators": [
        {
          "metric": "sleep_quality",
          "target": "7+ hours",
          "weight": 0.4
        },
        {
          "metric": "soreness_level",
          "target": "moderate or less",
          "weight": 0.3
        },
        {
          "metric": "energy",
          "target": "good or excellent",
          "weight": 0.3
        }
      ]
    }
  }
}

Ensure the program:
1. Aligns with client's goals and experience level
2. Respects equipment availability
3. Accounts for any injuries or limitations
4. Includes progressive overload principles
5. Is balanced and sustainable

PROGRESSION ENGINE REQUIREMENTS:
- Set RPE targets for each week, starting conservative and building up
- Define clear progression rules based on performance (RPE, completed sets, form quality)
- Include scheduled deload weeks (typically every 4-6 weeks)
- Set up auto-deload triggers for fatigue management
- Customize progression strategy based on experience level:
  * Beginners: Linear progression, slower RPE progression, more frequent deloads
  * Intermediate: Wave/undulating progression, moderate RPE targets
  * Advanced: Autoregulated progression, higher RPE tolerance, strategic deloads
- Ensure progression rules are specific, measurable, and actionable`;
  }

  /**
   * Build nutrition plan generation prompt
   */
  _buildNutritionPrompt(clientProfile, options) {
    const duration = options.duration || 4;
    const goals = options.goals || clientProfile.fitnessProfile.goals;
    const nutritionPrefs = clientProfile.nutritionPreferences;
    const personalInfo = clientProfile.personalInfo;

    // Calculate TDEE and macro targets if not provided
    const tdee = this._calculateTDEE(personalInfo, clientProfile.fitnessProfile.activityLevel);
    const calorieTarget = nutritionPrefs.calorieTarget || this._adjustCaloriesForGoal(tdee, goals[0]);
    const macros = nutritionPrefs.macroTargets || this._calculateMacros(calorieTarget, goals[0]);

    return `Generate a ${duration}-week personalized nutrition plan for a client with the following profile:

CLIENT PROFILE:
- Primary Goals: ${goals.join(', ')}
- Target Calories: ${calorieTarget} kcal/day
- Target Macros: ${macros.protein}g protein, ${macros.carbs}g carbs, ${macros.fats}g fats
- Diet Type: ${nutritionPrefs.dietType || 'none'}
- Meals Per Day: ${nutritionPrefs.mealsPerDay || 3}
- Dietary Restrictions: ${nutritionPrefs.dietaryRestrictions?.join(', ') || 'None'}
- Food Allergies: ${nutritionPrefs.foodAllergies?.map(a => a.allergen).join(', ') || 'None'}
- Food Dislikes: ${nutritionPrefs.foodDislikes?.join(', ') || 'None'}

ADDITIONAL REQUIREMENTS:
${options.additionalRequirements || 'None'}

Please generate a comprehensive nutrition plan in the following JSON format:
{
  "name": "Plan name",
  "description": "Brief description",
  "dailyTargets": {
    "calories": ${calorieTarget},
    "protein": ${macros.protein},
    "carbs": ${macros.carbs},
    "fats": ${macros.fats},
    "fiber": 30,
    "water": 3
  },
  "meals": [
    {
      "name": "Meal name",
      "type": "breakfast|lunch|dinner|snack",
      "time": "08:00",
      "foods": [
        {
          "name": "Food item",
          "quantity": 100,
          "unit": "g",
          "calories": 200,
          "protein": 20,
          "carbs": 10,
          "fats": 10
        }
      ],
      "totalCalories": 500,
      "totalProtein": 30,
      "totalCarbs": 40,
      "totalFats": 20,
      "instructions": "Preparation instructions",
      "prepTime": 15
    }
  ],
  "reasoning": "Explain why this nutrition plan is designed this way for this client"
}

Ensure the plan:
1. Meets calorie and macro targets
2. Respects dietary restrictions and preferences
3. Is practical and sustainable
4. Includes variety and balanced nutrition
5. Supports the client's fitness goals`;
  }

  /**
   * Calculate TDEE (Total Daily Energy Expenditure)
   */
  _calculateTDEE(personalInfo, activityLevel) {
    const { weight, height, dateOfBirth, gender } = personalInfo;
    
    // Calculate age
    const age = dateOfBirth ? 
      Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
      30; // default age if not provided

    // Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9,
    };

    const multiplier = activityMultipliers[activityLevel] || 1.55;
    return Math.round(bmr * multiplier);
  }

  /**
   * Adjust calories based on goal
   */
  _adjustCaloriesForGoal(tdee, primaryGoal) {
    const adjustments = {
      weight_loss: -500, // 500 calorie deficit
      muscle_gain: 300, // 300 calorie surplus
      strength: 200,
      endurance: 0,
      general_fitness: 0,
      maintenance: 0,
    };

    return tdee + (adjustments[primaryGoal] || 0);
  }

  /**
   * Calculate macro targets based on goal
   */
  _calculateMacros(calories, primaryGoal) {
    // Macro splits (percentage of calories)
    const macroSplits = {
      weight_loss: { protein: 0.35, carbs: 0.35, fats: 0.30 },
      muscle_gain: { protein: 0.30, carbs: 0.45, fats: 0.25 },
      strength: { protein: 0.30, carbs: 0.40, fats: 0.30 },
      endurance: { protein: 0.20, carbs: 0.55, fats: 0.25 },
      general_fitness: { protein: 0.30, carbs: 0.40, fats: 0.30 },
    };

    const split = macroSplits[primaryGoal] || macroSplits.general_fitness;

    return {
      protein: Math.round((calories * split.protein) / 4), // 4 cal/g
      carbs: Math.round((calories * split.carbs) / 4),
      fats: Math.round((calories * split.fats) / 9), // 9 cal/g
    };
  }

  /**
   * Extract relevant client data for generation
   */
  _extractClientData(clientProfile) {
    return {
      personalInfo: clientProfile.personalInfo,
      fitnessProfile: clientProfile.fitnessProfile,
      medicalInfo: clientProfile.medicalInfo,
      schedule: clientProfile.schedule,
      equipment: clientProfile.equipment,
      preferences: clientProfile.preferences,
      nutritionPreferences: clientProfile.nutritionPreferences,
    };
  }

  /**
   * Generate program summary
   */
  _generateProgramSummary(workoutProgram, nutritionPlan) {
    return `This comprehensive program combines a ${workoutProgram.duration.weeks}-week workout plan with a personalized nutrition strategy. ${workoutProgram.description} ${nutritionPlan.description}`;
  }

  /**
   * Extract key recommendations
   */
  _extractRecommendations(workoutProgram, nutritionPlan) {
    const recommendations = [];
    
    if (workoutProgram.reasoning) {
      recommendations.push(`Workout: ${workoutProgram.reasoning.substring(0, 150)}...`);
    }
    
    if (nutritionPlan.reasoning) {
      recommendations.push(`Nutrition: ${nutritionPlan.reasoning.substring(0, 150)}...`);
    }

    return recommendations;
  }

  /**
   * Apply generated program to client
   */
  async applyGeneratedProgram(generatedProgramId, appliedBy) {
    const generatedProgram = await GeneratedProgram.findById(generatedProgramId);
    
    if (!generatedProgram) {
      throw new Error('Generated program not found');
    }

    if (generatedProgram.status !== 'approved' && generatedProgram.status !== 'generated') {
      throw new Error('Program must be approved before applying');
    }

    const { workoutProgram, nutritionPlan } = generatedProgram.generatedContent;

    // Create actual Program and MealPlan documents
    const createdProgram = workoutProgram ? await this._createProgram(
      generatedProgram.coachId,
      generatedProgram.clientId,
      workoutProgram
    ) : null;

    const createdMealPlan = nutritionPlan ? await this._createMealPlan(
      generatedProgram.coachId,
      generatedProgram.clientId,
      nutritionPlan
    ) : null;

    // Update generated program
    if (createdProgram) {
      generatedProgram.generatedContent.workoutProgram.programId = createdProgram._id;
    }
    if (createdMealPlan) {
      generatedProgram.generatedContent.nutritionPlan.mealPlanId = createdMealPlan._id;
    }

    generatedProgram.status = 'applied';
    generatedProgram.appliedAt = new Date();
    generatedProgram.appliedBy = appliedBy;

    await generatedProgram.save();

    return {
      generatedProgram,
      program: createdProgram,
      mealPlan: createdMealPlan,
    };
  }

  /**
   * Create actual Program document
   */
  async _createProgram(coachId, clientId, workoutProgramData) {
    const program = new Program({
      coachId,
      clientId,
      name: workoutProgramData.name,
      description: workoutProgramData.description,
      duration: workoutProgramData.duration,
      status: 'draft',
      tags: ['ai-generated'],
    });

    await program.save();

    // Create workouts
    const workoutIds = [];
    for (const workoutData of workoutProgramData.workouts) {
      const workout = new Workout({
        coachId,
        clientId,
        programId: program._id,
        name: workoutData.name,
        description: workoutData.description,
        type: workoutData.type,
        difficulty: workoutData.difficulty,
        duration: workoutData.duration,
        exercises: workoutData.exercises,
        targetMuscles: workoutData.targetMuscles,
        equipment: workoutData.equipment,
        status: 'draft',
      });

      await workout.save();
      workoutIds.push(workout._id);
    }

    program.workouts = workoutIds;
    program.progress.totalWorkouts = workoutIds.length;
    await program.save();

    return program;
  }

  /**
   * Create actual MealPlan document
   */
  async _createMealPlan(coachId, clientId, nutritionPlanData) {
    const mealPlan = new MealPlan({
      coachId,
      clientId,
      name: nutritionPlanData.name,
      description: nutritionPlanData.description,
      dailyTargets: nutritionPlanData.dailyTargets,
      meals: nutritionPlanData.meals,
      isActive: false, // Coach needs to activate it
      notes: 'AI-generated meal plan',
    });

    await mealPlan.save();
    return mealPlan;
  }

  /**
   * Get all generated programs for a coach
   */
  async getGeneratedPrograms(coachId, filters = {}) {
    const query = { coachId };

    if (filters.clientId) query.clientId = filters.clientId;
    if (filters.status) query.status = filters.status;
    if (filters.generationType) query.generationType = filters.generationType;

    return GeneratedProgram.find(query)
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50);
  }

  /**
   * Get single generated program
   */
  async getGeneratedProgram(generatedProgramId) {
    return GeneratedProgram.findById(generatedProgramId)
      .populate('clientId', 'name email')
      .populate('coachId', 'name email');
  }

  /**
   * Update generated program (for review, ratings, etc.)
   */
  async updateGeneratedProgram(generatedProgramId, updateData) {
    const generatedProgram = await GeneratedProgram.findById(generatedProgramId);
    
    if (!generatedProgram) {
      throw new Error('Generated program not found');
    }

    // Allow updating specific fields
    if (updateData.status) generatedProgram.status = updateData.status;
    if (updateData.reviewNotes) generatedProgram.reviewNotes = updateData.reviewNotes;
    if (updateData.reviewedBy) {
      generatedProgram.reviewedBy = updateData.reviewedBy;
      generatedProgram.reviewedAt = new Date();
    }
    if (updateData.quality) {
      generatedProgram.quality = { ...generatedProgram.quality, ...updateData.quality };
    }

    await generatedProgram.save();
    return generatedProgram;
  }
}

module.exports = new ProgramGeneratorService();

