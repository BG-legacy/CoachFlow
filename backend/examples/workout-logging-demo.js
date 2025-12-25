/**
 * Workout Logging Demo
 * Demonstrates workout logging, set-by-set tracking, and compliance metrics
 */

const mongoose = require('mongoose');
const config = require('../src/common/config');
const workoutLoggingService = require('../src/modules/ai-programs/services/workoutLogging.service');
const GeneratedProgram = require('../src/modules/ai-programs/models/generatedProgram.model');
const WorkoutLog = require('../src/modules/workouts/models/workoutLog.model');

// Demo IDs
const demoUserId = new mongoose.Types.ObjectId();
const demoCoachId = new mongoose.Types.ObjectId();

/**
 * Demo 1: Progressive Set-by-Set Logging
 */
async function demoSetBySetLogging() {
  console.log('\n=== DEMO 1: Progressive Set-by-Set Logging ===\n');

  // Create a demo program
  const program = new GeneratedProgram({
    coachId: demoCoachId,
    clientId: demoUserId,
    requestId: 'demo-workout-logging-' + Date.now(),
    generationType: 'workout_only',
    status: 'applied',
    appliedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
    generatedContent: {
      workoutProgram: {
        name: 'Upper/Lower Split',
        duration: { weeks: 12, workoutsPerWeek: 4 },
        workouts: [
          {
            name: 'Upper Body - Push',
            exercises: [
              { exerciseId: 'bench_001', name: 'Bench Press', sets: 3, reps: '5', weight: 100 },
              { exerciseId: 'ohp_001', name: 'Overhead Press', sets: 3, reps: '8', weight: 60 },
              { exerciseId: 'dips_001', name: 'Dips', sets: 3, reps: '10', weight: 0 },
            ],
          },
        ],
        progressionEngine: {
          rpeTargets: {
            enabled: true,
            weeklyTargets: [
              { week: 1, targetRPE: 6, notes: 'Easy week' },
              { week: 2, targetRPE: 7, notes: 'Building up' },
              { week: 3, targetRPE: 8, notes: 'Working sets' },
            ],
          },
        },
      },
    },
  });

  await program.save();
  console.log(`✓ Demo program created: ${program._id}`);

  // Step 1: Start workout session
  console.log('\n📝 Step 1: Starting workout session...');
  const session = await workoutLoggingService.startWorkoutSession(demoUserId, program._id, {
    workoutIndex: 0,
    workoutName: 'Upper Body - Push',
  });

  console.log(`✓ Workout session started: ${session.workoutLog._id}`);
  console.log(`  Exercises loaded: ${session.workoutLog.exercises.length}`);

  // Step 2: Log sets progressively
  console.log('\n💪 Step 2: Logging sets as they are completed...');

  // Bench Press - Set 1
  await workoutLoggingService.logSet(session.workoutLog._id, demoUserId, {
    exerciseIndex: 0,
    setNumber: 1,
    reps: 5,
    weight: 100,
    rpe: 7,
    notes: 'Felt good',
  });
  console.log('  ✓ Bench Press - Set 1: 5 reps @ 100kg, RPE 7');

  // Bench Press - Set 2
  await workoutLoggingService.logSet(session.workoutLog._id, demoUserId, {
    exerciseIndex: 0,
    setNumber: 2,
    reps: 5,
    weight: 100,
    rpe: 7.5,
  });
  console.log('  ✓ Bench Press - Set 2: 5 reps @ 100kg, RPE 7.5');

  // Bench Press - Set 3
  await workoutLoggingService.logSet(session.workoutLog._id, demoUserId, {
    exerciseIndex: 0,
    setNumber: 3,
    reps: 5,
    weight: 100,
    rpe: 8,
  });
  console.log('  ✓ Bench Press - Set 3: 5 reps @ 100kg, RPE 8');

  // Overhead Press - All sets
  await workoutLoggingService.logSet(session.workoutLog._id, demoUserId, {
    exerciseIndex: 1,
    setNumber: 1,
    reps: 8,
    weight: 60,
    rpe: 7,
  });
  console.log('  ✓ Overhead Press - Set 1: 8 reps @ 60kg, RPE 7');

  await workoutLoggingService.logSet(session.workoutLog._id, demoUserId, {
    exerciseIndex: 1,
    setNumber: 2,
    reps: 8,
    weight: 60,
    rpe: 7.5,
  });
  console.log('  ✓ Overhead Press - Set 2: 8 reps @ 60kg, RPE 7.5');

  await workoutLoggingService.logSet(session.workoutLog._id, demoUserId, {
    exerciseIndex: 1,
    setNumber: 3,
    reps: 7,
    weight: 60,
    rpe: 8.5,
    notes: 'Last rep was tough',
  });
  console.log('  ✓ Overhead Press - Set 3: 7 reps @ 60kg, RPE 8.5');

  // Step 3: Complete the workout
  console.log('\n✅ Step 3: Completing workout...');
  const updatedLog = await WorkoutLog.findByIdAndUpdate(
    session.workoutLog._id,
    {
      completed: true,
      duration: 45,
      rating: 4,
      difficulty: 'just_right',
      notes: 'Great session!',
    },
    { new: true }
  );

  console.log(`✓ Workout completed!`);
  console.log(`  Duration: ${updatedLog.duration} minutes`);
  console.log(`  Total Volume: ${updatedLog.totalVolume}kg`);
  console.log(`  Average RPE: ${updatedLog.averageRPE ? updatedLog.averageRPE.toFixed(1) : 'N/A'}`);
  console.log(`  Rating: ${updatedLog.rating}/5`);

  return { program, workoutLog: updatedLog };
}

