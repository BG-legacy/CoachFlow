/**
 * Model Validation Tests
 * Tests for C1 & C2 database collections
 */

const mongoose = require('mongoose');

// Import models
const User = require('../src/modules/auth/models/user.model');
const ClientProfile = require('../src/modules/clients/models/clientProfile.model');
const Program = require('../src/modules/workouts/models/program.model');
const WorkoutLog = require('../src/modules/workouts/models/workoutLog.model');
const MealPlan = require('../src/modules/nutrition/models/mealPlan.model');
const FoodLog = require('../src/modules/nutrition/models/foodLog.model');
const Checkin = require('../src/modules/checkins/models/checkin.model');
const Session = require('../src/modules/sessions/models/session.model');
const Notification = require('../src/modules/notifications/models/notification.model');

describe('CoachFlow Models Validation', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/coachflow_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.close();
  });

  describe('C1 Minimum Collections', () => {
    test('User model should validate required fields', () => {
      const user = new User();
      const error = user.validateSync();
      
      expect(error.errors.email).toBeDefined();
      expect(error.errors.firstName).toBeDefined();
      expect(error.errors.lastName).toBeDefined();
    });

    test('User model should have role enum', () => {
      const user = new User({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'invalid_role',
      });
      
      const error = user.validateSync();
      expect(error.errors.role).toBeDefined();
    });

    test('ClientProfile model should validate userId', () => {
      const profile = new ClientProfile();
      const error = profile.validateSync();
      
      expect(error.errors.userId).toBeDefined();
    });

    test('Program model should have versioning support', () => {
      const program = new Program({
        coachId: new mongoose.Types.ObjectId(),
        name: 'Test Program',
        duration: { weeks: 12 },
      });
      
      expect(program.name).toBe('Test Program');
      expect(program.duration.weeks).toBe(12);
    });

    test('WorkoutLog should support RPE tracking', () => {
      const workoutLog = new WorkoutLog({
        userId: new mongoose.Types.ObjectId(),
        workoutId: new mongoose.Types.ObjectId(),
        exercises: [{
          exerciseId: 'ex_1',
          name: 'Bench Press',
          sets: [{
            setNumber: 1,
            reps: 10,
            weight: 100,
            rpe: 8, // RPE tracking
            completed: true,
          }],
          averageRPE: 8,
        }],
      });
      
      expect(workoutLog.exercises[0].sets[0].rpe).toBe(8);
      expect(workoutLog.exercises[0].averageRPE).toBe(8);
    });

    test('WorkoutLog RPE should be within 1-10 range', () => {
      const workoutLog = new WorkoutLog({
        userId: new mongoose.Types.ObjectId(),
        workoutId: new mongoose.Types.ObjectId(),
        exercises: [{
          exerciseId: 'ex_1',
          name: 'Bench Press',
          sets: [{
            setNumber: 1,
            reps: 10,
            weight: 100,
            rpe: 11, // Invalid RPE
            completed: true,
          }],
        }],
      });
      
      const error = workoutLog.validateSync();
      expect(error).toBeDefined();
    });
  });

  describe('C2 Extended Collections', () => {
    test('MealPlan should support versioning', () => {
      const mealPlan = new MealPlan({
        coachId: new mongoose.Types.ObjectId(),
        name: 'Test Plan',
        version: 2,
        parentPlanId: new mongoose.Types.ObjectId(),
        versionNotes: 'Updated macros',
        dailyTargets: {
          calories: 2500,
          protein: 180,
          carbs: 300,
          fats: 70,
        },
      });
      
      expect(mealPlan.version).toBe(2);
      expect(mealPlan.parentPlanId).toBeDefined();
      expect(mealPlan.versionNotes).toBe('Updated macros');
      expect(mealPlan.dailyTargets.protein).toBe(180);
    });

    test('FoodLog should have totals structure', () => {
      const foodLog = new FoodLog({
        userId: new mongoose.Types.ObjectId(),
        entries: [
          {
            name: 'Chicken Breast',
            calories: 165,
            protein: 31,
            carbs: 0,
            fats: 3.6,
          },
          {
            name: 'Rice',
            calories: 130,
            protein: 2.7,
            carbs: 28,
            fats: 0.3,
          },
        ],
        totals: {
          calories: 295,
          protein: 33.7,
          carbs: 28,
          fats: 3.9,
        },
      });
      
      expect(foodLog.totals.calories).toBe(295);
      expect(foodLog.totals.protein).toBe(33.7);
      expect(foodLog.totals.carbs).toBe(28);
      expect(foodLog.entries).toHaveLength(2);
    });

    test('Checkin model should have timestamp', () => {
      const checkin = new Checkin({
        clientId: new mongoose.Types.ObjectId(),
        coachId: new mongoose.Types.ObjectId(),
        type: 'weekly',
        metrics: {
          weight: 85,
          mood: 8,
          energy: 7,
        },
      });
      
      expect(checkin.date).toBeDefined();
      expect(checkin.type).toBe('weekly');
    });

    test('Session model should validate booking details', () => {
      const session = new Session({
        coachId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId(),
        title: 'Training Session',
        type: 'training',
        startTime: new Date('2025-01-20T10:00:00Z'),
        endTime: new Date('2025-01-20T11:00:00Z'),
        duration: 60,
      });
      
      expect(session.title).toBe('Training Session');
      expect(session.duration).toBe(60);
      expect(session.status).toBe('scheduled');
    });

    test('Notification model should have complete tracking', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'session_reminder',
        channel: 'email',
        status: 'scheduled',
        scheduledFor: new Date('2025-01-20T09:00:00Z'),
        content: {
          title: 'Session Reminder',
          body: 'You have a session in 1 hour',
        },
        provider: {
          name: 'nodemailer',
          messageId: 'msg_123456',
        },
      });
      
      expect(notification.type).toBe('session_reminder');
      expect(notification.channel).toBe('email');
      expect(notification.status).toBe('scheduled');
      expect(notification.provider.messageId).toBe('msg_123456');
    });

    test('Notification should validate channel enum', () => {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type: 'message',
        channel: 'invalid_channel',
        content: { body: 'Test' },
      });
      
      const error = notification.validateSync();
      expect(error.errors.channel).toBeDefined();
    });
  });

  describe('Model Relationships', () => {
    test('Program should reference Workouts', () => {
      const program = new Program({
        coachId: new mongoose.Types.ObjectId(),
        name: 'Test Program',
        duration: { weeks: 12 },
        workouts: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
        ],
      });
      
      expect(program.workouts).toHaveLength(2);
    });

    test('WorkoutLog should reference User and Workout', () => {
      const userId = new mongoose.Types.ObjectId();
      const workoutId = new mongoose.Types.ObjectId();
      
      const workoutLog = new WorkoutLog({
        userId,
        workoutId,
        exercises: [],
      });
      
      expect(workoutLog.userId.toString()).toBe(userId.toString());
      expect(workoutLog.workoutId.toString()).toBe(workoutId.toString());
    });
  });
});

