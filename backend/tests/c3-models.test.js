/**
 * C3 Advanced Collections Tests
 * Tests for nudges, XP events, weekly reports, and AI requests
 */

const mongoose = require('mongoose');

// Import C3 models
const Nudge = require('../src/modules/notifications/models/nudge.model');
const XPEvent = require('../src/modules/gamification/models/xpEvent.model');
const WeeklyReport = require('../src/modules/reports/models/weeklyReport.model');
const AIRequest = require('../src/modules/common/models/aiRequest.model');
const FormAnalysis = require('../src/modules/formAnalysis/models/formAnalysis.model');
const Gamification = require('../src/modules/gamification/models/gamification.model');

describe('C3 Advanced Collections', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/coachflow_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Nudges - Behavioral Tracking', () => {
    test('Nudge should track what was sent, why, and when', () => {
      const nudge = new Nudge({
        userId: new mongoose.Types.ObjectId(),
        type: 'workout_reminder',
        trigger: {
          type: 'inactivity',
          reason: 'No workout logged in 3 days',
          metadata: {
            lastWorkoutDate: new Date('2025-01-10'),
            daysInactive: 3,
          },
        },
        content: {
          title: 'Time to Get Moving!',
          message: "You haven't worked out in 3 days. Let's get back on track!",
          actionButton: {
            text: 'Log Workout',
            link: '/workouts/new',
          },
        },
        channel: 'push',
        sentAt: new Date(),
      });

      expect(nudge.type).toBe('workout_reminder');
      expect(nudge.trigger.reason).toBe('No workout logged in 3 days');
      expect(nudge.sentAt).toBeDefined();
      expect(nudge.content.message).toContain('3 days');
    });

    test('Nudge should track interaction and goal achievement', () => {
      const nudge = new Nudge({
        userId: new mongoose.Types.ObjectId(),
        type: 'streak_motivation',
        trigger: {
          type: 'milestone',
          reason: '6-day workout streak, encourage to reach 7',
        },
        content: {
          message: 'One more day to hit your weekly streak!',
        },
        channel: 'in_app',
        sentAt: new Date(),
        interaction: {
          opened: true,
          openedAt: new Date(),
          clicked: true,
          clickedAt: new Date(),
          goalAchieved: true,
          goalAchievedAt: new Date(),
        },
      });

      expect(nudge.interaction.goalAchieved).toBe(true);
      expect(nudge.interaction.opened).toBe(true);
    });

    test('Nudge should support A/B testing', () => {
      const nudge = new Nudge({
        userId: new mongoose.Types.ObjectId(),
        type: 'nutrition_log_reminder',
        trigger: {
          type: 'scheduled',
          reason: 'Evening nutrition log reminder',
        },
        content: {
          message: 'Variant A: Did you log your meals today?',
        },
        channel: 'push',
        sentAt: new Date(),
        variant: 'A',
        experimentId: 'nutrition_reminder_exp_001',
      });

      expect(nudge.variant).toBe('A');
      expect(nudge.experimentId).toBe('nutrition_reminder_exp_001');
    });
  });

  describe('XP Events - Atomic Tracking', () => {
    test('XP Event should track atomic XP awards', () => {
      const xpEvent = new XPEvent({
        userId: new mongoose.Types.ObjectId(),
        eventType: 'workout_completed',
        xpAwarded: 50,
        baseXP: 50,
        multiplier: 1.0,
        reason: 'Completed full body workout',
        source: {
          type: 'workout',
          id: new mongoose.Types.ObjectId(),
          metadata: {
            workoutName: 'Full Body Strength',
            duration: 60,
          },
        },
        levelContext: {
          previousLevel: 5,
          newLevel: 5,
          previousXP: 1200,
          newXP: 1250,
          leveledUp: false,
        },
      });

      expect(xpEvent.xpAwarded).toBe(50);
      expect(xpEvent.eventType).toBe('workout_completed');
      expect(xpEvent.reason).toBe('Completed full body workout');
      expect(xpEvent.levelContext.newXP).toBe(1250);
    });

    test('XP Event should track level-ups', () => {
      const xpEvent = new XPEvent({
        userId: new mongoose.Types.ObjectId(),
        eventType: 'program_completed',
        xpAwarded: 500,
        baseXP: 500,
        reason: 'Completed 12-week program',
        levelContext: {
          previousLevel: 5,
          newLevel: 6,
          previousXP: 2900,
          newXP: 3400,
          leveledUp: true,
        },
      });

      expect(xpEvent.levelContext.leveledUp).toBe(true);
      expect(xpEvent.levelContext.newLevel).toBe(6);
    });

    test('XP Event should support bonuses and multipliers', () => {
      const xpEvent = new XPEvent({
        userId: new mongoose.Types.ObjectId(),
        eventType: 'perfect_week',
        xpAwarded: 200, // 100 base * 2.0 multiplier
        baseXP: 100,
        multiplier: 2.0,
        reason: 'Perfect week bonus - all workouts and nutrition logged',
        isBonus: true,
        bonusReason: 'Weekend warrior bonus active',
      });

      expect(xpEvent.multiplier).toBe(2.0);
      expect(xpEvent.isBonus).toBe(true);
      expect(xpEvent.xpAwarded).toBe(200);
    });

    test('XP Event should support revocation', () => {
      const xpEvent = new XPEvent({
        userId: new mongoose.Types.ObjectId(),
        eventType: 'workout_completed',
        xpAwarded: 50,
        reason: 'Workout completion',
        revoked: true,
        revokedAt: new Date(),
        revokedReason: 'Workout was incorrectly logged',
        revokedBy: new mongoose.Types.ObjectId(),
      });

      expect(xpEvent.revoked).toBe(true);
      expect(xpEvent.revokedReason).toBeDefined();
    });
  });

  describe('Weekly Reports - Stored Summaries', () => {
    test('Weekly Report should store comprehensive statistics', () => {
      const report = new WeeklyReport({
        userId: new mongoose.Types.ObjectId(),
        coachId: new mongoose.Types.ObjectId(),
        weekStartDate: new Date('2025-01-13'),
        weekEndDate: new Date('2025-01-19'),
        weekNumber: 3,
        year: 2025,
        workoutStats: {
          totalWorkouts: 4,
          completedWorkouts: 4,
          totalDuration: 240,
          totalVolume: 8500,
          averageRating: 4.5,
          averageRPE: 7.5,
          adherence: 100,
        },
        nutritionStats: {
          daysLogged: 6,
          averageCalories: 2450,
          averageProtein: 175,
          targetAdherence: 85,
        },
        checkinStats: {
          totalCheckins: 1,
          currentWeight: 84.5,
          weightChange: -0.5,
        },
        overallProgress: {
          adherenceScore: 92,
          consistencyScore: 88,
        },
      });

      expect(report.workoutStats.totalWorkouts).toBe(4);
      expect(report.workoutStats.averageRPE).toBe(7.5);
      expect(report.nutritionStats.averageProtein).toBe(175);
      expect(report.weekNumber).toBe(3);
    });

    test('Weekly Report should track gamification progress', () => {
      const report = new WeeklyReport({
        userId: new mongoose.Types.ObjectId(),
        weekStartDate: new Date('2025-01-13'),
        weekEndDate: new Date('2025-01-19'),
        weekNumber: 3,
        year: 2025,
        gamificationProgress: {
          xpEarned: 350,
          levelUps: 1,
          badgesEarned: [{
            id: 'badge_warrior',
            name: 'Weekend Warrior',
            earnedAt: new Date(),
          }],
          streakProgress: {
            workout: 7,
            nutrition: 6,
            checkin: 4,
          },
        },
      });

      expect(report.gamificationProgress.xpEarned).toBe(350);
      expect(report.gamificationProgress.levelUps).toBe(1);
      expect(report.gamificationProgress.badgesEarned).toHaveLength(1);
    });

    test('Weekly Report should support highlights structure', () => {
      const report = new WeeklyReport({
        userId: new mongoose.Types.ObjectId(),
        weekStartDate: new Date('2025-01-13'),
        weekEndDate: new Date('2025-01-19'),
        weekNumber: 3,
        year: 2025,
      });
      
      // Test that we can assign highlights
      const highlightsData = {
        personalRecords: [{
          exercise: 'Bench Press',
          type: 'weight',
          value: 100,
          previousBest: 95,
          achievedAt: new Date('2025-01-15'),
        }],
        achievements: ['Hit 7-day workout streak'],
        milestones: ['Logged 100th workout'],
      };
      
      report.set('highlights', highlightsData);
      
      expect(report.get('highlights')).toBeDefined();
      expect(report.weekNumber).toBe(3);
      expect(report.year).toBe(2025);
    });
  });

  describe('AI Requests - Debugging & Monitoring', () => {
    test('AI Request should track prompt and response', () => {
      const aiRequest = new AIRequest({
        requestId: 'req_123456789',
        userId: new mongoose.Types.ObjectId(),
        service: 'openai',
        model: 'gpt-4',
        prompt: {
          raw: 'Analyze this workout form and provide feedback',
          template: 'form_analysis_v1',
          systemPrompt: 'You are a fitness form analysis expert',
          temperature: 0.7,
          maxTokens: 500,
        },
        response: {
          raw: 'Your squat form shows good depth...',
          summary: 'Good form with minor adjustments needed',
        },
        status: 'success',
      });

      expect(aiRequest.service).toBe('openai');
      expect(aiRequest.model).toBe('gpt-4');
      expect(aiRequest.prompt.template).toBe('form_analysis_v1');
      expect(aiRequest.status).toBe('success');
    });

    test('AI Request should track token usage and costs', () => {
      const aiRequest = new AIRequest({
        requestId: 'req_987654321',
        service: 'openai',
        model: 'gpt-4',
        prompt: { raw: 'Test prompt' },
        response: { raw: 'Test response' },
        usage: {
          promptTokens: 150,
          completionTokens: 350,
          totalTokens: 500,
          estimatedCost: 0.015,
        },
        status: 'success',
      });

      expect(aiRequest.usage.totalTokens).toBe(500);
      expect(aiRequest.usage.estimatedCost).toBe(0.015);
    });

    test('AI Request should track performance metrics', () => {
      const startTime = new Date('2025-01-15T10:00:00Z');
      const endTime = new Date('2025-01-15T10:00:02.5Z');
      
      const aiRequest = new AIRequest({
        requestId: 'req_perf_test',
        service: 'form_analysis',
        model: 'pose-detection-v2',
        prompt: { raw: 'Analyze video' },
        response: { raw: 'Analysis complete' },
        performance: {
          requestStartTime: startTime,
          requestEndTime: endTime,
          latency: 2500,
          retries: 0,
        },
        status: 'success',
      });

      expect(aiRequest.performance.latency).toBe(2500);
      expect(aiRequest.performance.retries).toBe(0);
    });

    test('AI Request should support feedback tracking', () => {
      const aiRequest = new AIRequest({
        requestId: 'req_feedback',
        service: 'workout_generator',
        model: 'gpt-4',
        prompt: { raw: 'Generate workout plan' },
        response: { raw: 'Workout plan generated' },
        status: 'success',
        feedback: {
          userRating: 5,
          wasHelpful: true,
          qualityScore: 95,
        },
      });

      expect(aiRequest.feedback.userRating).toBe(5);
      expect(aiRequest.feedback.wasHelpful).toBe(true);
      expect(aiRequest.feedback.qualityScore).toBe(95);
    });
  });

  describe('Form Submissions - Video Analysis', () => {
    test('Form Analysis should store video metadata', () => {
      const formAnalysis = new FormAnalysis({
        userId: new mongoose.Types.ObjectId(),
        exerciseName: 'Barbell Squat',
        videoUrl: 'https://storage.example.com/videos/squat_123.mp4',
        videoFileName: 'squat_123.mp4',
        metadata: {
          duration: 45,
          repsDetected: 5,
          modelVersion: 'pose-v2.1',
        },
        analysisStatus: 'pending',
      });

      expect(formAnalysis.exerciseName).toBe('Barbell Squat');
      expect(formAnalysis.metadata.duration).toBe(45);
      expect(formAnalysis.metadata.repsDetected).toBe(5);
    });

    test('Form Analysis should store analysis results', () => {
      const formAnalysis = new FormAnalysis({
        userId: new mongoose.Types.ObjectId(),
        exerciseName: 'Deadlift',
        videoUrl: 'https://example.com/video.mp4',
        analysisStatus: 'completed',
        analysisResults: {
          overallScore: 85,
          formQuality: 'good',
          feedback: [{
            issue: 'Lower back rounding',
            severity: 'medium',
            suggestion: 'Keep core engaged and chest up',
            timestamp: 2.5,
          }],
          insights: ['Good hip hinge pattern', 'Bar path is straight'],
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 15000,
        },
      });

      expect(formAnalysis.analysisResults.overallScore).toBe(85);
      expect(formAnalysis.analysisResults.feedback).toHaveLength(1);
      expect(formAnalysis.analysisResults.feedback[0].severity).toBe('medium');
    });
  });

  describe('Gamification - Levels, Badges, Perks', () => {
    test('Gamification profile should track XP and levels', () => {
      const profile = new Gamification({
        userId: new mongoose.Types.ObjectId(),
        xp: 2500,
        level: 5,
      });

      profile.calculateLevel();
      expect(profile.level).toBeGreaterThan(0);
    });

    test('Gamification should store badges', () => {
      const profile = new Gamification({
        userId: new mongoose.Types.ObjectId(),
        badges: [{
          id: 'first_workout',
          name: 'First Steps',
          description: 'Completed your first workout',
          icon: 'trophy',
          earnedAt: new Date(),
        }],
      });

      expect(profile.badges).toHaveLength(1);
      expect(profile.badges[0].name).toBe('First Steps');
    });

    test('Gamification should track perk inventory', () => {
      const profile = new Gamification({
        userId: new mongoose.Types.ObjectId(),
        perks: [{
          id: 'custom_theme',
          name: 'Custom Theme Unlock',
          description: 'Unlock custom app themes',
          unlockedAt: new Date(),
        }],
      });

      expect(profile.perks).toHaveLength(1);
      expect(profile.perks[0].id).toBe('custom_theme');
    });
  });
});