/**
 * Demo 2: Complete Workout in One Request
 */
async function demoCompleteWorkout() {
  console.log('\n=== DEMO 2: Complete Workout in One Request ===\n');

  // Use the program from Demo 1 or create new one
  const programs = await GeneratedProgram.find({ clientId: demoUserId });
  const program = programs[0];

  if (!program) {
    console.log('⚠️  No program found. Run Demo 1 first.');
    return;
  }

  console.log('📝 Logging complete workout...');

  const result = await workoutLoggingService.markWorkoutComplete(demoUserId, program._id, {
    workoutIndex: 0,
    workoutName: 'Upper Body - Push',
    duration: 50,
    exercises: [
      {
        exerciseId: 'bench_001',
        name: 'Bench Press',
        sets: [
          { setNumber: 1, reps: 5, weight: 102.5, rpe: 7 },
          { setNumber: 2, reps: 5, weight: 102.5, rpe: 7.5 },
          { setNumber: 3, reps: 5, weight: 102.5, rpe: 8 },
        ],
      },
      {
        exerciseId: 'ohp_001',
        name: 'Overhead Press',
        sets: [
          { setNumber: 1, reps: 8, weight: 62.5, rpe: 7 },
          { setNumber: 2, reps: 8, weight: 62.5, rpe: 7.5 },
          { setNumber: 3, reps: 8, weight: 62.5, rpe: 8 },
        ],
      },
      {
        exerciseId: 'dips_001',
        name: 'Dips',
        sets: [
          { setNumber: 1, reps: 10, weight: 0, rpe: 6 },
          { setNumber: 2, reps: 10, weight: 0, rpe: 7 },
          { setNumber: 3, reps: 9, weight: 0, rpe: 8 },
        ],
      },
    ],
    rating: 5,
    difficulty: 'just_right',
    notes: 'Increased weight on bench and OHP!',
    mood: 'energized',
  });

  console.log('✓ Workout logged successfully!');
  console.log(`  Workout ID: ${result.workoutLog._id}`);
  console.log(`  Total Volume: ${result.workoutLog.totalVolume}kg`);
  console.log(`  Average RPE: ${result.workoutLog.averageRPE ? result.workoutLog.averageRPE.toFixed(1) : 'N/A'}`);

  if (result.progressionInsights) {
    console.log('\n📊 Progression Insights:');
    console.log(`  Week: ${result.progressionInsights.currentWeek}`);
    console.log(`  Target RPE: ${result.progressionInsights.targetRPE}`);
    console.log(`  Actual RPE: ${result.progressionInsights.actualRPE}`);
    console.log(`  ${result.progressionInsights.insight}`);
    console.log(`  💡 ${result.progressionInsights.recommendation}`);
  }

  console.log('\n📈 Compliance Metrics:');
  console.log(`  Adherence: ${result.complianceMetrics.adherence.adherenceRate}%`);
  console.log(`  Status: ${result.complianceMetrics.adherence.status}`);
  console.log(`  Current Streak: ${result.complianceMetrics.streaks.currentStreak} workouts`);

  return result;
}

