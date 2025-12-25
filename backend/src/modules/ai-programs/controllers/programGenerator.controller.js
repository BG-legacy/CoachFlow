/**
 * Program Generator Controller
 * Handles HTTP requests for AI-assisted program generation
 */

const programGeneratorService = require('../services/programGenerator.service');
const openaiService = require('../services/openai.service');
const logger = require('../../../common/utils/logger');
const { APIError, ServiceUnavailableError, NotFoundError, ForbiddenError } = require('../../../common/utils/errors');
const { successResponse, createdResponse } = require('../../../common/utils/response');

class ProgramGeneratorController {
  /**
   * Generate complete program (workout + nutrition)
   * POST /api/v1/ai-programs/generate/complete
   */
  async generateCompleteProgram(req, res, next) {
    try {
      const coachId = req.user._id;
      const { clientId, duration, goals, preferences, constraints, additionalRequirements } = req.body;

      // Check if AI is enabled
      if (!openaiService.isEnabled()) {
        throw new ServiceUnavailableError('AI program generation is not available. OpenAI API key not configured.');
      }

      const generatedProgram = await programGeneratorService.generateCompleteProgram(
        coachId,
        clientId,
        {
          duration,
          goals,
          preferences,
          constraints,
          additionalRequirements,
        }
      );

      logger.info('Complete program generated', {
        generatedProgramId: generatedProgram._id,
        coachId,
        clientId,
      });

      return createdResponse(
        res,
        generatedProgram,
        'Complete program generated successfully'
      );
    } catch (error) {
      logger.error('Error in generateCompleteProgram', { error: error.message });
      next(error);
    }
  }

  /**
   * Generate workout program only
   * POST /api/v1/ai-programs/generate/workout
   */
  async generateWorkoutProgram(req, res, next) {
    try {
      const coachId = req.user._id;
      const { clientId, duration, goals, preferences, constraints, additionalRequirements } = req.body;

      if (!openaiService.isEnabled()) {
        throw new ServiceUnavailableError('AI program generation is not available. OpenAI API key not configured.');
      }

      const generatedProgram = await programGeneratorService.generateWorkoutProgram(
        coachId,
        clientId,
        {
          duration,
          goals,
          preferences,
          constraints,
          additionalRequirements,
        }
      );

      logger.info('Workout program generated', {
        generatedProgramId: generatedProgram._id,
        coachId,
        clientId,
      });

      return createdResponse(
        res,
        generatedProgram,
        'Workout program generated successfully'
      );
    } catch (error) {
      logger.error('Error in generateWorkoutProgram', { error: error.message });
      next(error);
    }
  }

  /**
   * Generate nutrition plan only
   * POST /api/v1/ai-programs/generate/nutrition
   */
  async generateNutritionPlan(req, res, next) {
    try {
      const coachId = req.user._id;
      const { clientId, duration, goals, preferences, constraints, additionalRequirements } = req.body;

      if (!openaiService.isEnabled()) {
        throw new ServiceUnavailableError('AI program generation is not available. OpenAI API key not configured.');
      }

      const generatedProgram = await programGeneratorService.generateNutritionPlan(
        coachId,
        clientId,
        {
          duration,
          goals,
          preferences,
          constraints,
          additionalRequirements,
        }
      );

      logger.info('Nutrition plan generated', {
        generatedProgramId: generatedProgram._id,
        coachId,
        clientId,
      });

      return createdResponse(
        res,
        generatedProgram,
        'Nutrition plan generated successfully'
      );
    } catch (error) {
      logger.error('Error in generateNutritionPlan', { error: error.message });
      next(error);
    }
  }

  /**
   * Get all generated programs for coach
   * GET /api/v1/ai-programs
   */
  async getGeneratedPrograms(req, res, next) {
    try {
      const coachId = req.user._id;
      const { clientId, status, generationType, limit } = req.query;

      const filters = {
        clientId,
        status,
        generationType,
        limit: parseInt(limit) || 50,
      };

      const programs = await programGeneratorService.getGeneratedPrograms(coachId, filters);

      return successResponse(
        res,
        programs,
        'Generated programs retrieved successfully'
      );
    } catch (error) {
      logger.error('Error in getGeneratedPrograms', { error: error.message });
      next(error);
    }
  }

