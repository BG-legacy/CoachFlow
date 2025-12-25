/**
 * Onboarding & Profile Management Tests
 * Tests for user onboarding flow and trainer constraint management
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/modules/auth/models/user.model');
const ClientProfile = require('../src/modules/clients/models/clientProfile.model');
const { AuditEvent } = require('../src/common/utils/auditLogger');

describe('Onboarding & Profile Management', () => {
  let clientToken;
  let coachToken;
  let clientUserId;
  let coachUserId;
  let profileId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/coachflow_test';
    await mongoose.connect(mongoUri);

    // Clean up test data
    await User.deleteMany({ email: /test.*@onboarding\.com/ });
    await ClientProfile.deleteMany({});
    await AuditEvent.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({ email: /test.*@onboarding\.com/ });
    await ClientProfile.deleteMany({});
    await AuditEvent.deleteMany({});
    await mongoose.connection.close();
  });

  // ========== SETUP: Create test users ==========
  describe('Setup: Create Test Users', () => {
    test('should create a client user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testclient@onboarding.com',
          password: 'SecureP@ssw0rd!2024',
          firstName: 'John',
          lastName: 'Doe',
          role: 'client',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      
      clientToken = res.body.data.accessToken;
      clientUserId = res.body.data.user._id;
    });

    test('should create a coach user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testcoach@onboarding.com',
          password: 'SecureC0@chP@ss!2024',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'coach',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      expect(res.status).toBe(201);
      coachToken = res.body.data.accessToken;
      coachUserId = res.body.data.user._id;
    });

    test('should create initial client profile', async () => {
      const res = await request(app)
        .post('/api/v1/clients/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.data.onboarding).toBeDefined();
      expect(res.body.data.onboarding.isCompleted).toBe(false);
      expect(res.body.data.onboarding.currentStep).toBe('goals');
      profileId = res.body.data._id;

      // Assign coach to client for constraint management tests
      const updated = await ClientProfile.findOneAndUpdate(
        { userId: clientUserId },
        { coachId: coachUserId },
        { new: true }
      );
      expect(updated.coachId.toString()).toBe(coachUserId);
    });
  });

  // ========== ONBOARDING STEP 1: GOALS ==========
  describe('Onboarding Step 1: Goals', () => {
    test('should update goals successfully', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/goals')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          fitnessProfile: {
            primaryGoal: 'muscle_gain',
            goals: ['muscle_gain', 'strength'],
            targetWeight: 85,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.fitnessProfile.primaryGoal).toBe('muscle_gain');
      expect(res.body.data.fitnessProfile.goals).toContain('muscle_gain');
      expect(res.body.data.onboarding.currentStep).toBe('experience');
      expect(res.body.data.onboarding.stepsCompleted).toHaveLength(1);
    });

    test('should fail without primary goal', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/goals')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          fitnessProfile: {
            goals: ['muscle_gain'],
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.error.details).toBeDefined();
    });

    test('should fail with invalid goal type', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/goals')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          fitnessProfile: {
            primaryGoal: 'invalid_goal',
            goals: ['invalid_goal'],
          },
        });

      expect(res.status).toBe(422);
    });

    test('should log audit event for step completion', async () => {
      const auditEvent = await AuditEvent.findOne({
        userId: clientUserId,
        eventType: 'ONBOARDING_STEP_COMPLETED',
        'details.step': 'goals',
      });

      expect(auditEvent).toBeDefined();
      expect(auditEvent.success).toBe(true);
    });
  });

  // ========== ONBOARDING STEP 2: EXPERIENCE ==========
  describe('Onboarding Step 2: Experience Level', () => {
    test('should update experience level successfully', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/experience')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          fitnessProfile: {
            experienceLevel: 'intermediate',
            activityLevel: 'moderately_active',
            yearsOfTraining: 2,
            previousPrograms: ['Starting Strength', 'PPL'],
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.fitnessProfile.experienceLevel).toBe('intermediate');
      expect(res.body.data.fitnessProfile.yearsOfTraining).toBe(2);
      expect(res.body.data.onboarding.currentStep).toBe('equipment');
    });

    test('should fail with invalid experience level', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/experience')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          fitnessProfile: {
            experienceLevel: 'super_advanced',
          },
        });

      expect(res.status).toBe(422);
    });
  });

  // ========== ONBOARDING STEP 3: EQUIPMENT ==========
  describe('Onboarding Step 3: Equipment', () => {
    test('should update equipment preferences successfully', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/equipment')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          equipment: {
            hasGymAccess: true,
            gymName: 'Test Gym',
            homeEquipment: ['dumbbells', 'bench', 'resistance_bands'],
            equipmentNotes: 'Have access to full gym + home equipment',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.equipment.hasGymAccess).toBe(true);
      expect(res.body.data.equipment.homeEquipment).toContain('dumbbells');
      expect(res.body.data.onboarding.currentStep).toBe('schedule');
    });

    test('should fail without gym access field', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/equipment')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          equipment: {
            homeEquipment: ['dumbbells'],
          },
        });

      expect(res.status).toBe(422);
    });

    test('should fail with invalid equipment type', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/equipment')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          equipment: {
            hasGymAccess: true,
            homeEquipment: ['invalid_equipment'],
          },
        });

      expect(res.status).toBe(422);
    });
  });

  // ========== ONBOARDING STEP 4: SCHEDULE ==========
  describe('Onboarding Step 4: Schedule', () => {
    test('should update schedule successfully', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/schedule')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          schedule: {
            availableDays: ['monday', 'wednesday', 'friday', 'saturday'],
            preferredTimeOfDay: 'evening',
            sessionDuration: 60,
            sessionsPerWeek: 4,
            timeZone: 'America/New_York',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.schedule.availableDays).toHaveLength(4);
      expect(res.body.data.schedule.sessionDuration).toBe(60);
      expect(res.body.data.schedule.sessionsPerWeek).toBe(4);
      expect(res.body.data.onboarding.currentStep).toBe('limitations');
    });

    test('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/schedule')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          schedule: {
            availableDays: ['monday'],
          },
        });

      expect(res.status).toBe(422);
    });

    test('should fail with invalid day', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/schedule')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          schedule: {
            availableDays: ['invalidday'],
            sessionDuration: 60,
            sessionsPerWeek: 3,
          },
        });

      expect(res.status).toBe(422);
    });

    test('should fail with invalid session duration', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/schedule')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          schedule: {
            availableDays: ['monday'],
            sessionDuration: 200, // Too long
            sessionsPerWeek: 3,
          },
        });

      expect(res.status).toBe(422);
    });
  });

  // ========== ONBOARDING STEP 5: LIMITATIONS ==========
  describe('Onboarding Step 5: Injuries & Limitations', () => {
    test('should update limitations successfully', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/limitations')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          medicalInfo: {
            injuries: [
              {
                type: 'Previous knee injury',
                severity: 'mild',
                affectedAreas: ['left knee'],
              },
            ],
            limitations: [
              {
                type: 'Limited shoulder mobility',
                description: 'Cannot perform overhead press',
                affectedExercises: ['overhead press', 'military press'],
              },
            ],
            doctorClearance: true,
            notes: 'Cleared for moderate exercise',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.medicalInfo.injuries).toHaveLength(1);
      expect(res.body.data.medicalInfo.doctorClearance).toBe(true);
      expect(res.body.data.onboarding.currentStep).toBe('nutrition');
    });

    test('should allow empty limitations', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/limitations')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          medicalInfo: {
            injuries: [],
            limitations: [],
            doctorClearance: false,
          },
        });

      expect(res.status).toBe(200);
    });
  });

  // ========== ONBOARDING STEP 6: NUTRITION ==========
  describe('Onboarding Step 6: Nutrition', () => {
    test('should update nutrition preferences and complete onboarding', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/nutrition')
        .set('Authorization', `Bearer ${clientToken}`)
        .set('User-Agent', 'CoachFlow-Test-Suite/1.0')
        .send({
          nutritionPreferences: {
            dietType: 'flexible_dieting',
            foodAllergies: [
              {
                allergen: 'Peanuts',
                severity: 'moderate',
              },
            ],
            foodDislikes: ['mushrooms', 'olives'],
            calorieTarget: 2500,
            mealsPerDay: 4,
            waterIntakeGoal: 3.5,
            nutritionNotes: 'Prefer whole foods',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.nutritionPreferences.dietType).toBe('flexible_dieting');
      expect(res.body.data.nutritionPreferences.calorieTarget).toBe(2500);
      expect(res.body.data.onboarding.isCompleted).toBe(true);
      expect(res.body.data.onboarding.currentStep).toBe('completed');
      expect(res.body.data.onboarding.completedAt).toBeDefined();
    });

    test('should fail with invalid diet type', async () => {
      // Create new client for this test
      const newClient = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testclient2@onboarding.com',
          password: 'Str0ng!P@ssword#99',
          firstName: 'Mike',
          lastName: 'Johnson',
          role: 'client',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      const newToken = newClient.body.data.accessToken;

      await request(app)
        .post('/api/v1/clients/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .send({});

      const res = await request(app)
        .post('/api/v1/clients/onboarding/nutrition')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          nutritionPreferences: {
            dietType: 'invalid_diet',
          },
        });

      expect(res.status).toBe(422);
    });

    test('should log onboarding completion audit event', async () => {
      const auditEvent = await AuditEvent.findOne({
        userId: clientUserId,
        eventType: 'ONBOARDING_COMPLETED',
      });

      expect(auditEvent).toBeDefined();
      expect(auditEvent.success).toBe(true);
    });
  });

  // ========== ONBOARDING STATUS ==========
  describe('Onboarding Status', () => {
    test('should get onboarding status', async () => {
      const res = await request(app)
        .get('/api/v1/clients/onboarding/status')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isCompleted).toBe(true);
      expect(res.body.data.currentStep).toBe('completed');
      expect(res.body.data.completionPercentage).toBe(100);
      expect(res.body.data.stepsCompleted).toHaveLength(6);
    });

    test('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/clients/onboarding/status');

      expect(res.status).toBe(401);
    });
  });

  // ========== PROFILE UPDATES (PARTIAL) ==========
  describe('Profile Partial Updates', () => {
    test('should allow partial profile updates after onboarding', async () => {
      const res = await request(app)
        .put('/api/v1/clients/profile/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          personalInfo: {
            height: 180,
            weight: 78,
            gender: 'male',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.personalInfo.height).toBe(180);
      expect(res.body.data.personalInfo.weight).toBe(78);
    });

    test('should update only specified fields', async () => {
      const res = await request(app)
        .put('/api/v1/clients/profile/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          'schedule.sessionDuration': 75,
        });

      expect(res.status).toBe(200);
      // Should still have other schedule fields
      expect(res.body.data.schedule.availableDays).toBeDefined();
    });
  });

  // ========== TRAINER CONSTRAINT MANAGEMENT ==========
  describe('Trainer Constraint Management', () => {
    beforeAll(async () => {
      // Assign coach to client
      await ClientProfile.findOneAndUpdate(
        { userId: clientUserId },
        { coachId: coachUserId },
      );
    });

    test('should allow coach to view client constraints', async () => {
      const res = await request(app)
        .get(`/api/v1/clients/${clientUserId}/constraints`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.fitnessProfile).toBeDefined();
      expect(res.body.data.medicalInfo).toBeDefined();
      expect(res.body.data.schedule).toBeDefined();
      expect(res.body.data.equipment).toBeDefined();
    });

    test('should log audit event when coach views constraints', async () => {
      const auditEvent = await AuditEvent.findOne({
        userId: coachUserId,
        targetUserId: clientUserId,
        eventType: 'CLIENT_CONSTRAINT_VIEWED',
      });

      expect(auditEvent).toBeDefined();
    });

    test('should allow coach to update single constraint', async () => {
      const res = await request(app)
        .patch(`/api/v1/clients/${clientUserId}/constraints`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          field: 'schedule.sessionsPerWeek',
          value: 5,
          reason: 'Increasing frequency for faster progress',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.schedule.sessionsPerWeek).toBe(5);
    });

    test('should log audit event for constraint update', async () => {
      const auditEvent = await AuditEvent.findOne({
        userId: coachUserId,
        targetUserId: clientUserId,
        eventType: 'CLIENT_CONSTRAINT_UPDATED',
        'details.field': 'schedule.sessionsPerWeek',
      });

      expect(auditEvent).toBeDefined();
      expect(auditEvent.details.newValue).toBe(5);
      expect(auditEvent.details.reason).toBe('Increasing frequency for faster progress');
    });

    test('should allow coach to bulk update constraints', async () => {
      const res = await request(app)
        .put(`/api/v1/clients/${clientUserId}/constraints`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          updates: {
            'schedule.sessionDuration': 90,
            'fitnessProfile.targetWeight': 90,
          },
          reason: 'Adjusting program for advanced phase',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.profile.schedule.sessionDuration).toBe(90);
      expect(res.body.data.changes).toHaveLength(2);
    });

    test('should get constraint change history', async () => {
      const res = await request(app)
        .get(`/api/v1/clients/${clientUserId}/constraints/history`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      
      // Check history entry structure
      const historyEntry = res.body.data[0];
      expect(historyEntry.changedBy).toBeDefined();
      expect(historyEntry.field).toBeDefined();
      expect(historyEntry.changedAt).toBeDefined();
    });

    test('should prevent client from updating own constraints via constraint endpoint', async () => {
      const res = await request(app)
        .patch(`/api/v1/clients/${clientUserId}/constraints`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          field: 'schedule.sessionsPerWeek',
          value: 7,
          reason: 'I want more sessions',
        });

      expect(res.status).toBe(403);
    });

    test('should prevent coach from updating constraints of unassigned client', async () => {
      // Create another client without assigned coach
      const newClient = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testclient3@onboarding.com',
          password: 'UniqueStr0ng!2024#Xyz',
          firstName: 'Sarah',
          lastName: 'Williams',
          role: 'client',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      expect(newClient.status).toBe(201);
      const newClientId = newClient.body.data.user._id;
      const newClientToken = newClient.body.data.accessToken;

      await request(app)
        .post('/api/v1/clients/profile')
        .set('Authorization', `Bearer ${newClientToken}`)
        .send({});

      const res = await request(app)
        .get(`/api/v1/clients/${newClientId}/constraints`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(res.status).toBe(403);
    });

    test('should require authentication for constraint endpoints', async () => {
      const res = await request(app)
        .get(`/api/v1/clients/${clientUserId}/constraints`);

      expect(res.status).toBe(401);
    });
  });

  // ========== EDGE CASES & VALIDATION ==========
  describe('Edge Cases & Validation', () => {
    test('should not allow completing onboarding twice', async () => {
      const res = await request(app)
        .post('/api/v1/clients/onboarding/goals')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          fitnessProfile: {
            primaryGoal: 'strength',
            goals: ['strength'],
          },
        });

      // Should reject with 422 since onboarding is already completed
      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('Onboarding already completed');
    });

    test('should handle large text inputs in notes fields', async () => {
      // Create a new client for this test
      const newClient = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testclient5@onboarding.com',
          password: 'LargeT3xt!T3st#2024',
          firstName: 'Michael',
          lastName: 'Johnson',
          role: 'client',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      expect(newClient.status).toBe(201);
      const newToken = newClient.body.data.accessToken;

      await request(app)
        .post('/api/v1/clients/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .send({});

      const longText = 'a'.repeat(1001);
      
      const res = await request(app)
        .post('/api/v1/clients/onboarding/limitations')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          medicalInfo: {
            notes: longText,
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.error.details).toBeDefined();
      expect(res.body.error.details.some(e => e.message.includes('must not exceed 1000 characters'))).toBe(true);
    });

    test('should validate calorie target range', async () => {
      const newClient = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testclient4@onboarding.com',
          password: 'V3ry!Str0ng#Pwd88',
          firstName: 'David',
          lastName: 'Brown',
          role: 'client',
          acceptedTerms: true,
          acceptedPrivacy: true,
        });

      const newToken = newClient.body.data.accessToken;

      await request(app)
        .post('/api/v1/clients/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .send({});

      const res = await request(app)
        .post('/api/v1/clients/onboarding/nutrition')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          nutritionPreferences: {
            calorieTarget: 500, // Too low
          },
        });

      expect(res.status).toBe(422);
    });
  });

  // ========== AUDIT TRAIL VERIFICATION ==========
  describe('Audit Trail Verification', () => {
    test('should have complete audit trail for onboarding', async () => {
      const onboardingEvents = await AuditEvent.find({
        userId: clientUserId,
        eventType: { $in: ['ONBOARDING_STEP_COMPLETED', 'ONBOARDING_COMPLETED'] },
      }).sort({ timestamp: 1 });

      expect(onboardingEvents.length).toBeGreaterThanOrEqual(6);
      
      const stepNames = onboardingEvents
        .filter(e => e.eventType === 'ONBOARDING_STEP_COMPLETED')
        .map(e => e.details.step);
      
      expect(stepNames).toContain('goals');
      expect(stepNames).toContain('experience');
      expect(stepNames).toContain('equipment');
      expect(stepNames).toContain('schedule');
      expect(stepNames).toContain('limitations');
      expect(stepNames).toContain('nutrition');
    });

    test('should have audit trail for constraint changes', async () => {
      const constraintEvents = await AuditEvent.find({
        userId: coachUserId,
        targetUserId: clientUserId,
        eventType: 'CLIENT_CONSTRAINT_UPDATED',
      });

      expect(constraintEvents.length).toBeGreaterThan(0);
      
      constraintEvents.forEach(event => {
        expect(event.details.field).toBeDefined();
        expect(event.details.newValue).toBeDefined();
        expect(event.details.reason).toBeDefined();
      });
    });

    test('should include IP address and user agent in audit logs', async () => {
      const auditEvent = await AuditEvent.findOne({
        userId: clientUserId,
        eventType: 'ONBOARDING_COMPLETED',
      });

      expect(auditEvent).toBeDefined();
      expect(auditEvent.ipAddress).toBeDefined();
      // User agent may be undefined in test environment, but field should exist
      expect(auditEvent.userAgent).toBeDefined();
    });
  });
});