/**
 * Demo 3: Compliance Metrics & Analytics
 */
async function demoComplianceMetrics() {
  console.log('\n=== DEMO 3: Compliance Metrics & Analytics ===\n');

  const programs = await GeneratedProgram.find({ clientId: demoUserId });
  const program = programs[0];

  if (!program) {
    console.log('⚠️  No program found. Run Demo 1 first.');
    return;
  }

  // Create some historical workout logs
  console.log('📝 Creating historical workout data...');
  const historicalDates = [
    new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  ];

  for (let i = 0; i < historicalDates.length; i++) {
    await workoutLoggingService.markWorkoutComplete(demoUserId, program._id, {
      workoutIndex: 0,
      duration: 45 + Math.random() * 10,
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { setNumber: 1, reps: 5, weight: 95 + i * 2.5, rpe: 7 + Math.random() },
            { setNumber: 2, reps: 5, weight: 95 + i * 2.5, rpe: 7.5 + Math.random() },
            { setNumber: 3, reps: 5, weight: 95 + i * 2.5, rpe: 8 + Math.random() },
          ],
        },
      ],
      rating: Math.floor(Math.random() * 2) + 4,
      difficulty: 'just_right',
      date: historicalDates[i],
    });
  }
  console.log(`✓ Created ${historicalDates.length} historical workouts`);

  // Get compliance metrics
  console.log('\n📊 Calculating compliance metrics...');
  const metrics = await workoutLoggingService.calculateComplianceMetrics(
    demoUserId,
    program._id
  );

  console.log('\n📈 ADHERENCE METRICS:');
  console.log(`  Expected Workouts: ${metrics.adherence.expectedWorkouts}`);
  console.log(`  Completed Workouts: ${metrics.adherence.completedWorkouts}`);
  console.log(`  Adherence Rate: ${metrics.adherence.adherenceRate}%`);
  console.log(`  Status: ${metrics.adherence.status.toUpperCase()}`);
  console.log(`  This Week: ${metrics.adherence.thisWeekWorkouts}/${program.generatedContent.workoutProgram.duration.workoutsPerWeek}`);

  console.log('\n💪 PERFORMANCE METRICS:');
  console.log(`  Average RPE: ${metrics.performance.averageRPE}`);
  console.log(`  Average Rating: ${metrics.performance.averageRating}/5`);
  console.log(`  Total Volume: ${metrics.performance.totalVolume}kg`);

  if (metrics.performance.rpeComparison) {
    console.log(`  RPE Adherence: ${metrics.performance.rpeComparison.adherenceRate.toFixed(1)}%`);
    console.log(`  Avg RPE Difference: ${metrics.performance.rpeComparison.averageDifference}`);
  }

  console.log('\n🔥 STREAKS:');
  console.log(`  Current Streak: ${metrics.streaks.currentStreak} workouts`);
  console.log(`  Longest Streak: ${metrics.streaks.longestStreak} workouts`);

  console.log('\n💡 INSIGHTS:');
  metrics.insights.forEach((insight) => {
    const icon = insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`  ${icon} [${insight.category}] ${insight.message}`);
  });

  console.log('\n📅 RECENT WORKOUTS:');
  metrics.recentWorkouts.forEach((workout, i) => {
    console.log(`  ${i + 1}. ${new Date(workout.date).toLocaleDateString()}`);
    console.log(`     Duration: ${workout.duration}min | RPE: ${workout.averageRPE?.toFixed(1) || 'N/A'} | Rating: ${workout.rating || 'N/A'}/5`);
  });

  return metrics;
}

/**
 * Demo 4: Progression Analysis
 */
