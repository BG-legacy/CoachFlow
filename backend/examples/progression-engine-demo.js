/**
 * Progression Engine Demo
 * Demonstrates the use of RPE targets, progression rules, and deload triggers
 */

const mongoose = require('mongoose');
const config = require('../src/common/config');
const GeneratedProgram = require('../src/modules/ai-programs/models/generatedProgram.model');
const ProgramTemplate = require('../src/modules/ai-programs/models/programTemplate.model');

// Demo IDs (replace with actual IDs in production)
const demoCoachId = new mongoose.Types.ObjectId();
const demoClientId = new mongoose.Types.ObjectId();

/**
 * Example 1: Create a program with beginner linear progression
 */
async function demoBeginnerLinearProgression() {
  console.log('\n=== DEMO 1: Beginner Linear Progression ===\n');
  
  const program = new GeneratedProgram({
    coachId: demoCoachId,
    clientId: demoClientId,
    requestId: 'demo-beginner-linear-' + Date.now(),
    generationType: 'workout_only',
    status: 'generated',
    inputData: {
      clientProfile: {
        name: 'John Beginner',
        experienceLevel: 'beginner',
        goals: ['strength'],
      },
      duration: 12,
    },
    generatedContent: {
      workoutProgram: {
        name: 'Starting Strength - 12 Week Linear Progression',
        description: 'Classic beginner program with RPE-guided progression and scheduled deloads',
        duration: { weeks: 12, workoutsPerWeek: 3 },
        workouts: [
          {
            name: 'Workout A - Squat/Bench/Row',
            exercises: [
              { name: 'Squat', sets: 3, reps: '5', exerciseId: 'squat_001' },
              { name: 'Bench Press', sets: 3, reps: '5', exerciseId: 'bench_001' },
              { name: 'Barbell Row', sets: 3, reps: '5', exerciseId: 'row_001' },
            ],
          },
          {
            name: 'Workout B - Squat/Press/Deadlift',
            exercises: [
              { name: 'Squat', sets: 3, reps: '5', exerciseId: 'squat_001' },
              { name: 'Overhead Press', sets: 3, reps: '5', exerciseId: 'press_001' },
              { name: 'Deadlift', sets: 1, reps: '5', exerciseId: 'deadlift_001' },
            ],
          },
        ],
        progressionEngine: {
          // RPE targets - conservative for beginners
          rpeTargets: {
            enabled: true,
            weeklyTargets: [
              { week: 1, targetRPE: 5, notes: 'Focus on form, very light' },
              { week: 2, targetRPE: 6, notes: 'Still easy, building confidence' },
              { week: 3, targetRPE: 6.5, notes: 'Gradual increase' },
              { week: 4, targetRPE: 4, notes: 'Deload week - recovery' },
              { week: 5, targetRPE: 7, notes: 'Back to work, moderate effort' },
              { week: 6, targetRPE: 7.5, notes: 'Intensity building' },
              { week: 7, targetRPE: 8, notes: 'Working sets should feel challenging' },
              { week: 8, targetRPE: 5, notes: 'Deload week - recovery' },
              { week: 9, targetRPE: 8, notes: 'Back to challenging work' },
              { week: 10, targetRPE: 8.5, notes: 'Peak intensity for beginner' },
              { week: 11, targetRPE: 8.5, notes: 'Maintain peak intensity' },
              { week: 12, targetRPE: 5, notes: 'Final deload before testing' },
            ],
            exerciseSpecificTargets: [
              {
                exerciseId: 'deadlift_001',
                targetRPE: 8.5,
                adjustmentRules: 'Deadlifts can be pushed harder - single set allows for higher RPE',
              },
            ],
          },
          // Linear progression rules
          progressionRules: {
            strategy: 'linear',
            weightIncrement: 2.5, // 2.5kg/5lbs per session
            repRangeProgression: {
              minReps: 5,
              maxReps: 5,
              incrementWhen: 'Complete all sets at 5 reps with good form and RPE < 9',
            },
            conditions: [
              {
                metric: 'rpe',
                threshold: 9.5,
                action: 'maintain',
                value: 'current_weight',
                notes: 'If RPE exceeds 9.5, don\'t increase weight',
              },
              {
                metric: 'completedSets',
                threshold: 'all_sets_completed',
                action: 'increase_weight',
                value: 2.5,
                notes: 'If all sets completed with RPE < 9, add 2.5kg',
              },
              {
                metric: 'formQuality',
                threshold: 'poor',
                action: 'maintain',
                value: 'current_weight',
                notes: 'Form comes first - don\'t progress if form breaks down',
              },
            ],
            customRules: 'For beginners, prioritize consistency and form over weight progression. ' +
                        'If the same weight is used for 2 consecutive sessions with good form, ' +
                        'consider micro-loading (1.25kg) to continue progression.',
          },
          // Deload protocol - frequent for beginners
          deloadProtocol: {
            enabled: true,
            scheduledDeloads: [
              {
                week: 4,
                type: 'volume_reduction',
                reduction: 50,
                notes: 'First deload - reduce to 50% volume to allow adaptation',
              },
              {
                week: 8,
                type: 'volume_reduction',
                reduction: 50,
                notes: 'Mid-program deload - recovery week',
              },
              {
                week: 12,
                type: 'active_recovery',
                reduction: 60,
                notes: 'Final deload before testing maxes',
              },
            ],
            autoDeloadTriggers: [
              {
                condition: 'consecutive_failed_workouts',
                threshold: 2,
                protocol: 'reduce_volume',
                reductionPercentage: 40,
                notes: 'If failing 2 workouts in a row, take an immediate volume deload',
              },
              {
                condition: 'high_avg_rpe',
                threshold: 9,
                protocol: 'schedule_next_week',
                reductionPercentage: 50,
                notes: 'Beginners shouldn\'t sustain RPE 9+ - schedule deload if this happens',
              },
            ],
            recoveryIndicators: [
              {
                metric: 'sleep_quality',
                target: '7-9 hours',
                weight: 0.5,
                notes: 'Sleep is critical for beginner recovery',
              },
              {
                metric: 'soreness_level',
                target: 'mild to moderate',
                weight: 0.3,
                notes: 'Some soreness is normal, severe soreness indicates overtraining',
              },
              {
                metric: 'motivation',
                target: 'good',
                weight: 0.2,
                notes: 'Mental fatigue can indicate need for deload',
              },
            ],
          },
        },
      },
    },
  });

  await program.save();
  
  console.log('✓ Beginner Linear Progression Program Created');
  console.log(`Program ID: ${program._id}`);
  console.log(`Request ID: ${program.requestId}`);
  console.log(`\nProgression Strategy: ${program.generatedContent.workoutProgram.progressionEngine.progressionRules.strategy}`);
  console.log(`Weight Increment: ${program.generatedContent.workoutProgram.progressionEngine.progressionRules.weightIncrement}kg`);
  console.log(`Scheduled Deloads: ${program.generatedContent.workoutProgram.progressionEngine.deloadProtocol.scheduledDeloads.length}`);
  console.log(`\nWeek 1 Target RPE: ${program.generatedContent.workoutProgram.progressionEngine.rpeTargets.weeklyTargets[0].targetRPE}`);
  console.log(`Week 10 Target RPE: ${program.generatedContent.workoutProgram.progressionEngine.rpeTargets.weeklyTargets[9].targetRPE}`);
  
  return program;
}

