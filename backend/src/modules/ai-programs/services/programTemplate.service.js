/**
 * Program Template Service
 * Manages versioned program artifacts and template reuse
 */

const ProgramTemplate = require('../models/programTemplate.model');
const GeneratedProgram = require('../models/generatedProgram.model');
const logger = require('../../../common/utils/logger');
const crypto = require('crypto');

class ProgramTemplateService {
  /**
   * Convert a generated program to a reusable template
   */
  async createTemplateFromGenerated(generatedProgramId, options = {}) {
    const generatedProgram = await GeneratedProgram.findById(generatedProgramId)
      .populate('clientId', 'firstName lastName')
      .populate('coachId', 'firstName lastName');
    
    if (!generatedProgram) {
      throw new Error('Generated program not found');
    }

    const { workoutProgram, nutritionPlan } = generatedProgram.generatedContent;
    
    // Determine template type
    let templateType = 'combined';
    if (workoutProgram && !nutritionPlan) templateType = 'workout_program';
    if (!workoutProgram && nutritionPlan) templateType = 'nutrition_plan';

    // Extract characteristics for matching
    const characteristics = this._extractCharacteristics(
      generatedProgram.inputData,
      workoutProgram,
      nutritionPlan
    );

    // Create template
    const template = new ProgramTemplate({
      name: options.name || this._generateTemplateName(workoutProgram, nutritionPlan),
      description: options.description || this._generateTemplateDescription(generatedProgram),
      createdBy: generatedProgram.coachId,
      templateType,
      category: this._determineCategory(generatedProgram.inputData.goals),
      tags: options.tags || this._generateTags(generatedProgram),
      characteristics,
      content: {
        workoutProgram: workoutProgram ? {
          name: workoutProgram.name,
          description: workoutProgram.description,
          duration: workoutProgram.duration,
          workouts: workoutProgram.workouts,
          reasoning: workoutProgram.reasoning,
          progressionStrategy: options.progressionStrategy,
        } : undefined,
        nutritionPlan: nutritionPlan ? {
          name: nutritionPlan.name,
          description: nutritionPlan.description,
          dailyTargets: nutritionPlan.dailyTargets,
          meals: nutritionPlan.meals,
          reasoning: nutritionPlan.reasoning,
        } : undefined,
      },
      aiMetadata: {
        ...generatedProgram.aiMetadata,
        generatedAt: generatedProgram.createdAt,
        generationInputHash: this._hashInputData(generatedProgram.inputData),
      },
      usage: {
        timesUsed: 0,
        activeClients: 0,
      },
      status: options.status || 'active',
      visibility: options.visibility || 'private',
      customizationOptions: options.customizationOptions || {
        allowDurationAdjustment: true,
        allowEquipmentSubstitution: true,
        allowExerciseSwaps: true,
        allowMacroAdjustment: true,
      },
      metadata: {
        sourceGenerationId: generatedProgram._id,
        sourceClientProfile: generatedProgram.inputData.clientProfile,
        notes: options.notes,
      },
    });

    await template.save();

    logger.info('Template created from generated program', {
      templateId: template.templateId,
      generatedProgramId,
      coachId: generatedProgram.coachId,
    });

    return template;
  }

  /**
   * Find existing template matching input criteria (avoid regeneration)
   */
  async findMatchingTemplate(inputData, options = {}) {
    // Generate input fingerprint
    const inputFingerprint = this._hashInputData(inputData);

    // Try exact match first
    let template = await ProgramTemplate.findOne({
      inputFingerprint,
      status: 'active',
      isLatestVersion: true,
    }).sort({ 'usage.averageRating': -1, 'usage.timesUsed': -1 });

    if (template) {
      logger.info('Found exact matching template', {
        templateId: template.templateId,
        inputFingerprint,
      });
      return { template, matchType: 'exact' };
    }

    // Try characteristic-based match
    if (options.allowSimilar !== false) {
      const characteristics = {
        experienceLevel: inputData.clientProfile?.fitnessProfile?.experienceLevel,
        goals: inputData.goals || inputData.clientProfile?.fitnessProfile?.goals,
        equipment: inputData.clientProfile?.equipment?.homeEquipment,
        duration: { weeks: inputData.duration },
      };

      const similarTemplates = await ProgramTemplate.findByCharacteristics(
        characteristics,
        {
          visibility: 'public',
          limit: 5,
        }
      );

      if (similarTemplates.length > 0) {
        logger.info('Found similar template', {
          templateId: similarTemplates[0].templateId,
          count: similarTemplates.length,
        });
        return { template: similarTemplates[0], matchType: 'similar', alternatives: similarTemplates };
      }
    }

    return { template: null, matchType: 'none' };
  }

