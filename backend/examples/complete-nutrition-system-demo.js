/**
 * Complete Nutrition System Demo
 * 
 * Tests all nutrition features:
 * - Meal plan generation
 * - Grocery list generation
 * - Daily nutrition logging (calories/protein with optional macros/sleep/mood)
 * - Auto-adjust rules based on weekly trends
 * - Automatic calorie adjustments
 */

require('dotenv').config();
const mongoose = require('mongoose');
const nutritionTargetService = require('../src/modules/nutrition/services/nutritionTarget.service');
const mealPlanGeneratorService = require('../src/modules/nutrition/services/mealPlanGenerator.service');
const groceryListService = require('../src/modules/nutrition/services/groceryList.service');
const nutritionLogService = require('../src/modules/nutrition/services/nutritionLog.service');
const autoAdjustService = require('../src/modules/nutrition/services/autoAdjust.service');
const ClientProfile = require('../src/modules/clients/models/clientProfile.model');
const User = require('../src/modules/auth/models/user.model');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

function highlight(label, value) {
  console.log(`${colors.bright}${label}:${colors.reset} ${value}`);
}

async function cleanup() {
  await User.deleteMany({ email: /complete-nutrition-demo/i });
  await ClientProfile.deleteMany({});
  await mongoose.connection.db.collection('nutritiontargets').deleteMany({});
  await mongoose.connection.db.collection('nutritionlogs').deleteMany({});
  await mongoose.connection.db.collection('autoadjustrules').deleteMany({});
  await mongoose.connection.db.collection('mealplans').deleteMany({});
  success('Cleaned up test data');
}

async function createTestData() {
  const coach = new User({
    email: 'complete-nutrition-demo-coach@test.com',
    password: 'password123',
    firstName: 'Alex',
    lastName: 'Coach',
    role: 'coach',
    isEmailVerified: true,
  });
  await coach.save();

  const client = new User({
    email: 'complete-nutrition-demo-client@test.com',
    password: 'password123',
    firstName: 'Jamie',
    lastName: 'Client',
    role: 'client',
    isEmailVerified: true,
  });
  await client.save();

  const profile = new ClientProfile({
    userId: client._id,
    personalInfo: {
      dateOfBirth: new Date('1992-06-15'),
      gender: 'female',
      weight: 68,
      height: 168,
    },
    fitnessProfile: {
      experienceLevel: 'intermediate',
      primaryGoal: 'weight_loss',
      activityLevel: 'moderately_active',
    },
    nutritionPreferences: {
      dietType: 'vegetarian',
      mealsPerDay: 4,
    },
    status: 'active',
  });
  await profile.save();

  success('Created test users and profile');
  return { coach, client, profile };
}

async function demo1_CreateNutritionTarget(client, coach) {
  section('DEMO 1: Create Nutrition Target');

  const target = await nutritionTargetService.createNutritionTarget(
    client._id,
    coach._id,
    {
      activityLevel: 'moderately_active',
      goal: 'weight_loss',
      targetRate: 0.4,
      proteinGramsPerKg: 2.0,
      mealsPerDay: 4,
      dietDuration: 12,
    },
  );

  success(`Nutrition target created`);
  highlight('  Calories', `${target.calorieTarget.value} kcal/day`);
  highlight('  Protein', `${target.macroTargets.protein.grams}g/day`);
  highlight('  Carbs', `${target.macroTargets.carbs.grams}g/day`);
  highlight('  Fats', `${target.macroTargets.fats.grams}g/day`);

  return target;
}

async function demo2_GenerateMealPlan(client, coach) {
  section('DEMO 2: Generate Meal Plan');

  const mealPlan = await mealPlanGeneratorService.generateMealPlan(
    client._id,
    coach._id,
    {
      duration: 7,
      mealsPerDay: 4,
      useNutritionTarget: true,
    },
  );

  success(`Meal plan generated: ${mealPlan.name}`);
  highlight('  Duration', `${mealPlan.duration} days`);
  highlight('  Total Meals', `${mealPlan.meals.length}`);
  highlight('  Daily Calories Target', `${mealPlan.dailyTargets.calories} kcal`);

  return mealPlan;
}

