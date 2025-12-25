/**
 * Nutrition Target Controller
 * Handles HTTP requests for nutrition target management
 */

const nutritionTargetService = require('../services/nutritionTarget.service');
const { ValidationError } = require('../../../common/utils/errors');
const logger = require('../../../common/utils/logger');

class NutritionTargetController {
  /**
   * Create new nutrition target
   * POST /api/nutrition/targets
   */
  async createTarget(req, res, next) {
    try {
      const { userId } = req.body;
      const createdBy = req.user._id;

      // If creating for client, user must be coach/admin
      if (userId && userId !== req.user._id.toString()) {
        if (req.user.role !== 'coach' && req.user.role !== 'admin') {
          throw new ValidationError('Only coaches/admins can create targets for other users');
        }
      }

      const targetUserId = userId || req.user._id;

      const target = await nutritionTargetService.createNutritionTarget(
        targetUserId,
        createdBy,
        req.body,
      );

      logger.info(`Nutrition target created: ${target._id} for user ${targetUserId}`);

      res.status(201).json({
        success: true,
        data: target,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active nutrition target
   * GET /api/nutrition/targets/active
   * GET /api/nutrition/targets/active/:userId (coach/admin)
   */
  async getActiveTarget(req, res, next) {
    try {
      const { userId } = req.params;
      
      // If getting for someone else, must be coach/admin
      if (userId && userId !== req.user._id.toString()) {
        if (req.user.role !== 'coach' && req.user.role !== 'admin') {
          throw new ValidationError('Unauthorized access');
        }
      }

      const targetUserId = userId || req.user._id;

      const target = await nutritionTargetService.getActiveTarget(targetUserId);

      res.json({
        success: true,
        data: target,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get nutrition target history
   * GET /api/nutrition/targets/history
   * GET /api/nutrition/targets/history/:userId (coach/admin)
   */
  async getTargetHistory(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 10, skip = 0 } = req.query;

      // If getting for someone else, must be coach/admin
      if (userId && userId !== req.user._id.toString()) {
        if (req.user.role !== 'coach' && req.user.role !== 'admin') {
          throw new ValidationError('Unauthorized access');
        }
      }

      const targetUserId = userId || req.user._id;

      const { targets, total } = await nutritionTargetService.getTargetHistory(
        targetUserId,
        { limit: parseInt(limit), skip: parseInt(skip) },
      );

      res.json({
        success: true,
        data: targets,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update nutrition target
   * PATCH /api/nutrition/targets/:targetId
   */
  async updateTarget(req, res, next) {
    try {
      const { targetId } = req.params;
      const { reason, clientFeedback, ...updates } = req.body;

      if (!reason) {
        throw new ValidationError('Reason for adjustment is required');
      }

      // Get target to verify ownership
      const existingTarget = await nutritionTargetService.getActiveTarget(req.user._id);
      
      if (existingTarget._id.toString() !== targetId) {
        if (req.user.role !== 'coach' && req.user.role !== 'admin') {
          throw new ValidationError('Unauthorized to update this target');
        }
      }

      const target = await nutritionTargetService.updateTarget(
        targetId,
        existingTarget.userId.toString(),
        updates,
        reason,
        req.user._id,
      );

      logger.info(`Nutrition target updated: ${targetId}`);

      res.json({
        success: true,
        data: target,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculate nutrition target
   * POST /api/nutrition/targets/:userId/recalculate
   */
  async recalculateTarget(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason = 'Manual recalculation' } = req.body;

      // Must be coach/admin to recalculate for others
      if (userId !== req.user._id.toString()) {
        if (req.user.role !== 'coach' && req.user.role !== 'admin') {
          throw new ValidationError('Unauthorized to recalculate for this user');
        }
      }

      const target = await nutritionTargetService.recalculateTarget(
        userId,
        req.user._id,
        reason,
      );

      logger.info(`Nutrition target recalculated for user ${userId}`);

      res.json({
        success: true,
        data: target,
        message: 'Nutrition target recalculated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get adherence report
   * GET /api/nutrition/targets/:targetId/adherence
   */
  async getAdherenceReport(req, res, next) {
    try {
      const { targetId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('Start date and end date are required');
      }

      const report = await nutritionTargetService.getAdherenceReport(
        targetId,
        new Date(startDate),
        new Date(endDate),
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get targets due for review (coach/admin only)
   * GET /api/nutrition/targets/review/due
   */
  async getTargetsDueForReview(req, res, next) {
    try {
      if (req.user.role !== 'coach' && req.user.role !== 'admin') {
        throw new ValidationError('Only coaches/admins can access this endpoint');
      }

      const coachId = req.user.role === 'coach' ? req.user._id : null;

      const targets = await nutritionTargetService.getTargetsDueForReview(coachId);

      res.json({
        success: true,
        data: targets,
        count: targets.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Compare nutrition targets
   * GET /api/nutrition/targets/compare/:currentId/:previousId
   */
  async compareTargets(req, res, next) {
    try {
      const { currentId, previousId } = req.params;

      // Get current target to verify access
      const currentTarget = await nutritionTargetService.getActiveTarget(req.user._id);

      if (currentTarget._id.toString() !== currentId) {
        if (req.user.role !== 'coach' && req.user.role !== 'admin') {
          throw new ValidationError('Unauthorized access');
        }
      }

      const comparison = await nutritionTargetService.compareTargets(
        currentTarget.userId,
        currentId,
        previousId,
      );

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get target by ID
   * GET /api/nutrition/targets/:targetId
   */
  async getTargetById(req, res, next) {
    try {
      const { targetId } = req.params;

      const NutritionTarget = require('../models/nutritionTarget.model');
      const target = await NutritionTarget.findById(targetId)
        .populate('userId', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email');

      if (!target) {
        throw new NotFoundError('Nutrition target');
      }

      // Check access
      if (
        target.userId._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'coach' &&
        req.user.role !== 'admin'
      ) {
        throw new ValidationError('Unauthorized access');
      }

      res.json({
        success: true,
        data: target,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quick calculation preview (doesn't save)
   * POST /api/nutrition/targets/preview
   */
  async getCalculationPreview(req, res, next) {
    try {
      const {
        weight,
        height,
        age,
        gender,
        activityLevel,
        goal,
        targetRate,
        bmrFormula = 'mifflin_st_jeor',
      } = req.body;

      if (!weight || !height || !age || !gender || !activityLevel || !goal) {
        throw new ValidationError('All fields required for preview calculation');
      }

      const nutritionCalculator = require('../utils/nutritionCalculator');

      // Calculate BMR
      const bmrData = nutritionCalculator.calculateBMR(
        { weight, height, age, gender },
        bmrFormula,
      );

      // Calculate TDEE
      const tdeeData = nutritionCalculator.calculateTDEE(
        bmrData.value,
        activityLevel,
      );

      // Calculate calorie target
      const calorieData = nutritionCalculator.calculateCalorieTarget(
        tdeeData.value,
        goal,
        { targetRate, bodyWeight: weight },
      );

      // Calculate macros
      const macroData = nutritionCalculator.calculateMacros(
        calorieData.value,
        weight,
        goal,
      );

      // Calculate water
      const waterData = nutritionCalculator.calculateWaterIntake(
        weight,
        activityLevel,
      );

      res.json({
        success: true,
        data: {
          bmr: bmrData,
          tdee: tdeeData,
          calorieTarget: calorieData,
          macros: macroData,
          water: waterData,
          note: 'This is a preview calculation. Use POST /api/nutrition/targets to save.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NutritionTargetController();

