/**
 * Meal Plan Generation & Versioning Demo
 * 
 * Demonstrates:
 * - AI-powered meal plan generation
 * - Integration with nutrition targets
 * - Meal plan versioning
 * - Meal plan editing and regeneration
 * - Version history and rollback
 */

require('dotenv').config();
const mongoose = require('mongoose');
const mealPlanGeneratorService = require('../src/modules/nutrition/services/mealPlanGenerator.service');
const mealPlanVersionService = require('../src/modules/nutrition/services/mealPlanVersion.service');
const nutritionTargetService = require('../src/modules/nutrition/services/nutritionTarget.service');
const MealPlan = require('../src/modules/nutrition/models/mealPlan.model');
const NutritionTarget = require('../src/modules/nutrition/models/nutritionTarget.model');
const ClientProfile = require('../src/modules/clients/models/clientProfile.model');
const User = require('../src/modules/auth/models/user.model');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

function section(title) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}\n`);
}

function subsection(title) {
  console.log(`\n${colors.bright}${colors.cyan}--- ${title} ---${colors.reset}\n`);
}

function success(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function info(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function highlight(label, value) {
  console.log(`${colors.bright}${label}:${colors.reset} ${value}`);
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  await User.deleteMany({ email: /meal-plan-demo-/i });
  await ClientProfile.deleteMany({});
  await NutritionTarget.deleteMany({});
  await MealPlan.deleteMany({});
  
  success('Test data cleaned up');
}

async function createTestUsers() {
  subsection('Creating Test Users');

  const coach = new User({
    email: 'meal-plan-demo-coach@test.com',
    password: 'password123',
    firstName: 'Emma',
    lastName: 'Rodriguez',
    role: 'coach',
    isEmailVerified: true,
  });
  await coach.save();
  success(`Coach created: ${coach.email}`);

  const client = new User({
    email: 'meal-plan-demo-client@test.com',
    password: 'password123',
    firstName: 'Mike',
    lastName: 'Thompson',
    role: 'client',
    isEmailVerified: true,
  });
  await client.save();
  success(`Client created: ${client.email}`);

  return { coach, client };
}

async function createClientProfile(userId) {
  subsection('Creating Client Profile');

  const profile = new ClientProfile({
    userId,
    personalInfo: {
      dateOfBirth: new Date('1988-03-20'),
      gender: 'male',
      weight: 85, // kg
      height: 180, // cm
      bodyFatPercentage: 22,
    },
    fitnessProfile: {
      experienceLevel: 'intermediate',
      goals: ['muscle_gain', 'strength'],
      primaryGoal: 'muscle_gain',
      targetWeight: 90,
      activityLevel: 'very_active',
      yearsOfTraining: 3,
    },
    nutritionPreferences: {
      dietType: 'flexible_dieting',
      dietaryRestrictions: [],
      foodAllergies: [
        { allergen: 'shellfish', severity: 'severe' },
      ],
      foodDislikes: ['liver', 'brussels sprouts'],
      mealsPerDay: 5,
    },
    status: 'active',
  });

  const savedProfile = await profile.save();
  success('Client profile created');
  highlight('  Weight', `${savedProfile.personalInfo.weight}kg`);
  highlight('  Goal', savedProfile.fitnessProfile.primaryGoal);
  highlight('  Activity Level', savedProfile.fitnessProfile.activityLevel);
  highlight('  Diet Type', savedProfile.nutritionPreferences.dietType);
  highlight('  Allergies', savedProfile.nutritionPreferences.foodAllergies.map(a => a.allergen).join(', '));

  return savedProfile;
}

async function createNutritionTarget(userId, coachId) {
  subsection('Creating Nutrition Target');

  const target = await nutritionTargetService.createNutritionTarget(
    userId,
    coachId,
    {
      activityLevel: 'very_active',
      goal: 'muscle_gain',
      targetRate: 0.3, // 0.3kg/week
      proteinGramsPerKg: 2.0,
      carbPreference: 'high',
      mealsPerDay: 5,
      enablePostWorkoutNutrition: true,
      notes: 'Muscle gain phase - moderate surplus',
    },
  );

  success(`Nutrition target created: ${target._id}`);
  highlight('  Calories', `${target.calorieTarget.value} kcal/day`);
  highlight('  Protein', `${target.macroTargets.protein.grams}g`);
  highlight('  Carbs', `${target.macroTargets.carbs.grams}g`);
  highlight('  Fats', `${target.macroTargets.fats.grams}g`);

  return target;
}

async function demo1_GenerateMealPlan(clientId, coachId) {
  section('DEMO 1: Generate AI-Powered Meal Plan from Nutrition Target');

  subsection('Generating 7-day meal plan with 5 meals per day');
  info('Using active nutrition target for calorie and macro goals');

  try {
    const mealPlan = await mealPlanGeneratorService.generateMealPlan(
      clientId,
    coachId,
    {
      duration: 7,
        mealsPerDay: 5,
        includeSnacks: true,
        useNutritionTarget: true,
      },
    );

    success(`Meal plan generated: ${mealPlan._id}`);
    
    subsection('Meal Plan Details');
    highlight('  Name', mealPlan.name);
    highlight('  Version', `v${mealPlan.version}`);
    highlight('  Duration', `${mealPlan.duration} days`);
    highlight('  Total Meals', `${mealPlan.meals.length} meals`);
    highlight('  Goal', mealPlan.goal);
    highlight('  Diet Type', mealPlan.dietType);
    
    subsection('Daily Targets');
    highlight('  Calories', `${mealPlan.dailyTargets.calories} kcal`);
    highlight('  Protein', `${mealPlan.dailyTargets.protein}g`);
    highlight('  Carbs', `${mealPlan.dailyTargets.carbs}g`);
    highlight('  Fats', `${mealPlan.dailyTargets.fats}g`);
    highlight('  Fiber', `${mealPlan.dailyTargets.fiber}g`);

    subsection('Sample Meals (Day 1)');
    const day1Meals = mealPlan.meals.slice(0, Math.min(3, mealPlan.meals.length));
    day1Meals.forEach((meal, index) => {
      console.log(`\n${colors.bright}${index + 1}. ${meal.name}${colors.reset}`);
      highlight('  Type', meal.type);
      highlight('  Time', meal.time || 'Flexible');
      highlight('  Calories', `${meal.totalCalories} kcal`);
      highlight('  Protein', `${meal.totalProtein}g`);
      highlight('  Carbs', `${meal.totalCarbs}g`);
      highlight('  Fats', `${meal.totalFats}g`);
      highlight('  Prep Time', `${meal.prepTime} minutes`);
      
      if (meal.foods && meal.foods.length > 0) {
        console.log(`  ${colors.cyan}Foods:${colors.reset}`);
        meal.foods.slice(0, 3).forEach(food => {
          console.log(`    - ${food.name}: ${food.quantity}${food.unit} (${food.calories} kcal, ${food.protein}g protein)`);
        });
        if (meal.foods.length > 3) {
          console.log(`    ... and ${meal.foods.length - 3} more`);
        }
      }
      
      if (meal.instructions) {
        info(`  Instructions: ${meal.instructions.substring(0, 100)}${meal.instructions.length > 100 ? '...' : ''}`);
      }
    });

    subsection('Validation');
    const validation = mealPlanGeneratorService.validateMealPlan(mealPlan, 0.10);
    
    if (validation.isValid) {
      success(validation.message);
    } else {
      warning(validation.message);
    }
    
    highlight('  Daily Totals - Calories', `${validation.dailyTotals.calories} kcal (${((validation.dailyTotals.calories / validation.targets.calories) * 100).toFixed(1)}% of target)`);
    highlight('  Daily Totals - Protein', `${validation.dailyTotals.protein}g (${((validation.dailyTotals.protein / validation.targets.protein) * 100).toFixed(1)}% of target)`);
    highlight('  Daily Totals - Carbs', `${validation.dailyTotals.carbs}g (${((validation.dailyTotals.carbs / validation.targets.carbs) * 100).toFixed(1)}% of target)`);
    highlight('  Daily Totals - Fats', `${validation.dailyTotals.fats}g (${((validation.dailyTotals.fats / validation.targets.fats) * 100).toFixed(1)}% of target)`);

    subsection('Versioning Info');
    highlight('  Version', mealPlan.version);
    highlight('  Is Current Version', mealPlan.isCurrentVersion ? 'Yes' : 'No');
    highlight('  Active Version ID', mealPlan.activeVersionId);
    highlight('  Parent Plan ID', mealPlan.parentPlanId || 'None (root version)');

    return mealPlan;
  } catch (error) {
    console.error(`${colors.red}✗ Error generating meal plan: ${error.message}${colors.reset}`);
    warning('Using fallback meal plan generation');
    
    // Create fallback meal plan manually
    const fallbackPlan = await createFallbackMealPlan(clientId, coachId);
    return fallbackPlan;
  }
}

async function createFallbackMealPlan(clientId, coachId) {
  const nutritionTarget = await NutritionTarget.findOne({
    userId: clientId,
    isActive: true,
  });

  const targets = {
    calories: nutritionTarget.calorieTarget.value,
    protein: nutritionTarget.macroTargets.protein.grams,
    carbs: nutritionTarget.macroTargets.carbs.grams,
    fats: nutritionTarget.macroTargets.fats.grams,
    fiber: 35,
    water: 3.5,
  };

  const mealPlan = new MealPlan({
    coachId,
    clientId,
    name: 'Muscle Gain Meal Plan',
    description: 'Template 7-day meal plan for muscle gain',
    goal: 'muscle_gain',
    version: 1,
    dailyTargets: targets,
    dietType: 'none',
    meals: [
      {
        name: 'Breakfast - Protein Oatmeal Bowl',
      type: 'breakfast',
      time: '7:00 AM',
      foods: [
          { name: 'Oats', quantity: 80, unit: 'g', calories: 300, protein: 10, carbs: 55, fats: 5 },
          { name: 'Protein powder', quantity: 40, unit: 'g', calories: 160, protein: 32, carbs: 4, fats: 2 },
          { name: 'Banana', quantity: 120, unit: 'g', calories: 107, protein: 1, carbs: 27, fats: 0 },
          { name: 'Almond butter', quantity: 15, unit: 'g', calories: 98, protein: 3, carbs: 3, fats: 9 },
        ],
        totalCalories: 665,
        totalProtein: 46,
        totalCarbs: 89,
      totalFats: 16,
        instructions: 'Cook oats with water or milk, mix in protein powder, top with sliced banana and almond butter',
        prepTime: 10,
    },
    {
        name: 'Mid-Morning Snack - Greek Yogurt & Nuts',
      type: 'snack',
        time: '10:00 AM',
      foods: [
          { name: 'Greek yogurt', quantity: 200, unit: 'g', calories: 130, protein: 20, carbs: 9, fats: 0 },
          { name: 'Mixed nuts', quantity: 30, unit: 'g', calories: 175, protein: 5, carbs: 6, fats: 15 },
          { name: 'Berries', quantity: 100, unit: 'g', calories: 57, protein: 1, carbs: 14, fats: 0 },
        ],
        totalCalories: 362,
      totalProtein: 26,
        totalCarbs: 29,
        totalFats: 15,
        instructions: 'Mix yogurt with berries, top with nuts',
      prepTime: 3,
    },
    {
        name: 'Lunch - Chicken & Rice Power Bowl',
        type: 'lunch',
        time: '1:00 PM',
      foods: [
          { name: 'Chicken breast', quantity: 200, unit: 'g', calories: 330, protein: 62, carbs: 0, fats: 7 },
          { name: 'Brown rice', quantity: 100, unit: 'g', calories: 350, protein: 8, carbs: 73, fats: 3 },
          { name: 'Mixed vegetables', quantity: 150, unit: 'g', calories: 75, protein: 3, carbs: 15, fats: 1 },
          { name: 'Olive oil', quantity: 10, unit: 'ml', calories: 88, protein: 0, carbs: 0, fats: 10 },
        ],
        totalCalories: 843,
        totalProtein: 73,
        totalCarbs: 88,
        totalFats: 21,
        instructions: 'Grill or bake chicken, cook rice, sauté vegetables in olive oil, combine',
        prepTime: 30,
      },
      {
        name: 'Pre-Workout Snack',
        type: 'snack',
        time: '4:30 PM',
        foods: [
          { name: 'Rice cakes', quantity: 25, unit: 'g', calories: 98, protein: 2, carbs: 21, fats: 0 },
          { name: 'Peanut butter', quantity: 20, unit: 'g', calories: 118, protein: 5, carbs: 4, fats: 10 },
          { name: 'Apple', quantity: 150, unit: 'g', calories: 78, protein: 0, carbs: 21, fats: 0 },
        ],
        totalCalories: 294,
        totalProtein: 7,
        totalCarbs: 46,
        totalFats: 10,
        instructions: 'Spread peanut butter on rice cakes, eat with apple slices',
        prepTime: 5,
      },
      {
        name: 'Dinner - Salmon & Sweet Potato',
        type: 'dinner',
        time: '7:30 PM',
        foods: [
          { name: 'Salmon fillet', quantity: 180, unit: 'g', calories: 373, protein: 41, carbs: 0, fats: 22 },
          { name: 'Sweet potato', quantity: 250, unit: 'g', calories: 215, protein: 4, carbs: 50, fats: 0 },
          { name: 'Broccoli', quantity: 150, unit: 'g', calories: 51, protein: 4, carbs: 10, fats: 1 },
          { name: 'Avocado', quantity: 50, unit: 'g', calories: 80, protein: 1, carbs: 4, fats: 7 },
        ],
        totalCalories: 719,
        totalProtein: 50,
        totalCarbs: 64,
        totalFats: 30,
        instructions: 'Bake salmon and sweet potato at 400°F for 20 minutes, steam broccoli, slice avocado',
        prepTime: 25,
      },
    ],
    dietType: 'none',
    restrictions: [],
    startDate: new Date(),
    duration: 7,
    isTemplate: false,
    isActive: true,
    isCurrentVersion: true,
    notes: 'Fallback template meal plan',
    tags: ['template', 'muscle_gain'],
  });

  mealPlan.activeVersionId = mealPlan._id;
  await mealPlan.save();
  
  success('Fallback meal plan created');
  return mealPlan;
}

async function demo2_EditMealPlan(planId, coachId) {
  section('DEMO 2: Edit Meal Plan (Creates New Version)');

  subsection('Scenario: Client requested vegetarian options for breakfast');
  info('Editing breakfast meals to be vegetarian-friendly');

  const updates = {
    meals: [
      {
        name: 'Breakfast - Tofu Scramble',
        type: 'breakfast',
        time: '7:00 AM',
        foods: [
          { name: 'Firm tofu', quantity: 150, unit: 'g', calories: 144, protein: 17, carbs: 3, fats: 8 },
          { name: 'Spinach', quantity: 100, unit: 'g', calories: 23, protein: 3, carbs: 4, fats: 0 },
          { name: 'Whole wheat toast', quantity: 60, unit: 'g', calories: 160, protein: 6, carbs: 30, fats: 2 },
          { name: 'Avocado', quantity: 50, unit: 'g', calories: 80, protein: 1, carbs: 4, fats: 7 },
        ],
        totalCalories: 407,
        totalProtein: 27,
        totalCarbs: 41,
        totalFats: 17,
        instructions: 'Crumble and sauté tofu with spinach, serve with toast and avocado',
        prepTime: 15,
      },
    ],
  };

  const newVersion = await mealPlanGeneratorService.editMealPlan(
    planId,
    updates,
    'Changed breakfast to vegetarian options per client request',
    coachId,
  );

  success(`New version created: ${newVersion._id}`);
  highlight('  Version Number', `v${newVersion.version}`);
  highlight('  Version Notes', newVersion.versionNotes);
  highlight('  Is Current Version', newVersion.isCurrentVersion ? 'Yes' : 'No');
  highlight('  Parent Plan ID', newVersion.parentPlanId);

  subsection('Updated Meal');
  const updatedMeal = newVersion.meals[0];
  console.log(`${colors.bright}${updatedMeal.name}${colors.reset}`);
  highlight('  Calories', `${updatedMeal.totalCalories} kcal`);
  highlight('  Protein', `${updatedMeal.totalProtein}g`);
  
  return newVersion;
}

async function demo3_ViewVersionHistory(planId) {
  section('DEMO 3: View Version History');

  const history = await mealPlanVersionService.getVersionHistory(planId);

  success(`Found ${history.length} versions`);

  subsection('Version Timeline');
  history.forEach((version, index) => {
    const isActive = version.isCurrentVersion;
    const marker = isActive ? `${colors.green}[ACTIVE]${colors.reset}` : '        ';
    
    console.log(`\n${marker} ${colors.bright}Version ${version.version}${colors.reset}`);
    highlight('  ID', version._id);
    highlight('  Created', version.createdAt.toLocaleString());
    highlight('  Notes', version.versionNotes || 'Initial version');
    highlight('  Meals', version.meals.length);
    
    if (version.version > 1) {
      info(`  Changed from: Version ${version.version - 1}`);
    }
  });

  return history;
}

async function demo4_RollbackVersion(planId, targetVersion) {
  section('DEMO 4: Rollback to Previous Version');

  subsection(`Rolling back to version ${targetVersion}`);
  info('This makes the specified version active again');

  const versions = await mealPlanVersionService.getVersionHistory(planId);
  const targetVersionDoc = versions.find(v => v.version === targetVersion);

  if (!targetVersionDoc) {
    warning(`Version ${targetVersion} not found`);
    return null;
  }

  const rolledBackPlan = await mealPlanVersionService.rollbackToVersion(targetVersionDoc._id);

  success(`Rolled back to version ${targetVersion}`);
  highlight('  Active Version ID', rolledBackPlan._id);
  highlight('  Version Number', `v${rolledBackPlan.version}`);
  highlight('  Is Current Version', rolledBackPlan.isCurrentVersion ? 'Yes' : 'No');
  highlight('  Meals', rolledBackPlan.meals.length);

  subsection('Version Status After Rollback');
  const updatedHistory = await mealPlanVersionService.getVersionHistory(planId);
  updatedHistory.forEach(v => {
    const status = v.isCurrentVersion ? `${colors.green}[ACTIVE]${colors.reset}` : '        ';
    console.log(`${status} Version ${v.version}: ${v._id}`);
  });

  return rolledBackPlan;
}

async function demo5_RegenerateMealPlan(planId, coachId) {
  section('DEMO 5: Regenerate Meal Plan with Adjustments');

  subsection('Scenario: Client needs higher calories');
  info('Regenerating meal plan with +200 calories');

  const originalPlan = await MealPlan.findById(planId);
  
  const adjustments = {
    targets: {
      calories: originalPlan.dailyTargets.calories + 200,
      protein: originalPlan.dailyTargets.protein + 10,
      carbs: originalPlan.dailyTargets.carbs + 35,
      fats: originalPlan.dailyTargets.fats + 5,
      fiber: originalPlan.dailyTargets.fiber,
      water: originalPlan.dailyTargets.water,
    },
    duration: 7,
  };

  const regeneratedPlan = await mealPlanGeneratorService.regenerateMealPlan(
    planId,
    adjustments,
    'Regenerated with +200 calories for bulking phase',
    coachId,
  );

  success(`Regenerated meal plan: ${regeneratedPlan._id}`);
  highlight('  Version', `v${regeneratedPlan.version}`);
  
  subsection('Target Comparison');
  console.log(`${colors.bright}Original Targets:${colors.reset}`);
  highlight('  Calories', `${originalPlan.dailyTargets.calories} kcal`);
  highlight('  Protein', `${originalPlan.dailyTargets.protein}g`);
  highlight('  Carbs', `${originalPlan.dailyTargets.carbs}g`);
  highlight('  Fats', `${originalPlan.dailyTargets.fats}g`);
  
  console.log(`\n${colors.bright}New Targets:${colors.reset}`);
  highlight('  Calories', `${regeneratedPlan.dailyTargets.calories} kcal (+${regeneratedPlan.dailyTargets.calories - originalPlan.dailyTargets.calories})`);
  highlight('  Protein', `${regeneratedPlan.dailyTargets.protein}g (+${regeneratedPlan.dailyTargets.protein - originalPlan.dailyTargets.protein})`);
  highlight('  Carbs', `${regeneratedPlan.dailyTargets.carbs}g (+${regeneratedPlan.dailyTargets.carbs - originalPlan.dailyTargets.carbs})`);
  highlight('  Fats', `${regeneratedPlan.dailyTargets.fats}g (+${regeneratedPlan.dailyTargets.fats - originalPlan.dailyTargets.fats})`);

  return regeneratedPlan;
}

async function runDemo() {
  try {
    console.log(`\n${colors.bright}${colors.magenta}`);
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║          MEAL PLAN GENERATION & VERSIONING DEMO                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    // Connect to database
    info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coachflow');
    success('Connected to database');

    // Cleanup
    await cleanupTestData();

    // Setup
    section('SETUP: Creating Test Environment');
    const { coach, client } = await createTestUsers();
    const clientProfile = await createClientProfile(client._id);
    const nutritionTarget = await createNutritionTarget(client._id, coach._id);

    // Demo 1: Generate meal plan
    const mealPlan = await demo1_GenerateMealPlan(client._id, coach._id);

    // Demo 2: Edit meal plan (creates new version)
    const editedPlan = await demo2_EditMealPlan(mealPlan._id, coach._id);

    // Demo 3: View version history
    await demo3_ViewVersionHistory(mealPlan._id);

    // Demo 4: Rollback to previous version
    await demo4_RollbackVersion(mealPlan._id, 1);

    // Demo 5: Regenerate with adjustments
    await demo5_RegenerateMealPlan(mealPlan._id, coach._id);

    // Final version history
    section('FINAL VERSION HISTORY');
    const finalHistory = await mealPlanVersionService.getVersionHistory(mealPlan._id);
    success(`Total versions created: ${finalHistory.length}`);
    
    finalHistory.forEach(v => {
      const status = v.isCurrentVersion ? `${colors.green}[ACTIVE]${colors.reset}` : '';
      console.log(`  ${status} v${v.version}: ${v.versionNotes || 'Initial version'} (${v.createdAt.toLocaleDateString()})`);
    });

    // Summary
    section('DEMO COMPLETE - SUMMARY');
    
    console.log(`${colors.bright}${colors.green}✓ All meal plan generation & versioning features demonstrated!${colors.reset}\n`);
    
    console.log(`${colors.bright}Key Features Demonstrated:${colors.reset}`);
    console.log('  ✓ AI-powered meal plan generation from nutrition targets');
    console.log('  ✓ Automatic integration with active nutrition targets');
    console.log('  ✓ Meal plan versioning with activeVersionId pointer pattern');
    console.log('  ✓ Edit meal plan (creates new version)');
    console.log('  ✓ Version history tracking');
    console.log('  ✓ Rollback to previous versions');
    console.log('  ✓ Regenerate meal plan with adjusted targets');
    console.log('  ✓ Meal plan validation against nutrition targets');
    console.log('  ✓ Fallback meal plan generation');
    
    console.log(`\n${colors.bright}${colors.cyan}Versioning Architecture:${colors.reset}`);
    console.log('  • Root meal plan has no parentPlanId');
    console.log('  • Child versions reference root via parentPlanId');
    console.log('  • All versions point to active version via activeVersionId');
    console.log('  • Only one version marked as isCurrentVersion = true');
    console.log('  • Complete version history preserved');
    
    console.log(`\n${colors.bright}${colors.yellow}Test Data:${colors.reset}`);
    console.log(`  Coach: ${coach.email}`);
    console.log(`  Client: ${client.email}`);
    console.log(`  Meal Plan Root ID: ${mealPlan._id}`);
    console.log(`  Total Versions: ${finalHistory.length}`);
    console.log(`  Active Version: v${finalHistory.find(v => v.isCurrentVersion).version}`);

  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}Error:${colors.reset}`, error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    info('\nDatabase connection closed');
  }
}

// Run the demo
runDemo();
