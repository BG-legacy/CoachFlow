/**
 * Client Profile Service
 */

const clientProfileRepository = require('../repositories/clientProfile.repository');
const { NotFoundError, ConflictError, ForbiddenError, ValidationError } = require('../../../common/utils/errors');
const logger = require('../../../common/utils/logger');
const { auditHelpers } = require('../../../common/utils/auditLogger');

class ClientProfileService {
  /**
   * Create initial profile (can be empty or with initial data)
   */
  async createProfile(userId, profileData = {}) {
    // Check if profile already exists
    const existingProfile = await clientProfileRepository.findByUserId(userId);
    if (existingProfile) {
      throw new ConflictError('Client profile already exists');
    }

    const profile = await clientProfileRepository.create({
      userId,
      ...profileData,
      onboarding: {
        isCompleted: false,
        currentStep: 'goals',
        stepsCompleted: [],
      },
    });

    logger.info(`Client profile created for user: ${userId}`);

    return profile;
  }

  /**
   * Update onboarding step
   */
  async updateOnboardingStep(userId, step, stepData, req) {
    const profile = await clientProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    if (profile.onboarding.isCompleted) {
      throw new ValidationError('Onboarding already completed');
    }

    // Update the specific step data
    const updates = { ...stepData };

    // Track step completion
    const stepAlreadyCompleted = profile.onboarding.stepsCompleted.some(
      (s) => s.step === step,
    );

    if (!stepAlreadyCompleted) {
      updates['onboarding.stepsCompleted'] = [
        ...profile.onboarding.stepsCompleted,
        { step, completedAt: new Date() },
      ];
    }

    // Determine next step
    const stepOrder = ['goals', 'experience', 'equipment', 'schedule', 'limitations', 'nutrition'];
    const currentIndex = stepOrder.indexOf(step);
    const nextStep = currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : 'completed';

    updates['onboarding.currentStep'] = nextStep;

    // Check if all steps are completed
    const totalStepsCompleted = stepAlreadyCompleted
      ? profile.onboarding.stepsCompleted.length
      : profile.onboarding.stepsCompleted.length + 1;

    // Log step completion
    if (req && !stepAlreadyCompleted) {
      await auditHelpers.onboardingStepCompleted(req, profile._id, step);
    }

    if (totalStepsCompleted >= stepOrder.length) {
      updates['onboarding.isCompleted'] = true;
      updates['onboarding.completedAt'] = new Date();
      updates['onboarding.currentStep'] = 'completed';

      // Log onboarding completion
      if (req) {
        await auditHelpers.onboardingCompleted(req, profile._id);
      }
    }

    const updatedProfile = await clientProfileRepository.updateByUserId(userId, updates);

    logger.info(`Onboarding step '${step}' completed for user: ${userId}`);

    return updatedProfile;
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(userId) {
    const profile = await clientProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    return {
      isCompleted: profile.onboarding.isCompleted,
      currentStep: profile.onboarding.currentStep,
      completedAt: profile.onboarding.completedAt,
      stepsCompleted: profile.onboarding.stepsCompleted,
      completionPercentage: (profile.onboarding.stepsCompleted.length / 6) * 100,
    };
  }

  async getProfileById(profileId) {
    const profile = await clientProfileRepository.findById(profileId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    return profile;
  }

  async getProfileByUserId(userId) {
    const profile = await clientProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    return profile;
  }

  async getMyProfile(userId) {
    return await this.getProfileByUserId(userId);
  }

  async updateProfile(profileId, userId, userRole, updates) {
    const profile = await clientProfileRepository.findById(profileId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    // Check permissions
    if (userRole !== 'admin' && userRole !== 'coach' && profile.userId.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to update this profile');
    }

    const updatedProfile = await clientProfileRepository.updateById(profileId, updates);

    logger.info(`Client profile updated: ${profileId}`);

    return updatedProfile;
  }

  async updateMyProfile(userId, updates, req) {
    const profile = await clientProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    const updatedProfile = await clientProfileRepository.updateByUserId(userId, updates);

    // Log profile update
    if (req) {
      await auditHelpers.profileUpdated(req, profile._id, userId, { updates });
    }

    logger.info(`Client profile updated by user: ${userId}`);

    return updatedProfile;
  }

  /**
   * Trainer views client constraints
   */
  async viewClientConstraints(coachId, clientUserId, req) {
    const profile = await clientProfileRepository.findByUserId(clientUserId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    // Check if coach has access to this client
    // Handle both populated and unpopulated coachId
    const profileCoachId = profile.coachId 
      ? String(profile.coachId._id || profile.coachId) 
      : null;
    const requestCoachId = String(coachId);
    
    if (!profileCoachId || profileCoachId !== requestCoachId) {
      throw new ForbiddenError('You do not have access to this client');
    }

    // Log the view action
    if (req) {
      await auditHelpers.clientConstraintViewed(req, clientUserId);
    }

    // Return relevant constraint data
    return {
      userId: clientUserId,
      fitnessProfile: profile.fitnessProfile,
      medicalInfo: profile.medicalInfo,
      schedule: profile.schedule,
      equipment: profile.equipment,
      preferences: profile.preferences,
      nutritionPreferences: profile.nutritionPreferences,
      constraintHistory: profile.constraintHistory,
    };
  }

  /**
   * Trainer updates client constraints (with audit trail)
   */
  async updateClientConstraints(coachId, clientUserId, field, value, reason, req) {
    const profile = await clientProfileRepository.findByUserId(clientUserId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    // Check if coach has access to this client
    // Handle both populated and unpopulated coachId
    const profileCoachId = profile.coachId 
      ? String(profile.coachId._id || profile.coachId) 
      : null;
    const requestCoachId = String(coachId);
    
    if (!profileCoachId || profileCoachId !== requestCoachId) {
      throw new ForbiddenError('You do not have access to this client');
    }

    // Get old value for audit trail
    const fieldParts = field.split('.');
    let oldValue = profile;
    for (const part of fieldParts) {
      oldValue = oldValue?.[part];
    }

    // Create update object
    const updates = {};
    updates[field] = value;

    // Add to constraint history
    profile.addConstraintChange(coachId, field, oldValue, value, reason);
    await profile.save();

    // Update the profile
    const updatedProfile = await clientProfileRepository.updateByUserId(clientUserId, updates);

    // Log the constraint update
    if (req) {
      await auditHelpers.clientConstraintUpdated(
        req,
        clientUserId,
        field,
        oldValue,
        value,
        reason,
      );
    }

    logger.info(`Constraints updated for client ${clientUserId} by coach ${coachId}`);

    return updatedProfile;
  }

  /**
   * Bulk update client constraints
   */
  async bulkUpdateClientConstraints(coachId, clientUserId, updates, reason, req) {
    const profile = await clientProfileRepository.findByUserId(clientUserId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    // Check if coach has access to this client
    // Handle both populated and unpopulated coachId
    const profileCoachId = profile.coachId 
      ? String(profile.coachId._id || profile.coachId) 
      : null;
    const requestCoachId = String(coachId);
    
    if (!profileCoachId || profileCoachId !== requestCoachId) {
      throw new ForbiddenError('You do not have access to this client');
    }

    // Track all changes for audit
    const changes = [];

    for (const [field, value] of Object.entries(updates)) {
      // Get old value
      const fieldParts = field.split('.');
      let oldValue = profile;
      for (const part of fieldParts) {
        oldValue = oldValue?.[part];
      }

      // Add to constraint history
      profile.addConstraintChange(coachId, field, oldValue, value, reason);
      changes.push({ field, oldValue, newValue: value });

      // Log individual constraint update
      if (req) {
        await auditHelpers.clientConstraintUpdated(
          req,
          clientUserId,
          field,
          oldValue,
          value,
          reason,
        );
      }
    }

    await profile.save();

    // Update the profile
    const updatedProfile = await clientProfileRepository.updateByUserId(clientUserId, updates);

    logger.info(`Bulk constraints updated for client ${clientUserId} by coach ${coachId}`);

    return {
      profile: updatedProfile,
      changes,
    };
  }

  /**
   * Get constraint change history for a client
   */
  async getConstraintHistory(coachId, clientUserId) {
    const profile = await clientProfileRepository.findByUserId(clientUserId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    // Check if coach has access to this client
    // Handle both populated and unpopulated coachId
    const profileCoachId = profile.coachId 
      ? String(profile.coachId._id || profile.coachId) 
      : null;
    const requestCoachId = String(coachId);
    
    if (!profileCoachId || profileCoachId !== requestCoachId) {
      throw new ForbiddenError('You do not have access to this client');
    }

    return profile.constraintHistory.sort((a, b) => b.changedAt - a.changedAt);
  }

  async deleteProfile(profileId) {
    const profile = await clientProfileRepository.findById(profileId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    await clientProfileRepository.deleteById(profileId);

    logger.info(`Client profile deleted: ${profileId}`);

    return { message: 'Profile deleted successfully' };
  }

  async getClientsByCoach(coachId, options) {
    const { profiles, total } = await clientProfileRepository.findByCoachId(coachId, options);

    return { profiles, total };
  }

  async getAllProfiles(filters, options) {
    const { profiles, total } = await clientProfileRepository.findAll(filters, options);

    return { profiles, total };
  }

  async addMeasurement(userId, measurementData) {
    const profile = await clientProfileRepository.addMeasurement(userId, {
      ...measurementData,
      date: new Date(),
    });

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    logger.info(`Measurement added for user: ${userId}`);

    return profile;
  }

  async getLatestMeasurement(userId) {
    const measurement = await clientProfileRepository.getLatestMeasurement(userId);

    if (!measurement) {
      throw new NotFoundError('Measurement data');
    }

    return measurement;
  }

  async assignCoach(userId, coachId) {
    const profile = await clientProfileRepository.assignCoach(userId, coachId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    logger.info(`Coach ${coachId} assigned to client ${userId}`);

    return profile;
  }

  async getProgress(userId) {
    const profile = await clientProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundError('Client profile');
    }

    const measurements = profile.measurements || [];

    if (measurements.length < 2) {
      return {
        message: 'Not enough data to calculate progress',
        measurements,
      };
    }

    const latest = measurements[measurements.length - 1];
    const previous = measurements[measurements.length - 2];

    const progress = {
      weight: {
        current: latest.weight,
        previous: previous.weight,
        change: latest.weight - previous.weight,
        changePercentage: ((latest.weight - previous.weight) / previous.weight) * 100,
      },
      bodyFat: {
        current: latest.bodyFatPercentage,
        previous: previous.bodyFatPercentage,
        change: latest.bodyFatPercentage - previous.bodyFatPercentage,
      },
      measurements: {
        chest: latest.chest - previous.chest,
        waist: latest.waist - previous.waist,
        hips: latest.hips - previous.hips,
        biceps: latest.biceps - previous.biceps,
        thighs: latest.thighs - previous.thighs,
      },
    };

    return progress;
  }
}

module.exports = new ClientProfileService();
