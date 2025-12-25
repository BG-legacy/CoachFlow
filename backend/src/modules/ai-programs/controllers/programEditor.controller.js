/**
 * Program Editor Controller
 * Handles HTTP requests for editing AI-generated programs
 */

const programEditorService = require('../services/programEditor.service');
const { successResponse, errorResponse } = require('../../../common/utils/response');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../../../common/utils/errors');

class ProgramEditorController {
  /**
   * Edit a generated program
   * POST /ai-programs/:id/edit
   */
  async editProgram(req, res) {
    try {
      const { id } = req.params;
      const coachId = req.user.id || req.user._id;
      const edits = req.body;

      if (!edits || Object.keys(edits).length === 0) {
        throw new BadRequestError('No edits provided');
      }

      const result = await programEditorService.editProgram(id, edits, coachId);

      return successResponse(
        res,
        result,
        `Program edited successfully. ${result.modifications.length} modification(s) made.`
      );
    } catch (error) {
      if (error.message.includes('not found')) {
        return errorResponse(res, error.message, 404);
      }
      if (error.message.includes('Unauthorized')) {
        return errorResponse(res, error.message, 403);
      }
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Swap an exercise in a workout
   * POST /ai-programs/:id/workouts/:workoutIndex/exercises/:exerciseIndex/swap
   */
  async swapExercise(req, res) {
    try {
      const { id, workoutIndex, exerciseIndex } = req.params;
      const { newExercise, reason } = req.body;
      const coachId = req.user.id || req.user._id;

      if (!newExercise || !newExercise.name) {
        throw new BadRequestError('New exercise details required');
      }

      const result = await programEditorService.swapExercise(
        id,
        parseInt(workoutIndex),
        parseInt(exerciseIndex),
        newExercise,
        reason,
        coachId
      );

      return successResponse(
        res,
        result,
        'Exercise swapped successfully'
      );
    } catch (error) {
      if (error.message.includes('not found')) {
        return errorResponse(res, error.message, 404);
      }
      if (error.message.includes('Unauthorized')) {
        return errorResponse(res, error.message, 403);
      }
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get exercise alternatives
   * GET /ai-programs/exercises/:exerciseName/alternatives
   */
  async getExerciseAlternatives(req, res) {
    try {
      const { exerciseName } = req.params;
      const { reason, availableEquipment, minSimilarity } = req.query;

      const criteria = {};
      if (reason) criteria.reason = reason;
      if (availableEquipment) {
        criteria.availableEquipment = availableEquipment.split(',');
      }
      if (minSimilarity) criteria.minSimilarity = parseFloat(minSimilarity);

      const alternatives = programEditorService.getExerciseAlternatives(
        exerciseName,
        criteria
      );

      if (!alternatives) {
        return errorResponse(
          res,
          `No alternatives found for exercise: ${exerciseName}`,
          404
        );
      }

      return successResponse(res, alternatives);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get best exercise alternative
   * GET /ai-programs/exercises/:exerciseName/best-alternative
   */
  async getBestAlternative(req, res) {
    try {
      const { exerciseName } = req.params;
      const { reason, availableEquipment, minSimilarity } = req.query;

      const criteria = {};
      if (reason) criteria.reason = reason;
      if (availableEquipment) {
        criteria.availableEquipment = availableEquipment.split(',');
      }
      if (minSimilarity) criteria.minSimilarity = parseFloat(minSimilarity);

      const result = programEditorService.getBestAlternative(
        exerciseName,
        criteria
      );

      if (!result) {
        return errorResponse(
          res,
          `No suitable alternatives found for exercise: ${exerciseName}`,
          404
        );
      }

      return successResponse(res, result);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Bulk swap exercises by equipment
   * POST /ai-programs/:id/bulk-swap-equipment
   */
  async bulkSwapByEquipment(req, res) {
    try {
      const { id } = req.params;
      const { availableEquipment } = req.body;
      const coachId = req.user.id || req.user._id;

      if (!availableEquipment || !Array.isArray(availableEquipment)) {
        throw new BadRequestError('availableEquipment array required');
      }

      const result = await programEditorService.bulkSwapByEquipment(
        id,
        availableEquipment,
        coachId
      );

      return successResponse(
        res,
        result,
        result.summary
      );
    } catch (error) {
      if (error.message.includes('not found')) {
        return errorResponse(res, error.message, 404);
      }
      if (error.message.includes('Unauthorized')) {
        return errorResponse(res, error.message, 403);
      }
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Adjust workout difficulty
   * POST /ai-programs/:id/adjust-difficulty
   */
  async adjustDifficulty(req, res) {
    try {
      const { id } = req.params;
      const adjustment = req.body;
      const coachId = req.user.id || req.user._id;

      if (!adjustment.type || !adjustment.parameter) {
        throw new BadRequestError('adjustment.type and adjustment.parameter required');
      }

      if (!['increase', 'decrease'].includes(adjustment.type)) {
        throw new BadRequestError('adjustment.type must be "increase" or "decrease"');
      }

      if (!['sets', 'reps', 'weight', 'all'].includes(adjustment.parameter)) {
        throw new BadRequestError('adjustment.parameter must be "sets", "reps", "weight", or "all"');
      }

      const result = await programEditorService.adjustDifficulty(
        id,
        adjustment,
        coachId
      );

      return successResponse(
        res,
        result,
        result.summary
      );
    } catch (error) {
      if (error.message.includes('not found')) {
        return errorResponse(res, error.message, 404);
      }
      if (error.message.includes('Unauthorized')) {
        return errorResponse(res, error.message, 403);
      }
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get edit history
   * GET /ai-programs/:id/edit-history
   */
  async getEditHistory(req, res) {
    try {
      const { id } = req.params;

      const history = await programEditorService.getEditHistory(id);

      return successResponse(res, history);
    } catch (error) {
      if (error.message.includes('not found')) {
        return errorResponse(res, error.message, 404);
      }
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Revert a specific edit
   * DELETE /ai-programs/:id/edits/:modificationIndex
   */
  async revertEdit(req, res) {
    try {
      const { id, modificationIndex } = req.params;
      const coachId = req.user.id || req.user._id;

      const result = await programEditorService.revertEdit(
        id,
        parseInt(modificationIndex),
        coachId
      );

      return successResponse(res, result, result.message);
    } catch (error) {
      if (error.message.includes('not found')) {
        return errorResponse(res, error.message, 404);
      }
      if (error.message.includes('Unauthorized')) {
        return errorResponse(res, error.message, 403);
      }
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = new ProgramEditorController();