  /**
   * Apply template to a client (with customization)
   */
  async applyTemplate(templateId, clientId, coachId, customizations = {}) {
    const template = await ProgramTemplate.findOne({ 
      templateId,
      status: 'active',
    });

    if (!template) {
      throw new Error('Template not found or inactive');
    }

    // Clone the template content
    let content = JSON.parse(JSON.stringify(template.content));

    // Apply customizations
    if (customizations.duration && template.customizationOptions.allowDurationAdjustment) {
      content = this._adjustDuration(content, customizations.duration);
    }

    if (customizations.equipment && template.customizationOptions.allowEquipmentSubstitution) {
      content = this._substituteEquipment(content, customizations.equipment);
    }

    if (customizations.macros && template.customizationOptions.allowMacroAdjustment) {
      content = this._adjustMacros(content, customizations.macros);
    }

    // Create a GeneratedProgram record for tracking
    const generatedProgram = new GeneratedProgram({
      coachId,
      clientId,
      requestId: `TMPL-${templateId}-${Date.now()}`,
      generationType: template.templateType,
      inputData: {
        templateId,
        customizations,
      },
      generatedContent: content,
      aiMetadata: {
        ...template.aiMetadata,
        source: 'template',
        templateId,
      },
      status: 'generated',
    });

    await generatedProgram.save();

    // Record template usage
    await template.recordUsage();

    logger.info('Template applied to client', {
      templateId,
      clientId,
      coachId,
      generatedProgramId: generatedProgram._id,
    });

    return { generatedProgram, template };
  }

  /**
   * Create new version of a template
   */
  async createNewVersion(templateId, updates, userId) {
    const currentTemplate = await ProgramTemplate.findOne({ templateId });

    if (!currentTemplate) {
      throw new Error('Template not found');
    }

    const newVersion = await currentTemplate.createNewVersion(updates, userId);

    logger.info('New template version created', {
      oldTemplateId: templateId,
      newTemplateId: newVersion.templateId,
      version: newVersion.version,
    });

    return newVersion;
  }

  /**
   * Get template with version history
   */
  async getTemplateWithHistory(templateId) {
    const template = await ProgramTemplate.findOne({ templateId });

    if (!template) {
      throw new Error('Template not found');
    }

    const history = await ProgramTemplate.getVersionHistory(templateId);

    return {
      current: template,
      history,
      totalVersions: history.length,
    };
  }

