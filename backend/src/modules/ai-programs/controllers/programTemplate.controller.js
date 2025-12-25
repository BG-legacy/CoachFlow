/**
 * Program Template Controller
 * Handles HTTP requests for versioned program templates
 */

const programTemplateService = require('../services/programTemplate.service');
const logger = require('../../../common/utils/logger');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../../../common/utils/errors');
const { successResponse, createdResponse } = require('../../../common/utils/response');

class ProgramTemplateController {
  /**
   * Create template from generated program
   * POST /api/v1/ai-programs/templates/from-generated/:id
   */
  async createFromGenerated(req, res, next) {
    try {
      const { id } = req.params;
      const coachId = req.user._id;
      const { name, description, visibility, tags, status, customizationOptions, notes } = req.body;

      const template = await programTemplateService.createTemplateFromGenerated(id, {
        name,
        description,
        visibility,
        tags,
        status,
        customizationOptions,
        notes,
      });

      logger.info('Template created from generated program', {
        templateId: template.templateId,
        generatedProgramId: id,
        coachId,
      });

      return createdResponse(
        res,
        template,
        'Template created successfully'
      );
    } catch (error) {
      logger.error('Error creating template', { error: error.message });
      next(error);
    }
  }

  /**
   * Search/list templates
   * GET /api/v1/ai-programs/templates
   */
  async searchTemplates(req, res, next) {
    try {
      const coachId = req.user._id;
      const {
        templateType,
        category,
        experienceLevel,
        goals,
        tags,
        visibility,
        searchText,
        sortBy,
        limit,
        page,
      } = req.query;

      const criteria = {
        templateType,
        category,
        experienceLevel,
        goals: goals ? goals.split(',') : undefined,
        tags: tags ? tags.split(',') : undefined,
        visibility,
        searchText,
        createdBy: req.query.myTemplates === 'true' ? coachId : undefined,
      };

      const options = {
        sortBy: sortBy || 'rating',
        limit: parseInt(limit) || 20,
        skip: page ? (parseInt(page) - 1) * (parseInt(limit) || 20) : 0,
      };

      const result = await programTemplateService.searchTemplates(criteria, options);

      return successResponse(
        res,
        result,
        'Templates retrieved successfully'
      );
    } catch (error) {
      logger.error('Error searching templates', { error: error.message });
      next(error);
    }
  }

  /**
   * Get single template
   * GET /api/v1/ai-programs/templates/:templateId
   */
  async getTemplate(req, res, next) {
    try {
      const { templateId } = req.params;

      const result = await programTemplateService.getTemplateWithHistory(templateId);

      return successResponse(
        res,
        result,
        'Template retrieved successfully'
      );
    } catch (error) {
      logger.error('Error getting template', { error: error.message });
      next(error);
    }
  }

  /**
   * Apply template to client
   * POST /api/v1/ai-programs/templates/:templateId/apply
   */
  async applyTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      const coachId = req.user._id;
      const { clientId, customizations } = req.body;

      if (!clientId) {
        throw new BadRequestError('Client ID is required');
      }

      const result = await programTemplateService.applyTemplate(
        templateId,
        clientId,
        coachId,
        customizations
      );

      logger.info('Template applied to client', {
        templateId,
        clientId,
        coachId,
      });

      return createdResponse(
        res,
        result,
        'Template applied successfully'
      );
    } catch (error) {
      logger.error('Error applying template', { error: error.message });
      next(error);
    }
  }

  /**
   * Create new version of template
   * POST /api/v1/ai-programs/templates/:templateId/version
   */
  async createNewVersion(req, res, next) {
    try {
      const { templateId } = req.params;
      const userId = req.user._id;
      const updates = req.body;

      const newVersion = await programTemplateService.createNewVersion(
        templateId,
        updates,
        userId
      );

      logger.info('New template version created', {
        oldTemplateId: templateId,
        newTemplateId: newVersion.templateId,
        version: newVersion.version,
      });

      return createdResponse(
        res,
        newVersion,
        'New version created successfully'
      );
    } catch (error) {
      logger.error('Error creating new version', { error: error.message });
      next(error);
    }
  }

  /**
   * Rate template
   * POST /api/v1/ai-programs/templates/:templateId/rate
   */
  async rateTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      const userId = req.user._id;
      const { rating, feedback } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        throw new BadRequestError('Rating must be between 1 and 5');
      }

      const template = await programTemplateService.rateTemplate(
        templateId,
        userId,
        rating,
        feedback
      );

      return successResponse(
        res,
        template,
        'Template rated successfully'
      );
    } catch (error) {
      logger.error('Error rating template', { error: error.message });
      next(error);
    }
  }

  /**
   * Get featured templates
   * GET /api/v1/ai-programs/templates/featured
   */
  async getFeaturedTemplates(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const templates = await programTemplateService.getFeaturedTemplates(limit);

      return successResponse(
        res,
        templates,
        'Featured templates retrieved successfully'
      );
    } catch (error) {
      logger.error('Error getting featured templates', { error: error.message });
      next(error);
    }
  }

  /**
   * Archive old versions
   * POST /api/v1/ai-programs/templates/:templateId/archive-old
   */
  async archiveOldVersions(req, res, next) {
    try {
      const { templateId } = req.params;
      const { keepVersions } = req.body;

      const result = await programTemplateService.archiveOldVersions(
        templateId,
        keepVersions || 5
      );

      return successResponse(
        res,
        result,
        `Archived ${result.archived} old versions`
      );
    } catch (error) {
      logger.error('Error archiving old versions', { error: error.message });
      next(error);
    }
  }

  /**
   * Find matching template (check before generating)
   * POST /api/v1/ai-programs/templates/find-match
   */
  async findMatchingTemplate(req, res, next) {
    try {
      const { clientId, goals, duration, allowSimilar } = req.body;

      // Build input data structure
      const ClientProfile = require('../../clients/models/clientProfile.model');
      const clientProfile = await ClientProfile.findOne({ userId: clientId });

      if (!clientProfile) {
        throw new NotFoundError('Client profile');
      }

      const inputData = {
        clientProfile: {
          fitnessProfile: clientProfile.fitnessProfile,
          equipment: clientProfile.equipment,
          nutritionPreferences: clientProfile.nutritionPreferences,
        },
        goals: goals || clientProfile.fitnessProfile.goals,
        duration: duration || 12,
      };

      const result = await programTemplateService.findMatchingTemplate(
        inputData,
        { allowSimilar: allowSimilar !== false }
      );

      return successResponse(
        res,
        result,
        result.template ? 'Matching template found' : 'No matching template found'
      );
    } catch (error) {
      logger.error('Error finding matching template', { error: error.message });
      next(error);
    }
  }
}

module.exports = new ProgramTemplateController();