/**
 * Example 2: Create an advanced wave/undulating program
 */
async function demoAdvancedWaveProgression() {
  console.log('\n=== DEMO 2: Advanced Wave/Undulating Progression ===\n');
  
  const program = new GeneratedProgram({
    coachId: demoCoachId,
    clientId: demoClientId,
    requestId: 'demo-advanced-wave-' + Date.now(),
    generationType: 'workout_only',
    status: 'generated',
    inputData: {
      clientProfile: {
        name: 'Sarah Advanced',
        experienceLevel: 'advanced',
        goals: ['strength', 'hypertrophy'],
      },
      duration: 16,
    },
    generatedContent: {
      workoutProgram: {
        name: 'Advanced Powerbuilding - Wave Progression',
        description: 'Wave loading with RPE-based autoregulation for advanced lifters',
        duration: { weeks: 16, workoutsPerWeek: 5 },
        workouts: [],
        progressionEngine: {
          rpeTargets: {
            enabled: true,
            weeklyTargets: [
              { week: 1, targetRPE: 7, notes: 'Wave 1 - Week 1' },
              { week: 2, targetRPE: 8, notes: 'Wave 1 - Week 2' },
              { week: 3, targetRPE: 9, notes: 'Wave 1 - Week 3' },
              { week: 4, targetRPE: 5, notes: 'Deload' },
              { week: 5, targetRPE: 7.5, notes: 'Wave 2 - Week 1' },
              { week: 6, targetRPE: 8.5, notes: 'Wave 2 - Week 2' },
              { week: 7, targetRPE: 9.5, notes: 'Wave 2 - Week 3' },
              { week: 8, targetRPE: 5, notes: 'Deload' },
              { week: 9, targetRPE: 8, notes: 'Wave 3 - Week 1' },
              { week: 10, targetRPE: 9, notes: 'Wave 3 - Week 2' },
              { week: 11, targetRPE: 9.5, notes: 'Wave 3 - Week 3' },
              { week: 12, targetRPE: 6, notes: 'Recovery week' },
              { week: 13, targetRPE: 8.5, notes: 'Peaking - Week 1' },
              { week: 14, targetRPE: 9, notes: 'Peaking - Week 2' },
              { week: 15, targetRPE: 9.5, notes: 'Peaking - Week 3' },
              { week: 16, targetRPE: 4, notes: 'Taper/Test week' },
            ],
          },
          progressionRules: {
            strategy: 'wave',
            weightIncrement: 2.5,
            weeklyLoad: [
              // Wave 1
              { week: 1, loadPercentage: 75, volume: 'medium' },
              { week: 2, loadPercentage: 82.5, volume: 'high' },
              { week: 3, loadPercentage: 87.5, volume: 'medium' },
              { week: 4, loadPercentage: 60, volume: 'low' },
              // Wave 2
              { week: 5, loadPercentage: 77.5, volume: 'medium' },
              { week: 6, loadPercentage: 85, volume: 'high' },
              { week: 7, loadPercentage: 90, volume: 'medium' },
              { week: 8, loadPercentage: 60, volume: 'low' },
              // Wave 3
              { week: 9, loadPercentage: 80, volume: 'medium' },
              { week: 10, loadPercentage: 87.5, volume: 'high' },
              { week: 11, loadPercentage: 92.5, volume: 'medium' },
              { week: 12, loadPercentage: 65, volume: 'low' },
              // Peaking
              { week: 13, loadPercentage: 85, volume: 'low' },
              { week: 14, loadPercentage: 90, volume: 'low' },
              { week: 15, loadPercentage: 95, volume: 'very_low' },
              { week: 16, loadPercentage: 50, volume: 'minimal' },
            ],
            conditions: [
              {
                metric: 'rpe',
                threshold: 10,
                action: 'deload',
                value: 10,
                notes: 'RPE 10 = absolute max, immediate deload needed',
              },
              {
                metric: 'bar_speed',
                threshold: 'slow',
                action: 'maintain',
                value: 'current_weight',
                notes: 'If bar speed is slow, don\'t increase weight',
              },
            ],
            customRules: 'Wave loading allows for strategic overreaching and recovery. ' +
                        'Each wave pushes slightly harder than the previous. ' +
                        'RPE and bar speed are key indicators for autoregulation.',
          },
          deloadProtocol: {
            enabled: true,
            scheduledDeloads: [
              { week: 4, type: 'volume_reduction', reduction: 40, notes: 'Wave 1 recovery' },
              { week: 8, type: 'volume_reduction', reduction: 40, notes: 'Wave 2 recovery' },
              { week: 12, type: 'intensity_reduction', reduction: 35, notes: 'Wave 3 recovery' },
              { week: 16, type: 'complete_rest', reduction: 70, notes: 'Taper for testing' },
            ],
            autoDeloadTriggers: [
              {
                condition: 'consecutive_failed_workouts',
                threshold: 3,
                protocol: 'immediate_deload',
                reductionPercentage: 30,
                notes: 'Advanced lifters can tolerate more failure, but 3+ means deload',
              },
              {
                condition: 'sustained_high_rpe',
                threshold: 9.5,
                protocol: 'reduce_volume',
                reductionPercentage: 20,
                notes: 'If RPE stays at 9.5+ for more than planned, reduce volume',
              },
              {
                condition: 'injury_risk_indicators',
                threshold: 'high',
                protocol: 'immediate_deload',
                reductionPercentage: 50,
                notes: 'Joint pain, tendon issues, etc.',
              },
            ],
            recoveryIndicators: [
              { metric: 'hrv', target: 'baseline or higher', weight: 0.3 },
              { metric: 'sleep_quality', target: '7-9 hours', weight: 0.3 },
              { metric: 'training_readiness', target: 'good or excellent', weight: 0.2 },
              { metric: 'grip_strength', target: 'within 5% of baseline', weight: 0.2 },
            ],
          },
        },
      },
    },
  });

  await program.save();
  
  console.log('✓ Advanced Wave Progression Program Created');
  console.log(`Program ID: ${program._id}`);
  console.log(`\nProgression Strategy: ${program.generatedContent.workoutProgram.progressionEngine.progressionRules.strategy}`);
  console.log(`Total Waves: 3 + Peaking Phase`);
  console.log(`Scheduled Deloads: ${program.generatedContent.workoutProgram.progressionEngine.deloadProtocol.scheduledDeloads.length}`);
  console.log(`\nWave 1 Peak RPE: ${program.generatedContent.workoutProgram.progressionEngine.rpeTargets.weeklyTargets[2].targetRPE}`);
  console.log(`Wave 2 Peak RPE: ${program.generatedContent.workoutProgram.progressionEngine.rpeTargets.weeklyTargets[6].targetRPE}`);
  console.log(`Wave 3 Peak RPE: ${program.generatedContent.workoutProgram.progressionEngine.rpeTargets.weeklyTargets[10].targetRPE}`);
  
  return program;
}