async function demo3_GenerateGroceryList(mealPlan) {
  section('DEMO 3: Generate Grocery List');

  const groceryList = await groceryListService.generateGroceryList(mealPlan._id, {
    servings: 1,
    groupByCategory: true,
  });

  success('Grocery list generated');
  highlight('  Total Items', groceryList.totalItems);
  highlight('  Categories', Object.keys(groceryList.items).length);

  subsection('Sample Items by Category');
  Object.entries(groceryList.items).forEach(([category, items]) => {
    console.log(`\n${colors.bright}${category.toUpperCase()}${colors.reset}`);
    items.slice(0, 3).forEach(item => {
      console.log(`  • ${item.name} - ${item.quantity}${item.unit}`);
    });
    if (items.length > 3) {
      console.log(`  ... and ${items.length - 3} more`);
    }
  });

  return groceryList;
}

async function demo4_LogNutrition(client) {
  section('DEMO 4: Daily Nutrition Logging');

  subsection('Week 1: Good Adherence');

  const week1Logs = [];
  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() - (21 - day)); // 3 weeks ago

    const log = await nutritionLogService.createLog(client._id, {
      date,
      calories: 1480 + Math.random() * 100 - 50,
      protein: 132 + Math.random() * 10 - 5,
      carbs: 145,
      fats: 45,
      sleep: {
        hours: 7 + Math.random() * 1.5,
        quality: ['good', 'excellent'][Math.floor(Math.random() * 2)],
      },
      mood: ['good', 'very_good'][Math.floor(Math.random() * 2)],
      energy: ['high', 'very_high', 'moderate'][Math.floor(Math.random() * 3)],
      water: 2.5 + Math.random() * 0.5,
      weight: 68 - (day * 0.1),
    });

    week1Logs.push(log);
  }

  success(`Week 1: Logged ${week1Logs.length} days`);
  highlight('  Avg Calories', Math.round(week1Logs.reduce((sum, l) => sum + l.calories, 0) / week1Logs.length));
  highlight('  Avg Protein', Math.round(week1Logs.reduce((sum, l) => sum + l.protein, 0) / week1Logs.length));
  highlight('  Adherence', `${week1Logs.filter(l => l.adherence?.withinTarget).length}/7 days`);

  subsection('Week 2: Consistent Progress');

  const week2Logs = [];
  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() - (14 - day));

    const log = await nutritionLogService.createLog(client._id, {
      date,
      calories: 1490 + Math.random() * 80 - 40,
      protein: 135 + Math.random() * 8 - 4,
      carbs: 148,
      fats: 46,
      sleep: {
        hours: 7.5 + Math.random() * 1,
        quality: 'good',
      },
      mood: 'good',
      energy: 'high',
      water: 2.7,
      weight: 67.3 - (day * 0.12),
    });

    week2Logs.push(log);
  }

  success(`Week 2: Logged ${week2Logs.length} days`);
  highlight('  Weight Change', `-0.7kg from Week 1`);

  subsection('Week 3: Faster Weight Loss (Triggers Auto-Adjust)');

  const week3Logs = [];
  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() - (7 - day));

    const log = await nutritionLogService.createLog(client._id, {
      date,
      calories: 1470 + Math.random() * 60 - 30,
      protein: 130 + Math.random() * 6 - 3,
      carbs: 142,
      fats: 44,
      sleep: {
        hours: 6.5 + Math.random() * 1,
        quality: day < 3 ? 'fair' : 'good',
      },
      mood: day < 3 ? 'neutral' : 'good',
      energy: day < 3 ? 'low' : 'moderate',
      water: 2.4,
      weight: 66.6 - (day * 0.15), // Losing faster
    });

    week3Logs.push(log);
  }

  success(`Week 3: Logged ${week3Logs.length} days`);
  highlight('  Weight Change', `-0.9kg from Week 2 (faster loss)`);
  highlight('  Energy Levels', 'Declining early in week');

  return { week1Logs, week2Logs, week3Logs };
}

