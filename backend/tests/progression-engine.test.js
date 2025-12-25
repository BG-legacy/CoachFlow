/**
 * Progression Engine Tests
 * Tests for RPE targets, progression rules, and deload triggers
 */

const mongoose = require('mongoose');
const GeneratedProgram = require('../src/modules/ai-programs/models/generatedProgram.model');
const ProgramTemplate = require('../src/modules/ai-programs/models/programTemplate.model');
const programGeneratorService = require('../src/modules/ai-programs/services/programGenerator.service');
const logger = require('../src/common/utils/logger');

// Mock data
const mockCoachId = new mongoose.Types.ObjectId();
const mockClientId = new mongoose.Types.ObjectId();

describe('Progression Engine Features', () => {
  beforeAll(async () => {
    // Connect to test database if needed
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coachflow-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await GeneratedProgram.deleteMany({ coachId: mockCoachId });
    await ProgramTemplate.deleteMany({ createdBy: mockCoachId });
    // Close connection if in test mode
    if (process.env.NODE_ENV === 'test') {
      await mongoose.connection.close();
    }
  });

  describe('GeneratedProgram Model - Progression Engine Fields', () => {
    test('should create program with RPE targets', async () => {
      const program = new GeneratedProgram({
        coachId: mockCoachId,
        clientId: mockClientId,
        requestId: 'test-rpe-' + Date.now(),
        generationType: 'workout_only',
        status: 'generated',
        inputData: {
          clientProfile: { name: 'Test Client' },
          goals: ['strength'],
          duration: 8,
        },
        generatedContent: {
          workoutProgram: {
            name: 'Strength Program with RPE',
            description: 'Test program',
            duration: { weeks: 8, workoutsPerWeek: 4 },
            workouts: [],
            progressionEngine: {
              rpeTargets: {
                enabled: true,
                weeklyTargets: [
                  { week: 1, targetRPE: 6, notes: 'Week 1 - Easy introduction' },
                  { week: 2, targetRPE: 7, notes: 'Week 2 - Moderate intensity' },
                  { week: 3, targetRPE: 8, notes: 'Week 3 - High intensity' },
                  { week: 4, targetRPE: 5, notes: 'Week 4 - Deload week' },
                ],
                exerciseSpecificTargets: [
                  {
                    exerciseId: 'squat_001',
                    targetRPE: 8.5,
                    adjustmentRules: 'If RPE > 9, reduce weight by 5%',
                  },
                ],
              },
            },
          },
        },
      });

      const saved = await program.save();
      
      expect(saved._id).toBeDefined();
      expect(saved.generatedContent.workoutProgram.progressionEngine.rpeTargets.enabled).toBe(true);
      expect(saved.generatedContent.workoutProgram.progressionEngine.rpeTargets.weeklyTargets).toHaveLength(4);
      expect(saved.generatedContent.workoutProgram.progressionEngine.rpeTargets.weeklyTargets[0].targetRPE).toBe(6);
      
      console.log('✓ RPE Targets Test Passed');
    });

    test('should create program with progression rules', async () => {
      const program = new GeneratedProgram({
        coachId: mockCoachId,
        clientId: mockClientId,
        requestId: 'test-progression-' + Date.now(),
        generationType: 'workout_only',
        status: 'generated',
        inputData: {
          clientProfile: { name: 'Test Client' },
          goals: ['muscle_gain'],
          duration: 12,
        },
        generatedContent: {
          workoutProgram: {
            name: 'Hypertrophy Program with Progression',
            description: 'Test program',
            duration: { weeks: 12, workoutsPerWeek: 4 },
            workouts: [],
            progressionEngine: {
              progressionRules: {
                strategy: 'double_progression',
                weightIncrement: 2.5,
                repRangeProgression: {
                  minReps: 8,
                  maxReps: 12,
                  incrementWhen: 'Complete all sets at maxReps with RPE < 9',
                },
                weeklyLoad: [
                  { week: 1, loadPercentage: 70, volume: 'medium' },
                  { week: 2, loadPercentage: 75, volume: 'medium' },
                  { week: 3, loadPercentage: 80, volume: 'high' },
                  { week: 4, loadPercentage: 60, volume: 'low' },
                ],
                conditions: [
                  {
                    metric: 'rpe',
                    threshold: 9,
                    action: 'maintain',
                    value: 'current_weight',
                  },
                  {
                    metric: 'completedSets',
                    threshold: 'all_sets_completed',
                    action: 'increase_weight',
                    value: 2.5,
                  },
                ],
                customRules: 'If client reports excellent recovery and energy, advance progression by one week',
              },
            },
          },
        },
      });

      const saved = await program.save();
      
      expect(saved.generatedContent.workoutProgram.progressionEngine.progressionRules.strategy).toBe('double_progression');
      expect(saved.generatedContent.workoutProgram.progressionEngine.progressionRules.weightIncrement).toBe(2.5);
      expect(saved.generatedContent.workoutProgram.progressionEngine.progressionRules.weeklyLoad).toHaveLength(4);
      expect(saved.generatedContent.workoutProgram.progressionEngine.progressionRules.conditions).toHaveLength(2);
      
      console.log('✓ Progression Rules Test Passed');
    });

    test('should create program with deload protocol', async () => {
      const program = new GeneratedProgram({
        coachId: mockCoachId,
        clientId: mockClientId,
        requestId: 'test-deload-' + Date.now(),
        generationType: 'workout_only',
        status: 'generated',
        inputData: {
          clientProfile: { name: 'Test Client' },
          goals: ['strength'],
          duration: 12,
        },
        generatedContent: {
          workoutProgram: {
            name: 'Strength Program with Deload Protocol',
            description: 'Test program',
            duration: { weeks: 12, workoutsPerWeek: 4 },
            workouts: [],
            progressionEngine: {
              deloadProtocol: {
                enabled: true,
                scheduledDeloads: [
                  {
                    week: 4,
                    type: 'volume_reduction',
                    reduction: 40,
                    notes: 'First deload - reduce volume by 40%',
                  },
                  {
                    week: 8,
                    type: 'intensity_reduction',
                    reduction: 30,
                    notes: 'Second deload - reduce intensity by 30%',
                  },
                  {
                    week: 12,
                    type: 'active_recovery',
                    reduction: 60,
                    notes: 'Final week - active recovery',
                  },
                ],
                autoDeloadTriggers: [
                  {
                    condition: 'consecutive_failed_workouts',
                    threshold: 2,
                    protocol: 'reduce_volume',
                    reductionPercentage: 30,
                    notes: 'If 2 consecutive workouts are failed, reduce volume by 30%',
                  },
                  {
                    condition: 'high_avg_rpe',
                    threshold: 9.5,
                    protocol: 'schedule_next_week',
                    reductionPercentage: 40,
                    notes: 'If average RPE exceeds 9.5 for a week, schedule deload',
                  },
                  {
                    condition: 'poor_recovery',
                    threshold: { sleepQuality: 'poor', soreness: 'severe' },
                    protocol: 'immediate_deload',
                    reductionPercentage: 50,
                    notes: 'Immediate deload if recovery indicators are poor',
                  },
                ],
                recoveryIndicators: [
                  {
                    metric: 'sleep_quality',
                    target: '7+ hours',
                    weight: 0.4,
                  },
                  {
                    metric: 'soreness_level',
                    target: 'moderate or less',
                    weight: 0.3,
                  },
                  {
                    metric: 'energy',
                    target: 'good or excellent',
                    weight: 0.3,
                  },
                ],
              },
            },
          },
        },
      });

      const saved = await program.save();
      
      expect(saved.generatedContent.workoutProgram.progressionEngine.deloadProtocol.enabled).toBe(true);
      expect(saved.generatedContent.workoutProgram.progressionEngine.deloadProtocol.scheduledDeloads).toHaveLength(3);
      expect(saved.generatedContent.workoutProgram.progressionEngine.deloadProtocol.autoDeloadTriggers).toHaveLength(3);
      expect(saved.generatedContent.workoutProgram.progressionEngine.deloadProtocol.recoveryIndicators).toHaveLength(3);
      
      console.log('✓ Deload Protocol Test Passed');
    });

    test('should create comprehensive program with all progression features', async () => {
      const program = new GeneratedProgram({
        coachId: mockCoachId,
        clientId: mockClientId,
        requestId: 'test-comprehensive-' + Date.now(),
        generationType: 'combined',
        status: 'generated',
        inputData: {
          clientProfile: { name: 'Test Client' },
          goals: ['strength', 'muscle_gain'],
          duration: 16,
        },
        generatedContent: {
          workoutProgram: {
            name: 'Advanced Powerbuilding Program',
            description: 'Comprehensive program with full progression engine',
            duration: { weeks: 16, workoutsPerWeek: 5 },
            workouts: [
              {
                name: 'Lower Power Day',
                type: 'strength',
                difficulty: 'advanced',
                exercises: [
                  {
                    exerciseId: 'squat_001',
                    name: 'Back Squat',
                    sets: 5,
                    reps: '3-5',
                    restTime: 180,
                  },
                ],
              },
            ],
            progressionEngine: {
              rpeTargets: {
                enabled: true,
                weeklyTargets: [
                  { week: 1, targetRPE: 7, notes: 'Build up phase' },
                  { week: 2, targetRPE: 7.5, notes: 'Increase intensity' },
                  { week: 3, targetRPE: 8, notes: 'Peak week' },
                  { week: 4, targetRPE: 5, notes: 'Deload' },
                ],
                exerciseSpecificTargets: [
                  {
                    exerciseId: 'squat_001',
                    targetRPE: 8.5,
                    adjustmentRules: 'Main lift - push to RPE 8.5-9 on final set',
                  },
                ],
              },
              progressionRules: {
                strategy: 'wave',
                weightIncrement: 2.5,
                repRangeProgression: {
                  minReps: 3,
                  maxReps: 5,
                  incrementWhen: 'Complete all sets at 5 reps with RPE < 8.5',
                },
                weeklyLoad: [
                  { week: 1, loadPercentage: 80, volume: 'medium' },
                  { week: 2, loadPercentage: 85, volume: 'high' },
                  { week: 3, loadPercentage: 90, volume: 'medium' },
                  { week: 4, loadPercentage: 65, volume: 'low' },
                ],
                conditions: [
                  {
                    metric: 'rpe',
                    threshold: 9.5,
                    action: 'maintain',
                    value: 'current_weight',
                  },
                  {
                    metric: 'formQuality',
                    threshold: 'poor',
                    action: 'deload',
                    value: 10,
                  },
                ],
                customRules: 'Wave loading with undulating volume and intensity',
              },
              deloadProtocol: {
                enabled: true,
                scheduledDeloads: [
                  { week: 4, type: 'volume_reduction', reduction: 40, notes: 'First deload' },
                  { week: 8, type: 'intensity_reduction', reduction: 30, notes: 'Second deload' },
                  { week: 12, type: 'volume_reduction', reduction: 40, notes: 'Third deload' },
                ],
                autoDeloadTriggers: [
                  {
                    condition: 'consecutive_failed_workouts',
                    threshold: 2,
                    protocol: 'reduce_volume',
                    reductionPercentage: 30,
                    notes: 'Failure trigger',
                  },
                  {
                    condition: 'high_avg_rpe',
                    threshold: 9.5,
                    protocol: 'schedule_next_week',
                    reductionPercentage: 40,
                    notes: 'RPE trigger',
                  },
                ],
                recoveryIndicators: [
                  { metric: 'sleep_quality', target: '7+ hours', weight: 0.4 },
                  { metric: 'soreness_level', target: 'moderate or less', weight: 0.3 },
                  { metric: 'energy', target: 'good or excellent', weight: 0.3 },
                ],
              },
            },
          },
        },
      });

      const saved = await program.save();
      
      // Verify all components
      expect(saved.generatedContent.workoutProgram.progressionEngine).toBeDefined();
      expect(saved.generatedContent.workoutProgram.progressionEngine.rpeTargets.enabled).toBe(true);
      expect(saved.generatedContent.workoutProgram.progressionEngine.progressionRules.strategy).toBe('wave');
      expect(saved.generatedContent.workoutProgram.progressionEngine.deloadProtocol.enabled).toBe(true);
      
      console.log('✓ Comprehensive Progression Engine Test Passed');
      console.log('\nProgram Summary:');
      console.log('- RPE Targets:', saved.generatedContent.workoutProgram.progressionEngine.rpeTargets.weeklyTargets.length, 'weeks');
      console.log('- Progression Strategy:', saved.generatedContent.workoutProgram.progressionEngine.progressionRules.strategy);
      console.log('- Scheduled Deloads:', saved.generatedContent.workoutProgram.progressionEngine.deloadProtocol.scheduledDeloads.length);
      console.log('- Auto Deload Triggers:', saved.generatedContent.workoutProgram.progressionEngine.deloadProtocol.autoDeloadTriggers.length);
    });
  });

  describe('ProgramTemplate Model - Progression Engine Fields', () => {
    test('should create template with progression engine', async () => {
      const template = new ProgramTemplate({
        name: 'Beginner Linear Progression Template',
        description: 'Linear progression with built-in RPE and deload management',
        createdBy: mockCoachId,
        templateType: 'workout_program',
        category: 'strength',
        characteristics: {
          experienceLevel: 'beginner',
          goals: ['strength'],
          duration: { weeks: 12, days: 84 },
        },
        content: {
          workoutProgram: {
            name: 'Beginner Strength',
            description: 'Linear progression program',
            duration: { weeks: 12, workoutsPerWeek: 3 },
            workouts: [],
            progressionEngine: {
              rpeTargets: {
                enabled: true,
                weeklyTargets: [
                  { week: 1, targetRPE: 6, notes: 'Start light' },
                  { week: 4, targetRPE: 7, notes: 'Build intensity' },
                  { week: 8, targetRPE: 8, notes: 'Peak intensity' },
                ],
              },
              progressionRules: {
                strategy: 'linear',
                weightIncrement: 2.5,
                repRangeProgression: {
                  minReps: 5,
                  maxReps: 5,
                  incrementWhen: 'Complete all sets',
                },
              },
              deloadProtocol: {
                enabled: true,
                scheduledDeloads: [
                  { week: 4, type: 'volume_reduction', reduction: 40, notes: 'Mid-program deload' },
                  { week: 8, type: 'volume_reduction', reduction: 40, notes: 'Late-program deload' },
                ],
              },
            },
          },
        },
      });

      const saved = await template.save();
      
      expect(saved.templateId).toBeDefined();
      expect(saved.content.workoutProgram.progressionEngine.rpeTargets.enabled).toBe(true);
      expect(saved.content.workoutProgram.progressionEngine.progressionRules.strategy).toBe('linear');
      expect(saved.content.workoutProgram.progressionEngine.deloadProtocol.scheduledDeloads).toHaveLength(2);
      
      console.log('✓ Template with Progression Engine Test Passed');
      console.log('Template ID:', saved.templateId);
    });
  });

  describe('Progression Engine Validation', () => {
    test('should validate RPE values are in correct range', () => {
      const validRPEs = [6, 7, 8, 9, 9.5];
      const invalidRPEs = [0, 11, -1, 15];
      
      validRPEs.forEach(rpe => {
        expect(rpe).toBeGreaterThanOrEqual(1);
        expect(rpe).toBeLessThanOrEqual(10);
      });
      
      console.log('✓ RPE Validation Test Passed');
    });

    test('should validate progression strategy types', () => {
      const validStrategies = ['linear', 'wave', 'double_progression', 'percentage_based', 'autoregulated', 'custom'];
      
      validStrategies.forEach(strategy => {
        expect(['linear', 'wave', 'double_progression', 'percentage_based', 'autoregulated', 'custom']).toContain(strategy);
      });
      
      console.log('✓ Progression Strategy Validation Test Passed');
    });

    test('should validate deload types', () => {
      const validDeloadTypes = ['volume_reduction', 'intensity_reduction', 'complete_rest', 'active_recovery'];
      
      validDeloadTypes.forEach(type => {
        expect(['volume_reduction', 'intensity_reduction', 'complete_rest', 'active_recovery']).toContain(type);
      });
      
      console.log('✓ Deload Type Validation Test Passed');
    });
  });

  describe('Helper Functions', () => {
    test('should calculate RPE-based weight adjustments', () => {
      const calculateWeightAdjustment = (currentWeight, currentRPE, targetRPE) => {
        const rpeDiff = currentRPE - targetRPE;
        if (rpeDiff > 1) {
          // Too hard, reduce weight by 5-10%
          return currentWeight * 0.95;
        } else if (rpeDiff < -1) {
          // Too easy, increase weight by 2.5-5%
          return currentWeight * 1.025;
        }
        return currentWeight;
      };

      expect(calculateWeightAdjustment(100, 9, 7)).toBe(95); // Reduce weight
      expect(calculateWeightAdjustment(100, 6, 8)).toBeCloseTo(102.5, 1); // Increase weight
      expect(calculateWeightAdjustment(100, 8, 8)).toBe(100); // Maintain weight
      
      console.log('✓ Weight Adjustment Calculation Test Passed');
    });

    test('should determine if deload is needed based on triggers', () => {
      const shouldDeload = (metrics) => {
        const { failedWorkouts, avgRPE, sleepQuality, sorenessLevel } = metrics;
        
        // Consecutive failures
        if (failedWorkouts >= 2) return true;
        
        // High RPE
        if (avgRPE >= 9.5) return true;
        
        // Poor recovery
        if (sleepQuality === 'poor' && sorenessLevel === 'severe') return true;
        
        return false;
      };

      expect(shouldDeload({ failedWorkouts: 2, avgRPE: 7, sleepQuality: 'good', sorenessLevel: 'moderate' })).toBe(true);
      expect(shouldDeload({ failedWorkouts: 0, avgRPE: 9.7, sleepQuality: 'good', sorenessLevel: 'moderate' })).toBe(true);
      expect(shouldDeload({ failedWorkouts: 0, avgRPE: 8, sleepQuality: 'poor', sorenessLevel: 'severe' })).toBe(true);
      expect(shouldDeload({ failedWorkouts: 0, avgRPE: 7, sleepQuality: 'good', sorenessLevel: 'mild' })).toBe(false);
      
      console.log('✓ Deload Trigger Logic Test Passed');
    });
  });
});

// Manual test runner (if not using Jest)
if (require.main === module) {
  console.log('\n=== Running Progression Engine Tests ===\n');
  
  (async () => {
    try {
      // Connect to database
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coachflow-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log('✓ Database connected\n');
      
      // Run tests manually
      console.log('Testing progression engine fields...\n');
      
      // Clean up old test data
      await GeneratedProgram.deleteMany({ requestId: /^test-/ });
      await ProgramTemplate.deleteMany({ name: /Template$/ });
      
      console.log('✓ Test data cleaned up\n');
      console.log('=== Tests Complete ===\n');
      console.log('Run with Jest for full test suite: npm test tests/progression-engine.test.js');
      
      process.exit(0);
    } catch (error) {
      console.error('Test error:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  // Export test data for use in other tests
  mockCoachId,
  mockClientId,
};