/**
 * Example 3: Create a program template with progression engine
 */
async function demoProgressionTemplate() {
  console.log('\n=== DEMO 3: Reusable Template with Progression Engine ===\n');
  
  const template = new ProgramTemplate({
    name: '5x5 Strength Template - Linear Progression',
    description: 'Classic 5x5 program with built-in RPE guidance and auto-deload',
    createdBy: demoCoachId,
    templateType: 'workout_program',
    category: 'strength',
    characteristics: {
      experienceLevel: 'intermediate',
      goals: ['strength'],
      duration: { weeks: 12, days: 84 },
      equipment: ['barbell', 'rack', 'bench'],
    },
    content: {
      workoutProgram: {
        name: '5x5 Strength Builder',
        description: 'Simple but effective strength program',
        duration: { weeks: 12, workoutsPerWeek: 3 },
        workouts: [],
        progressionEngine: {
          rpeTargets: {
            enabled: true,
            weeklyTargets: [
              { week: 1, targetRPE: 7, notes: 'Start conservative' },
              { week: 4, targetRPE: 8, notes: 'Build up' },
              { week: 8, targetRPE: 8.5, notes: 'Peak intensity' },
            ],
          },
          progressionRules: {
            strategy: 'linear',
            weightIncrement: 2.5,
            repRangeProgression: {
              minReps: 5,
              maxReps: 5,
              incrementWhen: 'All 5 sets completed',
            },
          },
          deloadProtocol: {
            enabled: true,
            scheduledDeloads: [
              { week: 4, type: 'volume_reduction', reduction: 40, notes: 'Mid-program recovery' },
              { week: 8, type: 'volume_reduction', reduction: 40, notes: 'Late-program recovery' },
            ],
            autoDeloadTriggers: [
              {
                condition: 'consecutive_failed_workouts',
                threshold: 2,
                protocol: 'reduce_volume',
                reductionPercentage: 30,
                notes: 'Auto-deload on failure',
              },
            ],
          },
        },
      },
    },
  });

  await template.save();
  
  console.log('✓ Progression Template Created');
  console.log(`Template ID: ${template.templateId}`);
  console.log(`Template Name: ${template.name}`);
  console.log(`Experience Level: ${template.characteristics.experienceLevel}`);
  console.log(`Progression Strategy: ${template.content.workoutProgram.progressionEngine.progressionRules.strategy}`);
  
  return template;
}