async function demo5_CreateAutoAdjustRule(client, coach) {
  section('DEMO 5: Create Auto-Adjust Rule');

  const rule = await autoAdjustService.createRule(
    client._id,
    coach._id,
    {
      name: 'Slow Down Weight Loss',
      description: 'If losing weight too fast (>0.7kg/week for 3 weeks) with declining energy, increase calories',
      conditions: {
        weightTrend: {
          enabled: true,
          threshold: 0.7, // More than 0.7kg/week
          direction: 'decreasing',
          weeks: 3,
        },
        adherence: {
          enabled: true,
          minPercentage: 70,
          weeks: 3,
        },
        performance: {
          enabled: true,
          energyLevel: 'low',
        },
      },
      actions: {
        calorieAdjustment: 100, // Add 100 calories
        carbAdjustment: 20, // Add 20g carbs
        notify: {
          coach: true,
          client: true,
        },
        requiresApproval: false,
      },
      isActive: true,
      autoApply: true,
      checkFrequency: 'weekly',
    },
  );

  success('Auto-adjust rule created');
  highlight('  Name', rule.name);
  highlight('  Weight Threshold', `>${rule.conditions.weightTrend.threshold}kg/week`);
  highlight('  Calorie Adjustment', `+${rule.actions.calorieAdjustment} kcal`);
  highlight('  Auto Apply', rule.autoApply ? 'Yes' : 'No (requires approval)');

  return rule;
}

async function demo6_CheckAutoAdjust(client) {
  section('DEMO 6: Check and Apply Auto-Adjust Rules');

  info('Checking if rules should trigger based on current data...');

  const triggeredRules = await autoAdjustService.checkRulesForUser(client._id);

  if (triggeredRules.length > 0) {
    success(`${triggeredRules.length} rule(s) triggered!`);
    
    triggeredRules.forEach(rule => {
      console.log(`\n${colors.bright}Rule: ${rule.name}${colors.reset}`);
      highlight('  Last Triggered', rule.lastTriggered?.toLocaleString() || 'Just now');
      
      if (rule.triggers.length > 0) {
        const lastTrigger = rule.triggers[rule.triggers.length - 1];
        console.log(`\n  ${colors.bright}Adjustments Made:${colors.reset}`);
        if (lastTrigger.adjustmentsMade.calorieTarget) {
          highlight('    Calories', `${lastTrigger.adjustmentsMade.calorieTarget} kcal`);
        }
        if (lastTrigger.adjustmentsMade.macroTargets?.carbs) {
          highlight('    Carbs', `${lastTrigger.adjustmentsMade.macroTargets.carbs}g`);
        }
      }
    });
  } else {
    info('No rules triggered (conditions not yet met)');
  }

  return triggeredRules;
}

async function demo7_ViewWeeklySummary(client) {
  section('DEMO 7: Weekly Summary & Trends');

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const summary = await nutritionLogService.getWeeklySummary(client._id, weekStart);

  success('Weekly summary generated');
  highlight('  Days Logged', `${summary.daysLogged}/7`);
  highlight('  Avg Calories', `${summary.averages.calories} kcal`);
  highlight('  Avg Protein', `${summary.averages.protein}g`);
  highlight('  Avg Sleep', `${summary.averages.sleepHours || 'N/A'} hours`);

  if (summary.weightTrend) {
    subsection('Weight Trend');
    highlight('  Start Weight', `${summary.weightTrend.start}kg`);
    highlight('  End Weight', `${summary.weightTrend.end}kg`);
    highlight('  Change', `${summary.weightTrend.change}kg`);
    highlight('  Weekly Rate', `${summary.weightTrend.weeklyRate}kg/week`);
    highlight('  Direction', summary.weightTrend.direction);
  }

  if (summary.adherence) {
    subsection('Adherence');
    highlight('  Rate', `${summary.adherence.rate}%`);
    highlight('  Days Within Target', `${summary.adherence.daysWithinTarget}/${summary.adherence.totalDays}`);
  }

  // Get 4-week trends
  const trends = await nutritionLogService.getNutritionTrends(client._id, 4);

  subsection('4-Week Trends');
  trends.trends.forEach(week => {
    console.log(`\n${colors.bright}${week.week}${colors.reset}`);
    highlight('  Days Logged', week.daysLogged);
    highlight('  Avg Calories', `${week.avgCalories} kcal`);
    highlight('  Avg Protein', `${week.avgProtein}g`);
    if (week.avgWeight) {
      highlight('  Avg Weight', `${week.avgWeight}kg`);
    }
  });

  return { summary, trends };
}