async function demoProgressionAnalysis() {
  console.log('\n=== DEMO 4: Progression Analysis ===\n');

  const programs = await GeneratedProgram.find({ clientId: demoUserId });
  const program = programs[0];

  if (!program) {
    console.log('⚠️  No program found. Run Demo 1 first.');
    return;
  }

  console.log('📊 Analyzing progression...');
  const insights = await workoutLoggingService.getProgressionInsights(
    demoUserId,
    program._id
  );

  if (!insights.hasEnoughData) {
    console.log('⚠️  Not enough data for progression analysis');
    return;
  }

  console.log('\n📈 VOLUME TREND:');
  console.log(`  Current: ${insights.volumeTrend.current}kg`);
  console.log(`  Average: ${insights.volumeTrend.average}kg`);
  console.log(`  Trend: ${insights.volumeTrend.trend.toUpperCase()}`);
  console.log(`  Change: ${insights.volumeTrend.percentChange > 0 ? '+' : ''}${insights.volumeTrend.percentChange}%`);

  console.log('\n💪 RPE TREND:');
  if (insights.rpeTrend && insights.rpeTrend.current) {
    console.log(`  Current: ${insights.rpeTrend.current.toFixed(1)}`);
    console.log(`  Average: ${insights.rpeTrend.average}`);
    console.log(`  Recent Average: ${insights.rpeTrend.recentAverage}`);
    console.log(`  Trend: ${insights.rpeTrend.trend.toUpperCase()}`);
  } else {
    console.log(`  Not enough RPE data available`);
  }

  console.log('\n🏋️ EXERCISE PROGRESSION (Top 5):');
  insights.exerciseProgression.forEach((exercise, i) => {
    console.log(`\n  ${i + 1}. ${exercise.exercise}`);
    console.log(`     Sessions: ${exercise.sessions}`);
    console.log(`     Weight: ${exercise.startWeight}kg → ${exercise.currentWeight}kg (+${exercise.weightIncrease}kg)`);
    console.log(`     Change: ${exercise.weightPercentChange > 0 ? '+' : ''}${exercise.weightPercentChange}%`);
    console.log(`     Trend: ${exercise.trend.toUpperCase()}`);
  });

  console.log('\n🛌 DELOAD RECOMMENDATION:');
  console.log(`  Needs Deload: ${insights.deloadRecommendation.needsDeload ? 'YES' : 'NO'}`);
  console.log(`  ${insights.deloadRecommendation.recommendation}`);

  if (insights.deloadRecommendation.triggers.length > 0) {
    console.log('\n  Triggers:');
    insights.deloadRecommendation.triggers.forEach((trigger) => {
      console.log(`    - ${trigger.message}`);
      console.log(`      Protocol: ${trigger.protocol}`);
    });
  }

  console.log('\n⭐ PROGRESSION SCORE:');
  console.log(`  ${insights.progressionScore}/100`);

  console.log('\n💡 RECOMMENDATIONS:');
  insights.recommendations.forEach((rec) => {
    const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
    console.log(`  ${icon} [${rec.category}] ${rec.message}`);
  });

  return insights;
}

/**
 * Main demo runner
 */
async function runDemo() {
  try {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   WORKOUT LOGGING DEMONSTRATION                    ║');
    console.log('║   Set-by-Set • Complete • Compliance • Progression ║');
    console.log('╚════════════════════════════════════════════════════╝');

    // Connect to database
    const uri = config.env === 'test' ? config.mongodb.testUri : config.mongodb.uri;
    await mongoose.connect(uri, config.mongodb.options);
    console.log('\n✓ Database connected');

    // Run demos
    await demoSetBySetLogging();
    await demoCompleteWorkout();
    await demoComplianceMetrics();
    await demoProgressionAnalysis();

    console.log('\n✅ All demos completed successfully!');
    console.log('\n📚 Key Features Demonstrated:');
    console.log('   • Progressive set-by-set logging');
    console.log('   • Complete workout logging in one request');
    console.log('   • Adherence and compliance tracking');
    console.log('   • RPE target comparison');
    console.log('   • Workout streaks');
    console.log('   • Volume and RPE trend analysis');
    console.log('   • Exercise-specific progression tracking');
    console.log('   • Automatic deload recommendations');
    console.log('   • Progression scoring and insights');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Demo error:', error);
    process.exit(1);
  }
}

// Run demo if called directly
if (require.main === module) {
  runDemo();
}

module.exports = {
  demoSetBySetLogging,
  demoCompleteWorkout,
  demoComplianceMetrics,
  demoProgressionAnalysis,
};

