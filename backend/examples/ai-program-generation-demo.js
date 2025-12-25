/**
 * AI Program Generation Demo
 * Example script showing how to use the AI program generation feature
 * 
 * Usage: node examples/ai-program-generation-demo.js
 * 
 * Prerequisites:
 * 1. MongoDB running
 * 2. OPENAI_API_KEY set in .env
 * 3. ENABLE_AI_FEATURES=true in .env
 * 4. Coach and client users exist in database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../src/common/config');
const programGeneratorService = require('../src/modules/ai-programs/services/programGenerator.service');
const openaiService = require('../src/modules/ai-programs/services/openai.service');
const User = require('../src/modules/auth/models/user.model');
const ClientProfile = require('../src/modules/clients/models/clientProfile.model');

async function demo() {
  console.log('🤖 AI Program Generation Demo\n');
  console.log('================================\n');

  try {
    // Connect to database
    console.log('📊 Connecting to database...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB\n');

    // Check AI status
    console.log('🔍 Checking AI service status...');
    const isEnabled = openaiService.isEnabled();
    if (!isEnabled) {
      console.error('❌ AI features are not enabled. Please configure OPENAI_API_KEY in .env');
      process.exit(1);
    }
    console.log('✅ AI features enabled\n');

    // Find or create demo users
    console.log('👥 Setting up demo users...');
    
    let coach = await User.findOne({ email: 'demo.coach@coachflow.com' });
    if (!coach) {
      coach = await User.create({
        firstName: 'Demo',
        lastName: 'Coach',
        email: 'demo.coach@coachflow.com',
        password: 'Demo123!',
        role: 'coach',
      });
      console.log('✅ Created demo coach');
    } else {
      console.log('✅ Found existing demo coach');
    }

    let client = await User.findOne({ email: 'demo.client@coachflow.com' });
    if (!client) {
      client = await User.create({
        firstName: 'Demo',
        lastName: 'Client',
        email: 'demo.client@coachflow.com',
        password: 'Demo123!',
        role: 'client',
      });
      console.log('✅ Created demo client');
    } else {
      console.log('✅ Found existing demo client');
    }

    // Create or update client profile
    console.log('\n📋 Setting up client profile...');
    let clientProfile = await ClientProfile.findOne({ userId: client._id });
    
    if (!clientProfile) {
      clientProfile = await ClientProfile.create({
        userId: client._id,
        coachId: coach._id,
        onboarding: {
          isCompleted: true,
          completedAt: new Date(),
          currentStep: 'completed',
        },
        personalInfo: {
          dateOfBirth: new Date('1990-05-15'),
          gender: 'male',
          height: 180,
          weight: 85,
          bodyFatPercentage: 18,
        },
        fitnessProfile: {
          experienceLevel: 'intermediate',
          goals: ['muscle_gain', 'strength'],
          primaryGoal: 'muscle_gain',
          targetWeight: 90,
          activityLevel: 'moderately_active',
          yearsOfTraining: 3,
        },
        medicalInfo: {
          injuries: [],
          chronicConditions: [],
          limitations: [],
          doctorClearance: true,
        },
        schedule: {
          availableDays: ['monday', 'wednesday', 'friday', 'saturday'],
          preferredTimeOfDay: 'evening',
          sessionDuration: 60,
          sessionsPerWeek: 4,
        },
        equipment: {
          hasGymAccess: true,
          homeEquipment: ['dumbbells', 'resistance_bands'],
        },
        nutritionPreferences: {
          dietType: 'none',
          calorieTarget: 2800,
          macroTargets: {
            protein: 180,
            carbs: 320,
            fats: 80,
          },
          mealsPerDay: 4,
          dietaryRestrictions: [],
          foodAllergies: [],
        },
      });
      console.log('✅ Created client profile\n');
    } else {
      console.log('✅ Client profile exists\n');
    }

    // Example 1: Generate Complete Program
    console.log('🎯 EXAMPLE 1: Generate Complete Program (Workout + Nutrition)\n');
    console.log('Generating...');
    
    const completeProgram = await programGeneratorService.generateCompleteProgram(
      coach._id,
      client._id,
      {
        duration: 12,
        additionalRequirements: 'Focus on compound movements and progressive overload',
      }
    );

    console.log('✅ Complete program generated!');
    console.log(`   - Program ID: ${completeProgram._id}`);
    console.log(`   - Status: ${completeProgram.status}`);
    console.log(`   - Workout: ${completeProgram.generatedContent.workoutProgram.name}`);
    console.log(`   - Nutrition: ${completeProgram.generatedContent.nutritionPlan.name}`);
    console.log(`   - Token Usage: ${completeProgram.aiMetadata.tokensUsed?.total || 'N/A'}`);
    console.log(`   - Est. Cost: $${completeProgram.aiMetadata.estimatedCost?.toFixed(4) || 'N/A'}\n`);

    // Review the program
    console.log('📝 Reviewing and approving program...');
    const reviewed = await programGeneratorService.updateGeneratedProgram(
      completeProgram._id,
      {
        status: 'approved',
        reviewedBy: coach._id,
        reviewNotes: 'Demo program looks great!',
        quality: {
          coachRating: 5,
          wasUseful: true,
          feedback: 'Well-structured and personalized',
        },
      }
    );
    console.log(`✅ Program approved with rating: ${reviewed.quality.coachRating}/5\n`);

    // Apply to client
    console.log('🚀 Applying program to client...');
    const applied = await programGeneratorService.applyGeneratedProgram(
      completeProgram._id,
      coach._id
    );
    console.log('✅ Program applied successfully!');
    console.log(`   - Created Program ID: ${applied.program._id}`);
    console.log(`   - Created MealPlan ID: ${applied.mealPlan._id}`);
    console.log(`   - Client can now start training!\n`);

    // Example 2: Generate Workout Only
    console.log('🎯 EXAMPLE 2: Generate Workout Program Only\n');
    console.log('Generating...');
    
    const workoutOnly = await programGeneratorService.generateWorkoutProgram(
      coach._id,
      client._id,
      {
        duration: 8,
        goals: ['strength'],
        additionalRequirements: 'Focus on powerlifting - squat, bench, deadlift',
      }
    );

    console.log('✅ Workout program generated!');
    console.log(`   - Program ID: ${workoutOnly._id}`);
    console.log(`   - Workout: ${workoutOnly.generatedContent.workoutProgram.name}`);
    console.log(`   - Workouts per week: ${workoutOnly.generatedContent.workoutProgram.duration.workoutsPerWeek}`);
    console.log(`   - Duration: ${workoutOnly.generatedContent.workoutProgram.duration.weeks} weeks\n`);

    // Example 3: Generate Nutrition Only
    console.log('🎯 EXAMPLE 3: Generate Nutrition Plan Only\n');
    console.log('Generating...');
    
    const nutritionOnly = await programGeneratorService.generateNutritionPlan(
      coach._id,
      client._id,
      {
        duration: 4,
        additionalRequirements: 'High protein, moderate carbs for muscle gain',
      }
    );

    console.log('✅ Nutrition plan generated!');
    console.log(`   - Plan ID: ${nutritionOnly._id}`);
    console.log(`   - Plan: ${nutritionOnly.generatedContent.nutritionPlan.name}`);
    console.log(`   - Daily Calories: ${nutritionOnly.generatedContent.nutritionPlan.dailyTargets.calories}`);
    console.log(`   - Macros: P${nutritionOnly.generatedContent.nutritionPlan.dailyTargets.protein}g | C${nutritionOnly.generatedContent.nutritionPlan.dailyTargets.carbs}g | F${nutritionOnly.generatedContent.nutritionPlan.dailyTargets.fats}g\n`);

    // List all generated programs
    console.log('🎯 EXAMPLE 4: List All Generated Programs\n');
    
    const allPrograms = await programGeneratorService.getGeneratedPrograms(
      coach._id,
      { limit: 10 }
    );

    console.log(`✅ Found ${allPrograms.length} generated programs:`);
    allPrograms.forEach((prog, index) => {
      console.log(`   ${index + 1}. ${prog.generationType} - ${prog.status} (${new Date(prog.createdAt).toLocaleDateString()})`);
    });

    console.log('\n================================');
    console.log('✅ Demo completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Check the generated programs in your database');
    console.log('2. Try the REST API endpoints');
    console.log('3. Review the documentation in docs/');
    console.log('4. Integrate with your frontend');
    console.log('\n🎉 Happy coaching!\n');

  } catch (error) {
    console.error('\n❌ Error during demo:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the demo
if (require.main === module) {
  demo().catch(console.error);
}

module.exports = demo;