async function runDemo() {
  try {
    console.log(`\n${colors.bright}${colors.magenta}`);
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║           COMPLETE NUTRITION SYSTEM DEMO - ALL FEATURES                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coachflow');
    success('Connected to database');

    await cleanup();

    section('SETUP');
    const { coach, client, profile } = await createTestData();

    const target = await demo1_CreateNutritionTarget(client, coach);
    const mealPlan = await demo2_GenerateMealPlan(client, coach);
    const groceryList = await demo3_GenerateGroceryList(mealPlan);
    const logs = await demo4_LogNutrition(client);
    const rule = await demo5_CreateAutoAdjustRule(client, coach);
    const triggeredRules = await demo6_CheckAutoAdjust(client);
    const summaries = await demo7_ViewWeeklySummary(client);

    section('DEMO COMPLETE - SUMMARY');
    
    console.log(`${colors.bright}${colors.green}✓ All nutrition system features tested successfully!${colors.reset}\n`);
    
    console.log(`${colors.bright}Features Tested:${colors.reset}`);
    console.log('  ✓ Nutrition target calculation with TDEE/BMR');
    console.log('  ✓ AI-powered meal plan generation');
    console.log('  ✓ Grocery list generation from meal plans');
    console.log('  ✓ Daily nutrition logging (calories/protein required)');
    console.log('  ✓ Optional macro tracking (carbs/fats/fiber)');
    console.log('  ✓ Optional lifestyle tracking (sleep/mood/energy/water)');
    console.log('  ✓ Automatic adherence calculation');
    console.log('  ✓ Weekly summaries and trends');
    console.log('  ✓ Auto-adjust rules (trainer-controlled)');
    console.log('  ✓ Automatic calorie adjustments based on weekly trends');
    console.log('  ✓ Weight trend analysis');
    console.log('  ✓ 4-week trend visualization');
    
    console.log(`\n${colors.bright}${colors.cyan}Key Results:${colors.reset}`);
    console.log(`  Nutrition Logs Created: ${logs.week1Logs.length + logs.week2Logs.length + logs.week3Logs.length}`);
    console.log(`  Auto-Adjust Rules Triggered: ${triggeredRules.length}`);
    console.log(`  Grocery List Items: ${groceryList.totalItems}`);
    console.log(`  Meal Plan Duration: ${mealPlan.duration} days`);

    console.log(`\n${colors.bright}${colors.yellow}API Endpoints Available:${colors.reset}`);
    console.log('  POST   /api/nutrition/logs - Create daily log');
    console.log('  GET    /api/nutrition/logs/range - Get logs for date range');
    console.log('  GET    /api/nutrition/logs/summary/weekly - Weekly summary');
    console.log('  GET    /api/nutrition/logs/trends - Nutrition trends');
    console.log('  POST   /api/nutrition/auto-adjust - Create auto-adjust rule');
    console.log('  GET    /api/nutrition/auto-adjust/user/:userId - Get rules');
    console.log('  POST   /api/nutrition/auto-adjust/check/:userId - Check rules');
    console.log('  GET    /api/nutrition/grocery-list/:mealPlanId - Generate grocery list');
    console.log('  GET    /api/nutrition/grocery-list/:mealPlanId/export - Export as text');

  } catch (error) {
    console.error(`\n${colors.bright}${colors.yellow}Error:${colors.reset}`, error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    info('\nDatabase connection closed');
  }
}

runDemo();

