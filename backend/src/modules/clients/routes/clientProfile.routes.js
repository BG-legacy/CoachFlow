/**
 * Client Profile Routes
 */

const express = require('express');
const clientProfileController = require('../controllers/clientProfile.controller');
const { authenticate, authorize } = require('../../../common/middleware/auth');
const { validate } = require('../../../common/middleware/validation');
const {
  validateGoals,
  validateExperience,
  validateEquipment,
  validateSchedule,
  validateLimitations,
  validateNutrition,
  validateProfileUpdate,
  validateConstraintUpdate,
  validateUserId,
} = require('../validators/clientProfile.validators');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ========== ONBOARDING ROUTES ==========
router.post(
  '/onboarding/goals',
  validateGoals,
  validate,
  clientProfileController.updateGoals,
);

router.post(
  '/onboarding/experience',
  validateExperience,
  validate,
  clientProfileController.updateExperience,
);

router.post(
  '/onboarding/equipment',
  validateEquipment,
  validate,
  clientProfileController.updateEquipment,
);

router.post(
  '/onboarding/schedule',
  validateSchedule,
  validate,
  clientProfileController.updateSchedule,
);

router.post(
  '/onboarding/limitations',
  validateLimitations,
  validate,
  clientProfileController.updateLimitations,
);

router.post(
  '/onboarding/nutrition',
  validateNutrition,
  validate,
  clientProfileController.updateNutrition,
);

router.get('/onboarding/status', clientProfileController.getOnboardingStatus);

// ========== CLIENT PROFILE ROUTES ==========
router.post('/profile', clientProfileController.createProfile);
router.get('/profile/me', clientProfileController.getMyProfile);
router.put(
  '/profile/me',
  validateProfileUpdate,
  validate,
  clientProfileController.updateMyProfile,
);
router.get('/profile/progress', clientProfileController.getProgress);

// Measurements
router.post('/profile/measurements', clientProfileController.addMeasurement);
router.get('/profile/measurements/latest', clientProfileController.getLatestMeasurement);

// ========== TRAINER CONSTRAINT MANAGEMENT ROUTES ==========
router.get(
  '/:userId/constraints',
  authorize('coach', 'admin'),
  validateUserId,
  validate,
  clientProfileController.viewClientConstraints,
);

router.patch(
  '/:userId/constraints',
  authorize('coach', 'admin'),
  validateUserId,
  validateConstraintUpdate,
  validate,
  clientProfileController.updateClientConstraint,
);

router.put(
  '/:userId/constraints',
  authorize('coach', 'admin'),
  validateUserId,
  validate,
  clientProfileController.bulkUpdateClientConstraints,
);

router.get(
  '/:userId/constraints/history',
  authorize('coach', 'admin'),
  validateUserId,
  validate,
  clientProfileController.getConstraintHistory,
);

// ========== PROFILE MANAGEMENT BY ID ==========
router.get('/profile/:id', clientProfileController.getProfile);
router.put('/profile/:id', authorize('coach', 'admin'), clientProfileController.updateProfile);
router.delete('/profile/:id', authorize('admin'), clientProfileController.deleteProfile);

// ========== COACH-SPECIFIC ROUTES ==========
router.get('/coach/:coachId', authorize('coach', 'admin'), clientProfileController.getClientsByCoach);
router.post('/profile/:userId/assign-coach', authorize('admin', 'coach'), clientProfileController.assignCoach);

// ========== ADMIN ROUTES ==========
router.get('/profiles', authorize('admin'), clientProfileController.getAllProfiles);

module.exports = router;