  /**
   * Get single generated program
   * GET /api/v1/ai-programs/:id
   */
  async getGeneratedProgram(req, res, next) {
    try {
      const { id } = req.params;
      const coachId = req.user._id;

      const program = await programGeneratorService.getGeneratedProgram(id);

      if (!program) {
        throw new NotFoundError('Generated program');
      }

      // Verify coach owns this program
      if (program.coachId.toString() !== coachId.toString()) {
        throw new ForbiddenError('Not authorized to access this program');
      }

      return successResponse(
        res,
        program,
        'Generated program retrieved successfully'
      );
    } catch (error) {
      logger.error('Error in getGeneratedProgram', { error: error.message });
      next(error);
    }
  }

  /**
   * Review and update generated program
   * PATCH /api/v1/ai-programs/:id/review
   */
  async reviewGeneratedProgram(req, res, next) {
    try {
      const { id } = req.params;
      const coachId = req.user._id;
      const { status, reviewNotes, quality } = req.body;

      const program = await programGeneratorService.getGeneratedProgram(id);

      if (!program) {
        throw new NotFoundError('Generated program');
      }

      if (program.coachId.toString() !== coachId.toString()) {
        throw new ForbiddenError('Not authorized to review this program');
      }

      const updatedProgram = await programGeneratorService.updateGeneratedProgram(id, {
        status,
        reviewNotes,
        reviewedBy: coachId,
        quality,
      });

      logger.info('Program reviewed', {
        generatedProgramId: id,
        coachId,
        status,
      });

      return successResponse(
        res,
        updatedProgram,
        'Program reviewed successfully'
      );
    } catch (error) {
      logger.error('Error in reviewGeneratedProgram', { error: error.message });
      next(error);
    }
  }

  /**
   * Apply generated program to client
   * POST /api/v1/ai-programs/:id/apply
   */
  async applyGeneratedProgram(req, res, next) {
    try {
      const { id } = req.params;
      const coachId = req.user._id;

      const program = await programGeneratorService.getGeneratedProgram(id);

      if (!program) {
        throw new NotFoundError('Generated program');
      }

      if (program.coachId.toString() !== coachId.toString()) {
        throw new ForbiddenError('Not authorized to apply this program');
      }

      const result = await programGeneratorService.applyGeneratedProgram(id, coachId);

      logger.info('Program applied to client', {
        generatedProgramId: id,
        coachId,
        clientId: program.clientId,
        programId: result.program?._id,
        mealPlanId: result.mealPlan?._id,
      });

      return successResponse(
        res,
        result,
        'Program applied successfully'
      );
    } catch (error) {
      logger.error('Error in applyGeneratedProgram', { error: error.message });
      next(error);
    }
  }

  /**
   * Delete generated program
   * DELETE /api/v1/ai-programs/:id
   */
  async deleteGeneratedProgram(req, res, next) {
    try {
      const { id } = req.params;
      const coachId = req.user._id;

      const program = await programGeneratorService.getGeneratedProgram(id);

      if (!program) {
        throw new NotFoundError('Generated program');
      }

      if (program.coachId.toString() !== coachId.toString()) {
        throw new ForbiddenError('Not authorized to delete this program');
      }

      // Don't actually delete, just mark as archived
      await programGeneratorService.updateGeneratedProgram(id, {
        status: 'archived',
      });

      logger.info('Program archived', {
        generatedProgramId: id,
        coachId,
      });

      return successResponse(
        res,
        null,
        'Program archived successfully'
      );
    } catch (error) {
      logger.error('Error in deleteGeneratedProgram', { error: error.message });
      next(error);
    }
  }

  /**
   * Get AI service status
   * GET /api/v1/ai-programs/status
   */
  async getAIStatus(req, res, next) {
    try {
      const isEnabled = openaiService.isEnabled();
      
      return successResponse(
        res,
        {
          enabled: isEnabled,
          service: 'openai',
          features: {
            workoutGeneration: isEnabled,
            nutritionGeneration: isEnabled,
            combinedGeneration: isEnabled,
          },
        },
        'AI service status retrieved'
      );
    } catch (error) {
      logger.error('Error in getAIStatus', { error: error.message });
      next(error);
    }
  }
}

module.exports = new ProgramGeneratorController();