/**
 * Utility: Simulate progression over time
 */
function simulateProgression(startingWeight, weeks, incrementPerWeek, rpeTargets, deloadWeeks) {
  console.log('\n=== PROGRESSION SIMULATION ===\n');
  console.log(`Starting Weight: ${startingWeight}kg`);
  console.log(`Weekly Increment: ${incrementPerWeek}kg\n`);
  
  let currentWeight = startingWeight;
  
  for (let week = 1; week <= weeks; week++) {
    const isDeloadWeek = deloadWeeks.includes(week);
    const targetRPE = rpeTargets[week - 1] || 7;
    
    if (isDeloadWeek) {
      currentWeight = currentWeight * 0.7; // 30% reduction
      console.log(`Week ${week}: ${currentWeight.toFixed(1)}kg @ RPE ${targetRPE} [DELOAD]`);
      currentWeight = currentWeight / 0.7; // Back to regular weight
    } else {
      console.log(`Week ${week}: ${currentWeight.toFixed(1)}kg @ RPE ${targetRPE}`);
      currentWeight += incrementPerWeek;
    }
  }
  
  console.log(`\nFinal Weight: ${(currentWeight - incrementPerWeek).toFixed(1)}kg`);
  console.log(`Total Gain: ${(currentWeight - incrementPerWeek - startingWeight).toFixed(1)}kg`);
}

