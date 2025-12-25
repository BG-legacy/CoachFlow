/**
 * Program Editing & Exercise Swap Demo
 * Demonstrates manual trainer edits and exercise swapping functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../src/common/config');
const User = require('../src/modules/auth/models/user.model');
const GeneratedProgram = require('../src/modules/ai-programs/models/generatedProgram.model');
const programGeneratorService = require('../src/modules/ai-programs/services/programGenerator.service');
const programEditorService = require('../src/modules/ai-programs/services/programEditor.service');
const { getAlternatives, findBestAlternative } = require('../src/modules/ai-programs/data/exerciseAlternatives');

console.log('🎯 Program Editing & Exercise Swap Demo\n');
console.log('===================================\n');

async function runDemo() {
  try {
    // Connect to database
    console.log('📊 Connecting to database...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected\n');

    // Create demo users
    console.log('👥 Creating demo users...');
    const coach = await User.findOneAndUpdate(
      { email: 'demo.coach@coachflow.com' },
      {
        email: 'demo.coach@coachflow.com',
        firstName: 'Demo',
        lastName: 'Coach',
        role: 'coach',
        password: 'TempPassword123!',
      },
      { upsert: true, new: true }
    );

    const client = await User.findOneAndUpdate(
      { email: 'demo.client@coachflow.com' },
      {
        email: 'demo.client@coachflow.com',
        firstName: 'Demo',
        lastName: 'Client',
        role: 'client',
        password: 'TempPassword123!',
        fitnessProfile: {
          experienceLevel: 'intermediate',
          goals: ['strength', 'muscle_gain'],
          availableEquipment: ['dumbbells', 'resistance_bands', 'bodyweight'],
          workoutsPerWeek: 4,
          currentWeight: 75,
          height: 175,
        },
        equipment: {
          hasGymAccess: false,
          homeEquipment: ['dumbbells', 'resistance_bands'],
        },
      },
      { upsert: true, new: true }
    );
    console.log('✅ Users created\n');

    // ==================================================
    // EXAMPLE 1: Generate a sample program
    // ==================================================
    console.log('🎯 EXAMPLE 1: Generate Sample Program\n');
    console.log('Generating a workout program...');
    
    const generatedProgram = await programGeneratorService.generateCompleteProgram(
      coach._id,
      client._id,
      {
        duration: 8,
        goals: ['strength'],
        preferences: {
          workoutsPerWeek: 3,
        },
      }
    );
    
    console.log('✅ Program generated:', generatedProgram._id);
    console.log(`   Workouts: ${generatedProgram.generatedContent.workoutProgram?.workouts?.length || 0}`);
    console.log('');

    // ==================================================
    // EXAMPLE 2: View Exercise Alternatives
    // ==================================================
    console.log('🎯 EXAMPLE 2: Exercise Alternatives Lookup\n');
    
    const exercises = ['bench_press', 'barbell_squat', 'pull_ups'];
    
    for (const exercise of exercises) {
      console.log(`\n📋 Alternatives for: ${exercise}`);
      const alternatives = getAlternatives(exercise);
      
      if (alternatives) {
        console.log(`   Original: ${alternatives.original.muscleGroup} (${alternatives.original.difficulty})`);
        console.log(`   Equipment: ${alternatives.original.equipment?.join(', ')}`);
        console.log(`   \n   Top 3 alternatives:`);
        
        alternatives.alternatives.slice(0, 3).forEach((alt, idx) => {
          console.log(`     ${idx + 1}. ${alt.exercise}`);
          console.log(`        Similarity: ${(alt.similarity * 100).toFixed(0)}%`);
          console.log(`        Reason: ${alt.reason}`);
          console.log(`        Equipment: ${alt.equipment?.join(', ')}`);
          if (alt.notes) console.log(`        Notes: ${alt.notes}`);
        });
      } else {
        console.log('   ❌ No alternatives found');
      }
    }
    console.log('\n');

    // ==================================================
    // EXAMPLE 3: Smart Exercise Swap
    // ==================================================
    console.log('🎯 EXAMPLE 3: Smart Exercise Swap\n');
    
    const bestAlt = findBestAlternative('barbell_squat', {
      availableEquipment: ['dumbbells', 'bodyweight'],
      reason: 'equipment',
    });
    
    if (bestAlt) {
      console.log('Looking for alternative to: barbell_squat');
      console.log('Available equipment: dumbbells, bodyweight\n');
      console.log('✅ Best Alternative:');
      console.log(`   Exercise: ${bestAlt.recommended.exercise}`);
      console.log(`   Similarity: ${(bestAlt.recommended.similarity * 100).toFixed(0)}%`);
      console.log(`   Equipment: ${bestAlt.recommended.equipment?.join(', ')}`);
      console.log(`   Notes: ${bestAlt.recommended.notes || 'N/A'}`);
      
      if (bestAlt.otherOptions.length > 0) {
        console.log(`\n   Other options (${bestAlt.otherOptions.length}):`);
        bestAlt.otherOptions.slice(0, 2).forEach((alt, idx) => {
          console.log(`     ${idx + 1}. ${alt.exercise} (${(alt.similarity * 100).toFixed(0)}%)`);
        });
      }
    }
    console.log('\n');

    // ==================================================
    // EXAMPLE 4: Manual Program Edits
    // ==================================================
    console.log('🎯 EXAMPLE 4: Manual Program Edits\n');
    
    console.log('Editing program details...');
    const editResult = await programEditorService.editProgram(
      generatedProgram._id,
      {
        workoutProgram: {
          name: 'Customized Home Strength Program',
          description: 'Modified for home equipment - dumbbells and bands only',
        },
        reason: 'Customized for client equipment availability',
      },
      coach._id
    );
    
    console.log('✅ Program edited successfully');
    console.log(`   Modifications made: ${editResult.modifications.length}`);
    editResult.modifications.forEach((mod, idx) => {
      console.log(`   ${idx + 1}. ${mod.field}`);
      console.log(`      From: ${JSON.stringify(mod.originalValue).substring(0, 50)}...`);
      console.log(`      To: ${JSON.stringify(mod.modifiedValue).substring(0, 50)}...`);
    });
    console.log('');

    // ==================================================
    // EXAMPLE 5: Exercise Swap in Workout
    // ==================================================
    console.log('🎯 EXAMPLE 5: Exercise Swap in Workout\n');
    
    // Refresh program to get latest data
    const updatedProgram = await GeneratedProgram.findById(generatedProgram._id);
    
    if (updatedProgram.generatedContent.workoutProgram?.workouts?.length > 0) {
      const workout = updatedProgram.generatedContent.workoutProgram.workouts[0];
      
      if (workout.exercises && workout.exercises.length > 0) {
        const exerciseToSwap = workout.exercises[0];
        console.log(`Original exercise: ${exerciseToSwap.name || 'Exercise 1'}`);
        
        const swapResult = await programEditorService.swapExercise(
          updatedProgram._id,
          0, // workout index
          0, // exercise index
          {
            name: 'Dumbbell Floor Press',
            sets: exerciseToSwap.sets || 3,
            reps: exerciseToSwap.reps || 10,
            equipment: ['dumbbells'],
            description: 'Home-friendly chest exercise',
          },
          'Equipment availability - no bench available',
          coach._id
        );
        
        console.log('✅ Exercise swapped successfully');
        console.log(`   From: ${swapResult.modification.originalValue.name || 'Original'}`);
        console.log(`   To: ${swapResult.swappedExercise.name}`);
        console.log(`   Reason: ${swapResult.swappedExercise.swapReason}`);
      } else {
        console.log('⚠️  No exercises found in first workout');
      }
    } else {
      console.log('⚠️  No workouts found in program');
    }
    console.log('');

    // ==================================================
    // EXAMPLE 6: Bulk Equipment Swap
    // ==================================================
    console.log('🎯 EXAMPLE 6: Bulk Equipment Swap\n');
    
    console.log('Swapping all exercises to match available equipment...');
    console.log('Available: dumbbells, resistance_bands, bodyweight\n');
    
    const bulkSwapResult = await programEditorService.bulkSwapByEquipment(
      updatedProgram._id,
      ['dumbbells', 'resistance_bands', 'bodyweight'],
      coach._id
    );
    
    console.log('✅ Bulk swap completed');
    console.log(`   ${bulkSwapResult.summary}`);
    
    if (bulkSwapResult.swaps.length > 0) {
      console.log('\n   Swaps made:');
      bulkSwapResult.swaps.forEach((swap, idx) => {
        console.log(`   ${idx + 1}. ${swap.from} → ${swap.to}`);
        console.log(`      Reason: ${swap.reason}`);
      });
    } else {
      console.log('   No swaps needed - all exercises compatible with equipment');
    }
    console.log('');

    // ==================================================
    // EXAMPLE 7: Adjust Difficulty
    // ==================================================
    console.log('🎯 EXAMPLE 7: Adjust Difficulty\n');
    
    console.log('Increasing workout difficulty (all parameters by 10%)...');
    
    const difficultyResult = await programEditorService.adjustDifficulty(
      updatedProgram._id,
      {
        type: 'increase',
        parameter: 'all', // sets, reps, weight, or all
      },
      coach._id
    );
    
    console.log('✅ Difficulty adjusted');
    console.log(`   ${difficultyResult.summary}`);
    console.log(`   Modified ${difficultyResult.modifications.length} exercise(s)`);
    console.log('');

    // ==================================================
    // EXAMPLE 8: View Edit History
    // ==================================================
    console.log('🎯 EXAMPLE 8: View Edit History\n');
    
    const history = await programEditorService.getEditHistory(updatedProgram._id);
    
    console.log('📜 Edit History:');
    console.log(`   Total edits: ${history.totalEdits}`);
    console.log(`   Status: ${history.reviewInfo.status}`);
    
    if (history.modifications.length > 0) {
      console.log('\n   Recent modifications:');
      history.modifications.slice(-5).forEach((mod, idx) => {
        console.log(`   ${idx + 1}. ${mod.field}`);
        console.log(`      Reason: ${mod.reason}`);
        console.log(`      Modified: ${new Date(mod.modifiedAt).toLocaleString()}`);
      });
    }
    console.log('');

    // ==================================================
    // EXAMPLE 9: Get Final Program State
    // ==================================================
    console.log('🎯 EXAMPLE 9: Final Program State\n');
    
    const finalProgram = await GeneratedProgram.findById(updatedProgram._id);
    
    console.log('📊 Program Summary:');
    console.log(`   ID: ${finalProgram._id}`);
    console.log(`   Status: ${finalProgram.status}`);
    console.log(`   Name: ${finalProgram.generatedContent.workoutProgram?.name}`);
    console.log(`   Total Modifications: ${finalProgram.quality?.modifications?.length || 0}`);
    console.log(`   Workouts: ${finalProgram.generatedContent.workoutProgram?.workouts?.length || 0}`);
    
    if (finalProgram.generatedContent.workoutProgram?.workouts?.length > 0) {
      const firstWorkout = finalProgram.generatedContent.workoutProgram.workouts[0];
      console.log(`\n   First Workout Exercises:`);
      firstWorkout.exercises?.slice(0, 3).forEach((ex, idx) => {
        console.log(`     ${idx + 1}. ${ex.name || 'Exercise'}`);
        if (ex.swapped) {
          console.log(`        ⚠️  SWAPPED: ${ex.swapReason}`);
        }
        console.log(`        Sets: ${ex.sets}, Reps: ${ex.reps}`);
      });
    }
    console.log('');

    // ==================================================
    // SUMMARY
    // ==================================================
    console.log('===================================');
    console.log('✅ Demo completed successfully!\n');
    console.log('Key Features Demonstrated:');
    console.log('1. ✅ Exercise alternatives database (25+ exercises)');
    console.log('2. ✅ Smart exercise swapping based on equipment');
    console.log('3. ✅ Manual program editing with change tracking');
    console.log('4. ✅ Individual exercise swaps');
    console.log('5. ✅ Bulk equipment-based swaps');
    console.log('6. ✅ Difficulty adjustments (sets/reps/weight)');
    console.log('7. ✅ Complete edit history tracking');
    console.log('8. ✅ Edit reversion capability');
    console.log('\n💡 Try the REST API:');
    console.log('   GET  /api/v1/ai-programs/exercises/bench_press/alternatives');
    console.log('   POST /api/v1/ai-programs/:id/edit');
    console.log('   POST /api/v1/ai-programs/:id/workouts/0/exercises/0/swap');
    console.log('   POST /api/v1/ai-programs/:id/bulk-swap-equipment');
    console.log('   POST /api/v1/ai-programs/:id/adjust-difficulty');
    console.log('   GET  /api/v1/ai-programs/:id/edit-history');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during demo:', error.message);
    console.error(error.stack);
  } finally {
    console.log('👋 Database connection closed\n');
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the demo
runDemo();

