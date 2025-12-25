/**
 * Data Integrity Utilities
 * Enforces business rules and data constraints in the service layer
 */

const { BadRequestError, ConflictError, NotFoundError } = require('./errors');
const User = require('../../modules/auth/models/user.model');
const ClientProfile = require('../../modules/clients/models/clientProfile.model');
const Program = require('../../modules/workouts/models/program.model');
const Session = require('../../modules/sessions/models/session.model');
const MealPlan = require('../../modules/nutrition/models/mealPlan.model');

class DataIntegrityService {
  /**
   * Validate foreign key references exist
   */
  async validateUserExists(userId, errorMessage = 'User not found') {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(errorMessage);
    }
    return user;
  }

  async validateCoachExists(coachId) {
    const coach = await User.findOne({ _id: coachId, role: 'coach' });
    if (!coach) {
      throw new NotFoundError('Coach not found or user is not a coach');
    }
    return coach;
  }

  async validateClientExists(clientId) {
    const client = await User.findOne({ _id: clientId, role: 'client' });
    if (!client) {
      throw new NotFoundError('Client not found or user is not a client');
    }
    return client;
  }

  /**
   * Validate relationships
   */
  async validateCoachClientRelationship(coachId, clientId) {
    const profile = await ClientProfile.findOne({
      userId: clientId,
      coachId,
    });
    
    if (!profile) {
      throw new BadRequestError('Client is not assigned to this coach');
    }
    
    return profile;
  }

  /**
   * Validate business rules
   */
  async validateNoDuplicateSession(coachId, clientId, startTime, excludeSessionId = null) {
    const query = {
      coachId,
      clientId,
      startTime,
      status: { $nin: ['cancelled', 'completed'] },
    };
    
    if (excludeSessionId) {
      query._id = { $ne: excludeSessionId };
    }
    
    const existingSession = await Session.findOne(query);
    
    if (existingSession) {
      throw new ConflictError('Session already exists at this time');
    }
  }

  async validateCoachAvailability(coachId, startTime, endTime, excludeSessionId = null) {
    const query = {
      coachId,
      status: { $nin: ['cancelled'] },
      $or: [
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime },
        },
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime },
        },
        {
          startTime: { $gte: startTime },
          endTime: { $lte: endTime },
        },
      ],
    };
    
    if (excludeSessionId) {
      query._id = { $ne: excludeSessionId };
    }
    
    const conflictingSession = await Session.findOne(query);
    
    if (conflictingSession) {
      throw new ConflictError('Coach is not available at this time');
    }
  }

  /**
   * Validate date constraints
   */
  validateDateRange(startDate, endDate, fieldName = 'date') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      throw new BadRequestError(
        `${fieldName} start must be before end date`
      );
    }
    
    return { start, end };
  }

  validateFutureDate(date, fieldName = 'date') {
    const targetDate = new Date(date);
    const now = new Date();
    
    if (targetDate <= now) {
      throw new BadRequestError(`${fieldName} must be in the future`);
    }
    
    return targetDate;
  }

  /**
   * Validate ownership
   */
  async validateProgramOwnership(programId, coachId) {
    const program = await Program.findOne({ _id: programId, coachId });
    
    if (!program) {
      throw new NotFoundError('Program not found or access denied');
    }
    
    return program;
  }

  async validateMealPlanOwnership(planId, coachId) {
    const plan = await MealPlan.findOne({ _id: planId, coachId });
    
    if (!plan) {
      throw new NotFoundError('Meal plan not found or access denied');
    }
    
    return plan;
  }

  /**
   * Validate state transitions
   */
  validateStatusTransition(currentStatus, newStatus, allowedTransitions) {
    const allowed = allowedTransitions[currentStatus] || [];
    
    if (!allowed.includes(newStatus)) {
      throw new BadRequestError(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Validate numeric ranges
   */
  validateRange(value, min, max, fieldName = 'value') {
    if (value < min || value > max) {
      throw new BadRequestError(
        `${fieldName} must be between ${min} and ${max}`
      );
    }
  }

  /**
   * Validate required fields are present
   */
  validateRequiredFields(data, requiredFields) {
    const missing = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missing.length > 0) {
      throw new BadRequestError(
        `Missing required fields: ${missing.join(', ')}`
      );
    }
  }

  /**
   * Validate array length
   */
  validateArrayLength(array, min, max, fieldName = 'array') {
    if (array.length < min) {
      throw new BadRequestError(
        `${fieldName} must have at least ${min} items`
      );
    }
    
    if (max !== undefined && array.length > max) {
      throw new BadRequestError(
        `${fieldName} cannot have more than ${max} items`
      );
    }
  }

  /**
   * Validate unique constraint
   */
  async validateUnique(Model, query, errorMessage = 'Duplicate entry found') {
    const existing = await Model.findOne(query);
    
    if (existing) {
      throw new ConflictError(errorMessage);
    }
  }

  /**
   * Cascade deletion validation
   */
  async validateSafeDeletion(Model, field, value, errorMessage) {
    const count = await Model.countDocuments({ [field]: value });
    
    if (count > 0) {
      throw new BadRequestError(
        errorMessage || `Cannot delete: ${count} related records exist`
      );
    }
  }

  /**
   * Validate active version exists
   */
  async validateActiveVersion(planId, Model) {
    const plan = await Model.findById(planId);
    
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }
    
    if (plan.activeVersionId) {
      const activeVersion = await Model.findById(plan.activeVersionId);
      
      if (!activeVersion) {
        throw new BadRequestError('Active version reference is broken');
      }
      
      return activeVersion;
    }
    
    return plan;
  }
}

module.exports = new DataIntegrityService();




