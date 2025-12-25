/**
 * Migration Utilities
 * Convert existing generated programs to versioned templates
 */

const GeneratedProgram = require('../models/generatedProgram.model');
const programTemplateService = require('../services/programTemplate.service');
const logger = require('../../../common/utils/logger');

class MigrationUtil {
  /**
   * Migrate all approved/applied programs to templates
   */
  async migrateExistingPrograms(options = {}) {
    const {
      status = ['approved', 'applied'],
      limit = 100,
      dryRun = false,
    } = options;

    logger.info('Starting program migration to templates', {
      status,
      limit,
      dryRun,
    });

    const programs = await GeneratedProgram.find({
      status: { $in: status },
      'generatedContent.workoutProgram': { $exists: true },
    })
      .limit(limit)
      .populate('coachId', 'firstName lastName');

    const results = {
      total: programs.length,
      migrated: 0,
      skipped: 0,
      errors: [],
    };

    for (const program of programs) {
      try {
        // Check if already migrated
        if (program.metadata?.templateId) {
          results.skipped++;
          continue;
        }

        if (dryRun) {
          logger.info('Would migrate program', {
            programId: program._id,
            coachId: program.coachId,
          });
          results.migrated++;
          continue;
        }

        // Create template
        const template = await programTemplateService.createTemplateFromGenerated(
          program._id,
          {
            visibility: 'private',
            status: 'active',
          }
        );

        // Update program with template reference
        program.metadata = {
          ...program.metadata,
          templateId: template.templateId,
          migratedAt: new Date(),
        };
        await program.save();

        results.migrated++;

        logger.info('Program migrated to template', {
          programId: program._id,
          templateId: template.templateId,
        });
      } catch (error) {
        results.errors.push({
          programId: program._id,
          error: error.message,
        });

        logger.error('Error migrating program', {
          programId: program._id,
          error: error.message,
        });
      }
    }

    logger.info('Migration completed', results);
    return results;
  }

  /**
   * Find and merge duplicate templates
   */
  async mergeDuplicateTemplates(options = {}) {
    const { dryRun = false } = options;

    logger.info('Finding duplicate templates', { dryRun });

    const ProgramTemplate = require('../models/programTemplate.model');

    // Group by content fingerprint
    const duplicates = await ProgramTemplate.aggregate([
      {
        $match: {
          status: 'active',
          isLatestVersion: true,
        },
      },
      {
        $group: {
          _id: '$contentFingerprint',
          count: { $sum: 1 },
          templates: { $push: { templateId: '$templateId', createdAt: '$createdAt', usage: '$usage' } },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    const results = {
      duplicateGroups: duplicates.length,
      merged: 0,
      kept: 0,
    };

    for (const group of duplicates) {
      // Keep the most used template, archive others
      const sorted = group.templates.sort((a, b) => 
        (b.usage?.timesUsed || 0) - (a.usage?.timesUsed || 0)
      );

      const keepTemplate = sorted[0];
      const archiveTemplates = sorted.slice(1);

      if (dryRun) {
        logger.info('Would keep template and archive duplicates', {
          keep: keepTemplate.templateId,
          archive: archiveTemplates.map(t => t.templateId),
        });
      } else {
        // Archive duplicates
        for (const template of archiveTemplates) {
          await ProgramTemplate.findOneAndUpdate(
            { templateId: template.templateId },
            { status: 'archived', archivedReason: 'duplicate' }
          );
        }

        logger.info('Merged duplicate templates', {
          kept: keepTemplate.templateId,
          archived: archiveTemplates.length,
        });
      }

      results.kept++;
      results.merged += archiveTemplates.length;
    }

    logger.info('Duplicate merge completed', results);
    return results;
  }

  /**
   * Rebuild template fingerprints
   */
  async rebuildFingerprints() {
    logger.info('Rebuilding template fingerprints');

    const ProgramTemplate = require('../models/programTemplate.model');

    const templates = await ProgramTemplate.find({});
    let updated = 0;

    for (const template of templates) {
      const oldContentFingerprint = template.contentFingerprint;
      const oldInputFingerprint = template.inputFingerprint;

      template.contentFingerprint = template.generateContentFingerprint();
      template.inputFingerprint = template.generateInputFingerprint();

      if (
        oldContentFingerprint !== template.contentFingerprint ||
        oldInputFingerprint !== template.inputFingerprint
      ) {
        await template.save();
        updated++;
      }
    }

    logger.info('Fingerprints rebuilt', { total: templates.length, updated });
    return { total: templates.length, updated };
  }

  /**
   * Generate usage statistics
   */
  async generateUsageStats() {
    const ProgramTemplate = require('../models/programTemplate.model');

    const stats = await ProgramTemplate.aggregate([
      {
        $match: {
          status: 'active',
          isLatestVersion: true,
        },
      },
      {
        $group: {
          _id: null,
          totalTemplates: { $sum: 1 },
          totalUsage: { $sum: '$usage.timesUsed' },
          avgRating: { $avg: '$usage.averageRating' },
          avgUsage: { $avg: '$usage.timesUsed' },
        },
      },
    ]);

    const byCategory = await ProgramTemplate.aggregate([
      {
        $match: {
          status: 'active',
          isLatestVersion: true,
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalUsage: { $sum: '$usage.timesUsed' },
          avgRating: { $avg: '$usage.averageRating' },
        },
      },
      {
        $sort: { totalUsage: -1 },
      },
    ]);

    return {
      overall: stats[0] || {},
      byCategory,
    };
  }
}

module.exports = new MigrationUtil();

