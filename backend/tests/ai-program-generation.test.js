/**
 * AI Program Generation Tests
 * Comprehensive tests for AI-assisted program generation
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/modules/auth/models/user.model');
const ClientProfile = require('../src/modules/clients/models/clientProfile.model');
const GeneratedProgram = require('../src/modules/ai-programs/models/generatedProgram.model');
const Program = require('../src/modules/workouts/models/program.model');
const MealPlan = require('../src/modules/nutrition/models/mealPlan.model');
const jwt = require('jsonwebtoken');
const config = require('../src/common/config');

describe('AI Program Generation', () => {
  let coachToken;
  let coachId;
  let clientId;
  let clientProfile;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodb.testUri);
    }
  });

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await ClientProfile.deleteMany({});
    await GeneratedProgram.deleteMany({});
    await Program.deleteMany({});
    await MealPlan.deleteMany({});

    // Create coach user
    const coach = await User.create({
      name: 'Test Coach',
      email: 'coach@test.com',
      password: 'Password123!',
      role: 'coach',
    });
    coachId = coach._id;

    // Create client user
    const client = await User.create({
      name: 'Test Client',
      email: 'client@test.com',
      password: 'Password123!',
      role: 'client',
    });
    clientId = client._id;

    // Create comprehensive client profile
    clientProfile = await ClientProfile.create({
      userId: clientId,
      coachId: coachId,
      onboarding: {
        isCompleted: true,
        completedAt: new Date(),
        currentStep: 'completed',
      },
      personalInfo: {
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        height: 180,
        weight: 80,
        bodyFatPercentage: 15,
      },
      fitnessProfile: {
        experienceLevel: 'intermediate',
        goals: ['muscle_gain', 'strength'],
        primaryGoal: 'muscle_gain',
        targetWeight: 85,
        activityLevel: 'moderately_active',
        yearsOfTraining: 3,
      },
      medicalInfo: {
        injuries: [],
        chronicConditions: [],
        medications: [],
        allergies: [],
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
      preferences: {
        preferredExercises: ['Bench Press', 'Squats'],
        dislikedExercises: ['Burpees'],
      },
      nutritionPreferences: {
        dietType: 'none',
        calorieTarget: 2500,
        macroTargets: {
          protein: 150,
          carbs: 280,
          fats: 70,
        },
        mealsPerDay: 4,
        dietaryRestrictions: [],
        foodAllergies: [],
        foodDislikes: ['Brussels sprouts'],
      },
    });

    // Generate coach token
    coachToken = jwt.sign(
      { userId: coachId, role: 'coach' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/v1/ai-programs/status', () => {
    it('should return AI service status', async () => {
      const response = await request(app)
        .get('/api/v1/ai-programs/status')
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('enabled');
      expect(response.body.data).toHaveProperty('service');
      expect(response.body.data).toHaveProperty('features');
      expect(response.body.data.features).toHaveProperty('workoutGeneration');
      expect(response.body.data.features).toHaveProperty('nutritionGeneration');
      expect(response.body.data.features).toHaveProperty('combinedGeneration');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/ai-programs/status')
        .expect(401);
    });
  });

  describe('POST /api/v1/ai-programs/generate/complete', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/ai-programs/generate/complete')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate clientId format', async () => {
      const response = await request(app)
        .post('/api/v1/ai-programs/generate/complete')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ clientId: 'invalid-id' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate duration range', async () => {
      const response = await request(app)
        .post('/api/v1/ai-programs/generate/complete')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          clientId: clientId.toString(),
          duration: 100, // Too long
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate goals array', async () => {
      const response = await request(app)
        .post('/api/v1/ai-programs/generate/complete')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          clientId: clientId.toString(),
          goals: 'not-an-array',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    // Note: Actual generation tests would require OpenAI API key
    // These are integration tests that should be run with mocked OpenAI service
    describe('with OpenAI enabled', () => {
      beforeEach(() => {
        // This test assumes OpenAI is properly configured
        // In a real test environment, you would mock the OpenAI service
      });

      it.skip('should generate complete program', async () => {
        const response = await request(app)
          .post('/api/v1/ai-programs/generate/complete')
          .set('Authorization', `Bearer ${coachToken}`)
          .send({
            clientId: clientId.toString(),
            duration: 12,
            additionalRequirements: 'Focus on compound movements',
          })
          .expect(201);

        expect(response.body.data).toHaveProperty('generatedContent');
        expect(response.body.data.generatedContent).toHaveProperty('workoutProgram');
        expect(response.body.data.generatedContent).toHaveProperty('nutritionPlan');
        expect(response.body.data.status).toBe('generated');
      });
    });
  });

  describe('POST /api/v1/ai-programs/generate/workout', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/ai-programs/generate/workout')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it.skip('should generate workout program only', async () => {
      const response = await request(app)
        .post('/api/v1/ai-programs/generate/workout')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          clientId: clientId.toString(),
          duration: 8,
        })
        .expect(201);

      expect(response.body.data.generationType).toBe('workout_only');
      expect(response.body.data.generatedContent).toHaveProperty('workoutProgram');
      expect(response.body.data.generatedContent).not.toHaveProperty('nutritionPlan');
    });
  });

  describe('POST /api/v1/ai-programs/generate/nutrition', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/ai-programs/generate/nutrition')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it.skip('should generate nutrition plan only', async () => {
      const response = await request(app)
        .post('/api/v1/ai-programs/generate/nutrition')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          clientId: clientId.toString(),
          duration: 4,
        })
        .expect(201);

      expect(response.body.data.generationType).toBe('meal_plan_only');
      expect(response.body.data.generatedContent).toHaveProperty('nutritionPlan');
      expect(response.body.data.generatedContent).not.toHaveProperty('workoutProgram');
    });
  });

  describe('GET /api/v1/ai-programs', () => {
    beforeEach(async () => {
      // Create some generated programs
      await GeneratedProgram.create({
        coachId,
        clientId,
        requestId: 'test-request-1',
        generationType: 'combined',
        status: 'generated',
        inputData: { clientProfile: {} },
        generatedContent: {
          workoutProgram: { name: 'Test Program 1' },
          nutritionPlan: { name: 'Test Plan 1' },
        },
      });

      await GeneratedProgram.create({
        coachId,
        clientId,
        requestId: 'test-request-2',
        generationType: 'workout_only',
        status: 'approved',
        inputData: { clientProfile: {} },
        generatedContent: {
          workoutProgram: { name: 'Test Program 2' },
        },
      });
    });

    it('should list all generated programs for coach', async () => {
      const response = await request(app)
        .get('/api/v1/ai-programs')
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it('should filter by clientId', async () => {
      const response = await request(app)
        .get(`/api/v1/ai-programs?clientId=${clientId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/ai-programs?status=approved')
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('approved');
    });

    it('should filter by generationType', async () => {
      const response = await request(app)
        .get('/api/v1/ai-programs?generationType=workout_only')
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].generationType).toBe('workout_only');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/ai-programs?limit=1')
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/ai-programs/:id', () => {
    let generatedProgramId;

    beforeEach(async () => {
      const program = await GeneratedProgram.create({
        coachId,
        clientId,
        requestId: 'test-request-3',
        generationType: 'combined',
        status: 'generated',
        inputData: { clientProfile: {} },
        generatedContent: {
          workoutProgram: { name: 'Test Program' },
          nutritionPlan: { name: 'Test Plan' },
        },
      });
      generatedProgramId = program._id;
    });

    it('should get single generated program', async () => {
      const response = await request(app)
        .get(`/api/v1/ai-programs/${generatedProgramId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data._id).toBe(generatedProgramId.toString());
      expect(response.body.data.generatedContent).toBeDefined();
    });

    it('should return 404 for non-existent program', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/v1/ai-programs/${fakeId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(404);
    });

    it('should prevent access to other coach programs', async () => {
      // Create another coach
      const otherCoach = await User.create({
        name: 'Other Coach',
        email: 'other@test.com',
        password: 'Password123!',
        role: 'coach',
      });

      const otherToken = jwt.sign(
        { userId: otherCoach._id, role: 'coach' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      await request(app)
        .get(`/api/v1/ai-programs/${generatedProgramId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('PATCH /api/v1/ai-programs/:id/review', () => {
    let generatedProgramId;

    beforeEach(async () => {
      const program = await GeneratedProgram.create({
        coachId,
        clientId,
        requestId: 'test-request-4',
        generationType: 'combined',
        status: 'generated',
        inputData: { clientProfile: {} },
        generatedContent: {
          workoutProgram: { name: 'Test Program' },
          nutritionPlan: { name: 'Test Plan' },
        },
      });
      generatedProgramId = program._id;
    });

    it('should review and approve program', async () => {
      const response = await request(app)
        .patch(`/api/v1/ai-programs/${generatedProgramId}/review`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          status: 'approved',
          reviewNotes: 'Looks great!',
          quality: {
            coachRating: 5,
            wasUseful: true,
            feedback: 'Well structured',
          },
        })
        .expect(200);

      expect(response.body.data.status).toBe('approved');
      expect(response.body.data.reviewNotes).toBe('Looks great!');
      expect(response.body.data.quality.coachRating).toBe(5);
    });

    it('should reject program', async () => {
      const response = await request(app)
        .patch(`/api/v1/ai-programs/${generatedProgramId}/review`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          status: 'rejected',
          reviewNotes: 'Needs revision',
        })
        .expect(200);

      expect(response.body.data.status).toBe('rejected');
    });

    it('should validate status values', async () => {
      await request(app)
        .patch(`/api/v1/ai-programs/${generatedProgramId}/review`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          status: 'invalid_status',
        })
        .expect(400);
    });

    it('should validate rating range', async () => {
      await request(app)
        .patch(`/api/v1/ai-programs/${generatedProgramId}/review`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          quality: {
            coachRating: 10, // Invalid
          },
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/ai-programs/:id/apply', () => {
    let generatedProgramId;

    beforeEach(async () => {
      const program = await GeneratedProgram.create({
        coachId,
        clientId,
        requestId: 'test-request-5',
        generationType: 'combined',
        status: 'approved',
        inputData: { clientProfile: {} },
        generatedContent: {
          workoutProgram: {
            name: 'Applied Test Program',
            description: 'Test description',
            duration: { weeks: 12, workoutsPerWeek: 4 },
            workouts: [
              {
                name: 'Day 1',
                type: 'strength',
                difficulty: 'intermediate',
                duration: 60,
                exercises: [],
                targetMuscles: ['chest'],
                equipment: ['barbell'],
              },
            ],
          },
          nutritionPlan: {
            name: 'Applied Test Plan',
            description: 'Test nutrition',
            dailyTargets: {
              calories: 2500,
              protein: 150,
              carbs: 280,
              fats: 70,
            },
            meals: [],
          },
        },
      });
      generatedProgramId = program._id;
    });

    it('should apply program to client', async () => {
      const response = await request(app)
        .post(`/api/v1/ai-programs/${generatedProgramId}/apply`)
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data.generatedProgram.status).toBe('applied');
      expect(response.body.data.program).toBeDefined();
      expect(response.body.data.mealPlan).toBeDefined();

      // Verify actual documents were created
      const program = await Program.findById(response.body.data.program._id);
      expect(program).toBeDefined();
      expect(program.name).toBe('Applied Test Program');

      const mealPlan = await MealPlan.findById(response.body.data.mealPlan._id);
      expect(mealPlan).toBeDefined();
      expect(mealPlan.name).toBe('Applied Test Plan');
    });

    it('should update generated program with created IDs', async () => {
      const response = await request(app)
        .post(`/api/v1/ai-programs/${generatedProgramId}/apply`)
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(200);

      const updatedGenProgram = await GeneratedProgram.findById(generatedProgramId);
      expect(updatedGenProgram.generatedContent.workoutProgram.programId).toBeDefined();
      expect(updatedGenProgram.generatedContent.nutritionPlan.mealPlanId).toBeDefined();
      expect(updatedGenProgram.appliedBy.toString()).toBe(coachId.toString());
      expect(updatedGenProgram.appliedAt).toBeDefined();
    });
  });

  describe('DELETE /api/v1/ai-programs/:id', () => {
    let generatedProgramId;

    beforeEach(async () => {
      const program = await GeneratedProgram.create({
        coachId,
        clientId,
        requestId: 'test-request-6',
        generationType: 'combined',
        status: 'generated',
        inputData: { clientProfile: {} },
        generatedContent: {
          workoutProgram: { name: 'Test Program' },
        },
      });
      generatedProgramId = program._id;
    });

    it('should archive program', async () => {
      await request(app)
        .delete(`/api/v1/ai-programs/${generatedProgramId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(200);

      const program = await GeneratedProgram.findById(generatedProgramId);
      expect(program.status).toBe('archived');
    });

    it('should return 404 for non-existent program', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/v1/ai-programs/${fakeId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .expect(404);
    });
  });

  describe('Data Retention', () => {
    it('should set scheduled deletion date on creation', async () => {
      const program = await GeneratedProgram.create({
        coachId,
        clientId,
        requestId: 'test-request-retention',
        generationType: 'combined',
        status: 'generated',
        inputData: { clientProfile: {} },
        generatedContent: {
          workoutProgram: { name: 'Test' },
        },
      });

      expect(program.scheduledDeletionDate).toBeDefined();
      expect(program.scheduledDeletionDate).toBeInstanceOf(Date);
      
      // Should be 180 days in the future (default)
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 180);
      
      const diff = Math.abs(program.scheduledDeletionDate - expectedDate);
      expect(diff).toBeLessThan(1000); // Within 1 second
    });

    it('should respect custom retention days', async () => {
      const program = await GeneratedProgram.create({
        coachId,
        clientId,
        requestId: 'test-request-custom-retention',
        generationType: 'combined',
        status: 'generated',
        inputData: { clientProfile: {} },
        generatedContent: {
          workoutProgram: { name: 'Test' },
        },
        dataRetentionDays: 90,
      });

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 90);
      
      const diff = Math.abs(program.scheduledDeletionDate - expectedDate);
      expect(diff).toBeLessThan(1000);
    });
  });
});

