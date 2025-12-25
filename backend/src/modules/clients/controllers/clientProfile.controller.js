/**
 * Client Profile Controller
 */

const clientProfileService = require('../services/clientProfile.service');
const { successResponse, createdResponse, paginatedResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');

class ClientProfileController {
  /**
   * Create client profile
   * POST /api/v1/clients/profile
   */
  createProfile = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.createProfile(req.user._id, req.body);
    return createdResponse(res, profile, 'Profile created successfully');
  });

  // ========== ONBOARDING ENDPOINTS ==========

  /**
   * Update onboarding step: Goals
   * POST /api/v1/clients/onboarding/goals
   */
  updateGoals = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.updateOnboardingStep(
      req.user._id,
      'goals',
      { fitnessProfile: req.body.fitnessProfile },
      req,
    );
    return successResponse(res, profile, 'Goals updated successfully');
  });

  /**
   * Update onboarding step: Experience Level
   * POST /api/v1/clients/onboarding/experience
   */
  updateExperience = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.updateOnboardingStep(
      req.user._id,
      'experience',
      { fitnessProfile: req.body.fitnessProfile },
      req,
    );
    return successResponse(res, profile, 'Experience level updated successfully');
  });

  /**
   * Update onboarding step: Equipment
   * POST /api/v1/clients/onboarding/equipment
   */
  updateEquipment = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.updateOnboardingStep(
      req.user._id,
      'equipment',
      { equipment: req.body.equipment },
      req,
    );
    return successResponse(res, profile, 'Equipment preferences updated successfully');
  });

  /**
   * Update onboarding step: Schedule
   * POST /api/v1/clients/onboarding/schedule
   */
  updateSchedule = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.updateOnboardingStep(
      req.user._id,
      'schedule',
      { schedule: req.body.schedule },
      req,
    );
    return successResponse(res, profile, 'Schedule updated successfully');
  });

  /**
   * Update onboarding step: Injuries & Limitations
   * POST /api/v1/clients/onboarding/limitations
   */
  updateLimitations = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.updateOnboardingStep(
      req.user._id,
      'limitations',
      { medicalInfo: req.body.medicalInfo, preferences: req.body.preferences },
      req,
    );
    return successResponse(res, profile, 'Limitations updated successfully');
  });

  /**
   * Update onboarding step: Nutrition
   * POST /api/v1/clients/onboarding/nutrition
   */
  updateNutrition = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.updateOnboardingStep(
      req.user._id,
      'nutrition',
      { nutritionPreferences: req.body.nutritionPreferences },
      req,
    );
    return successResponse(res, profile, 'Nutrition preferences updated successfully');
  });

  /**
   * Get onboarding status
   * GET /api/v1/clients/onboarding/status
   */
  getOnboardingStatus = asyncHandler(async (req, res) => {
    const status = await clientProfileService.getOnboardingStatus(req.user._id);
    return successResponse(res, status);
  });

  /**
   * Get profile by ID
   * GET /api/v1/clients/profile/:id
   */
  getProfile = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.getProfileById(req.params.id);
    return successResponse(res, profile);
  });

  /**
   * Get my profile
   * GET /api/v1/clients/profile/me
   */
  getMyProfile = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.getMyProfile(req.user._id);
    return successResponse(res, profile);
  });

  /**
   * Update profile
   * PUT /api/v1/clients/profile/:id
   */
  updateProfile = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.updateProfile(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body
    );
    return successResponse(res, profile, 'Profile updated successfully');
  });

  /**
   * Update my profile
   * PUT /api/v1/clients/profile/me
   */
  updateMyProfile = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.updateMyProfile(req.user._id, req.body, req);
    return successResponse(res, profile, 'Profile updated successfully');
  });

  // ========== TRAINER CONSTRAINT MANAGEMENT ==========

  /**
   * View client constraints (trainer)
   * GET /api/v1/clients/:userId/constraints
   */
  viewClientConstraints = asyncHandler(async (req, res) => {
    const constraints = await clientProfileService.viewClientConstraints(
      req.user._id,
      req.params.userId,
      req,
    );
    return successResponse(res, constraints);
  });

  /**
   * Update single client constraint (trainer)
   * PATCH /api/v1/clients/:userId/constraints
   */
  updateClientConstraint = asyncHandler(async (req, res) => {
    const { field, value, reason } = req.body;
    const profile = await clientProfileService.updateClientConstraints(
      req.user._id,
      req.params.userId,
      field,
      value,
      reason,
      req,
    );
    return successResponse(res, profile, 'Client constraint updated successfully');
  });

  /**
   * Bulk update client constraints (trainer)
   * PUT /api/v1/clients/:userId/constraints
   */
  bulkUpdateClientConstraints = asyncHandler(async (req, res) => {
    const { updates, reason } = req.body;
    const result = await clientProfileService.bulkUpdateClientConstraints(
      req.user._id,
      req.params.userId,
      updates,
      reason,
      req,
    );
    return successResponse(res, result, 'Client constraints updated successfully');
  });

  /**
   * Get constraint change history (trainer)
   * GET /api/v1/clients/:userId/constraints/history
   */
  getConstraintHistory = asyncHandler(async (req, res) => {
    const history = await clientProfileService.getConstraintHistory(
      req.user._id,
      req.params.userId,
    );
    return successResponse(res, history);
  });

  /**
   * Delete profile
   * DELETE /api/v1/clients/profile/:id
   */
  deleteProfile = asyncHandler(async (req, res) => {
    const result = await clientProfileService.deleteProfile(req.params.id);
    return successResponse(res, result);
  });

  /**
   * Get clients by coach
   * GET /api/v1/clients/coach/:coachId
   */
  getClientsByCoach = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, status } = req.query;
    const options = { page: parseInt(page), limit: parseInt(limit), sort, status };

    const { profiles, total } = await clientProfileService.getClientsByCoach(req.params.coachId, options);

    return paginatedResponse(res, profiles, parseInt(page), parseInt(limit), total);
  });

  /**
   * Get all profiles (admin only)
   * GET /api/v1/clients/profiles
   */
  getAllProfiles = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, status } = req.query;
    const filters = status ? { status } : {};
    const options = { page: parseInt(page), limit: parseInt(limit), sort };

    const { profiles, total } = await clientProfileService.getAllProfiles(filters, options);

    return paginatedResponse(res, profiles, parseInt(page), parseInt(limit), total);
  });

  /**
   * Add measurement
   * POST /api/v1/clients/profile/measurements
   */
  addMeasurement = asyncHandler(async (req, res) => {
    const profile = await clientProfileService.addMeasurement(req.user._id, req.body);
    return createdResponse(res, profile, 'Measurement added successfully');
  });

  /**
   * Get latest measurement
   * GET /api/v1/clients/profile/measurements/latest
   */
  getLatestMeasurement = asyncHandler(async (req, res) => {
    const measurement = await clientProfileService.getLatestMeasurement(req.user._id);
    return successResponse(res, measurement);
  });

  /**
   * Assign coach
   * POST /api/v1/clients/profile/:userId/assign-coach
   */
  assignCoach = asyncHandler(async (req, res) => {
    const { coachId } = req.body;
    const profile = await clientProfileService.assignCoach(req.params.userId, coachId);
    return successResponse(res, profile, 'Coach assigned successfully');
  });

  /**
   * Get progress
   * GET /api/v1/clients/profile/progress
   */
  getProgress = asyncHandler(async (req, res) => {
    const progress = await clientProfileService.getProgress(req.user._id);
    return successResponse(res, progress);
  });
}

module.exports = new ClientProfileController();