  /**
   * Search templates
   */
  async searchTemplates(criteria = {}, options = {}) {
    const query = {
      status: 'active',
      isLatestVersion: true,
    };

    if (criteria.templateType) {
      query.templateType = criteria.templateType;
    }

    if (criteria.category) {
      query.category = criteria.category;
    }

    if (criteria.experienceLevel) {
      query['characteristics.experienceLevel'] = criteria.experienceLevel;
    }

    if (criteria.goals && criteria.goals.length > 0) {
      query['characteristics.goals'] = { $in: criteria.goals };
    }

    if (criteria.tags && criteria.tags.length > 0) {
      query.tags = { $in: criteria.tags };
    }

    if (criteria.createdBy) {
      query.createdBy = criteria.createdBy;
    }

    if (criteria.visibility) {
      query.visibility = criteria.visibility;
    }

    // Text search
    if (criteria.searchText) {
      query.$text = { $search: criteria.searchText };
    }

    const sort = {};
    if (options.sortBy === 'rating') {
      sort['usage.averageRating'] = -1;
    } else if (options.sortBy === 'popular') {
      sort['usage.timesUsed'] = -1;
    } else if (options.sortBy === 'recent') {
      sort.createdAt = -1;
    } else {
      sort['usage.averageRating'] = -1;
      sort['usage.timesUsed'] = -1;
    }

    const limit = options.limit || 20;
    const skip = options.skip || 0;

    const [templates, total] = await Promise.all([
      ProgramTemplate.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate('createdBy', 'firstName lastName'),
      ProgramTemplate.countDocuments(query),
    ]);

    return {
      templates,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get popular/featured templates
   */
  async getFeaturedTemplates(limit = 10) {
    return ProgramTemplate.find({
      status: 'active',
      isLatestVersion: true,
      isFeatured: true,
    })
      .sort({ 'usage.averageRating': -1, 'usage.timesUsed': -1 })
      .limit(limit)
      .populate('createdBy', 'firstName lastName');
  }

  /**
   * Rate a template
   */
  async rateTemplate(templateId, userId, rating, feedback) {
    const template = await ProgramTemplate.findOne({ templateId });

    if (!template) {
      throw new Error('Template not found');
    }

    await template.addRating(userId, rating, feedback);

    logger.info('Template rated', {
      templateId,
      userId,
      rating,
    });

    return template;
  }

  /**
   * Archive old versions (cleanup)
   */
  async archiveOldVersions(templateId, keepVersions = 5) {
    const history = await ProgramTemplate.getVersionHistory(templateId);

    if (history.length <= keepVersions) {
      return { archived: 0 };
    }

    // Keep latest version + specified number of previous versions
    const toArchive = history
      .slice(0, -keepVersions)
      .filter(t => !t.isLatestVersion);

    await Promise.all(
      toArchive.map(t => 
        ProgramTemplate.findByIdAndUpdate(t._id, { status: 'archived' })
      )
    );

    logger.info('Old template versions archived', {
      templateId,
      archived: toArchive.length,
    });

    return { archived: toArchive.length };
  }

  // Private helper methods

  _extractCharacteristics(inputData, workoutProgram, nutritionPlan) {
    const clientProfile = inputData.clientProfile || {};
    
    return {
      experienceLevel: clientProfile.fitnessProfile?.experienceLevel,
      goals: inputData.goals || clientProfile.fitnessProfile?.goals || [],
      duration: {
        weeks: workoutProgram?.duration?.weeks || inputData.duration,
        days: (workoutProgram?.duration?.weeks || inputData.duration) * 7,
      },
      equipment: clientProfile.equipment?.homeEquipment || [],
      targetMuscles: workoutProgram?.workouts
        ?.flatMap(w => w.targetMuscles || [])
        .filter((v, i, a) => a.indexOf(v) === i) || [],
      dietType: clientProfile.nutritionPreferences?.dietType,
      calorieRange: nutritionPlan ? {
        min: Math.floor(nutritionPlan.dailyTargets?.calories * 0.9),
        max: Math.ceil(nutritionPlan.dailyTargets?.calories * 1.1),
      } : null,
    };
  }

  _generateTemplateName(workoutProgram, nutritionPlan) {
    if (workoutProgram && nutritionPlan) {
      return `${workoutProgram.name} + Nutrition`;
    }
    return workoutProgram?.name || nutritionPlan?.name || 'Fitness Program';
  }

  _generateTemplateDescription(generatedProgram) {
    const { workoutProgram, nutritionPlan } = generatedProgram.generatedContent;
    const parts = [];
    
    if (workoutProgram) {
      parts.push(workoutProgram.description || workoutProgram.reasoning?.substring(0, 150));
    }
    
    if (nutritionPlan) {
      parts.push(nutritionPlan.description || nutritionPlan.reasoning?.substring(0, 150));
    }
    
    return parts.join(' | ');
  }

  _determineCategory(goals = []) {
    const categoryMap = {
      muscle_gain: 'hypertrophy',
      weight_loss: 'weight_loss',
      strength: 'strength',
      endurance: 'endurance',
      general_fitness: 'general_fitness',
      sports_performance: 'sports_specific',
      rehabilitation: 'rehabilitation',
    };

    return categoryMap[goals[0]] || 'general_fitness';
  }

  _generateTags(generatedProgram) {
    const tags = [];
    const { workoutProgram, nutritionPlan } = generatedProgram.generatedContent;

    // Add goal-based tags
    if (generatedProgram.inputData.goals) {
      tags.push(...generatedProgram.inputData.goals);
    }

    // Add duration tag
    if (workoutProgram?.duration?.weeks) {
      tags.push(`${workoutProgram.duration.weeks}-week`);
    }

    // Add equipment tags
    const equipment = generatedProgram.inputData.clientProfile?.equipment;
    if (equipment?.hasGymAccess) {
      tags.push('gym');
    } else {
      tags.push('home');
    }

    // Add diet tags
    if (nutritionPlan && generatedProgram.inputData.clientProfile?.nutritionPreferences?.dietType) {
      tags.push(generatedProgram.inputData.clientProfile.nutritionPreferences.dietType);
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  _hashInputData(inputData) {
    const relevantData = {
      goals: inputData.goals?.sort(),
      experienceLevel: inputData.clientProfile?.fitnessProfile?.experienceLevel,
      duration: inputData.duration,
      equipment: inputData.clientProfile?.equipment?.homeEquipment?.sort(),
      dietType: inputData.clientProfile?.nutritionPreferences?.dietType,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(relevantData))
      .digest('hex');
  }

  _adjustDuration(content, newDuration) {
    // Simple duration scaling (could be more sophisticated)
    if (content.workoutProgram) {
      content.workoutProgram.duration.weeks = newDuration;
    }
    return content;
  }

  _substituteEquipment(content, availableEquipment) {
    // Equipment substitution logic (simplified)
    // In production, this would have a comprehensive substitution map
    if (content.workoutProgram) {
      content.workoutProgram.workouts = content.workoutProgram.workouts.map(workout => ({
        ...workout,
        equipment: workout.equipment?.filter(e => availableEquipment.includes(e)),
      }));
    }
    return content;
  }

  _adjustMacros(content, newMacros) {
    if (content.nutritionPlan) {
      content.nutritionPlan.dailyTargets = {
        ...content.nutritionPlan.dailyTargets,
        ...newMacros,
      };
    }
    return content;
  }
}

module.exports = new ProgramTemplateService();