/**
 * Main demo runner
 */
async function runDemo() {
  try {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   PROGRESSION ENGINE DEMONSTRATION                 ║');
    console.log('║   RPE Targets • Progression Rules • Deload System  ║');
    console.log('╚════════════════════════════════════════════════════╝');
    
    // Connect to database
    const uri = config.env === 'test' ? config.mongodb.testUri : config.mongodb.uri;
    await mongoose.connect(uri, config.mongodb.options);
    
    console.log('\n✓ Database connected');
    
    // Run demos
    await demoBeginnerLinearProgression();
    await demoAdvancedWaveProgression();
    await demoProgressionTemplate();
    
    // Simulate progression
    simulateProgression(
      100, // starting weight
      12, // weeks
      2.5, // increment
      [6, 6.5, 7, 5, 7.5, 8, 8, 5, 8, 8.5, 8.5, 5], // RPE targets
      [4, 8, 12] // deload weeks
    );
    
    console.log('\n✅ All demos completed successfully!');
    console.log('\n📚 Key Features Demonstrated:');
    console.log('   • RPE-based intensity targets per week');
    console.log('   • Multiple progression strategies (linear, wave, autoregulated)');
    console.log('   • Scheduled deload weeks for recovery');
    console.log('   • Auto-deload triggers based on performance');
    console.log('   • Recovery indicators for fatigue management');
    console.log('   • Experience-level appropriate progressions');
    
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
  demoBeginnerLinearProgression,
  demoAdvancedWaveProgression,
  demoProgressionTemplate,
  simulateProgression,
};


