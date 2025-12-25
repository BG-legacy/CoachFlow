/**
 * Program Editor Service
 * Handles manual edits to AI-generated programs with full change tracking
 */

const GeneratedProgram = require('../models/generatedProgram.model');
const logger = require('../../../common/utils/logger');
const { getAlternatives, findBestAlternative } = require('../data/exerciseAlternatives');

class ProgramEditorService {
  /**
   * Edit a generated program with change tracking
   */
  async editProgram(programId, edits, coachId) {
    const program = await GeneratedProgram.findById(programId);

    if (!program) {
      throw new Error('Generated program not found');
    }

    // Verify coach owns this program
    if (program.coachId.toString() !== coachId.toString()) {
      throw new Error('Unauthorized: Coach does not own this program');
    }

    const modifications = [];
    const originalContent = JSON.parse(JSON.stringify(program.generatedContent));

    // Apply edits
    if (edits.workoutProgram) {
      const workoutMods = this._editWorkoutProgram(
        program.generatedContent.workoutProgram,
        edits.workoutProgram,
        edits.reason
      );
      modifications.push(...workoutMods);
    }

    if (edits.nutritionPlan) {
      const nutritionMods = this._editNutritionPlan(
        program.generatedContent.nutritionPlan,
        edits.nutritionPlan,
        edits.reason
      );
      modifications.push(...nutritionMods);
    }

    // Update program
    program.quality = program.quality || {};
    program.quality.modifications = program.quality.modifications || [];
    program.quality.modifications.push(...modifications);
    
    // Update status if needed
    if (program.status === 'generated') {
      program.status = 'reviewed';
      program.reviewedBy = coachId;
      program.reviewedAt = new Date();
    }

    await program.save();

    logger.info('Program edited successfully', {
      programId,
      coachId,
      modificationsCount: modifications.length,
    });

    return {
      program,
      modifications,
      summary: this._generateEditSummary(modifications),
    };
  }

  /**
   * Swap an exercise in a workout
   */
  async swapExercise(programId, workoutIndex, exerciseIndex, newExercise, reason, coachId) {
    const program = await GeneratedProgram.findById(programId);

    if (!program) {
      throw new Error('Generated program not found');
    }

    if (program.coachId.toString() !== coachId.toString()) {
      throw new Error('Unauthorized: Coach does not own this program');
    }

    const workouts = program.generatedContent.workoutProgram?.workouts;
    if (!workouts || !workouts[workoutIndex]) {
      throw new Error('Workout not found at specified index');
    }

    const workout = workouts[workoutIndex];
    const exercises = workout.exercises || [];

    if (!exercises[exerciseIndex]) {
      throw new Error('Exercise not found at specified index');
    }

    const originalExercise = exercises[exerciseIndex];

    // Update exercise
    exercises[exerciseIndex] = {
      ...originalExercise,
      ...newExercise,
      swapped: true,
      swappedAt: new Date(),
      swapReason: reason,
    };

    // Track modification
    const modification = {
      field: `workouts[${workoutIndex}].exercises[${exerciseIndex}]`,
      originalValue: originalExercise,
      modifiedValue: exercises[exerciseIndex],
      reason: reason || 'Exercise swap',
      modifiedAt: new Date(),
    };

    program.quality = program.quality || {};
    program.quality.modifications = program.quality.modifications || [];
    program.quality.modifications.push(modification);

    await program.save();

    logger.info('Exercise swapped successfully', {
      programId,
      workoutIndex,
      exerciseIndex,
      from: originalExercise.name,
      to: newExercise.name,
      reason,
    });

    return {
      program,
      modification,
      workout,
      swappedExercise: exercises[exerciseIndex],
    };
  }

  /**
   * Get exercise alternatives for swapping
   */
  getExerciseAlternatives(exerciseName, criteria = {}) {
    return getAlternatives(exerciseName, criteria);
  }

  /**
   * Get best exercise alternative
   */
  getBestAlternative(exerciseName, criteria = {}) {
    return findBestAlternative(exerciseName, criteria);
  }

  /**
   * Bulk swap exercises based on equipment availability
   */
  async bulkSwapByEquipment(programId, availableEquipment, coachId) {
    const program = await GeneratedProgram.findById(programId);

    if (!program) {
      throw new Error('Generated program not found');
    }

    if (program.coachId.toString() !== coachId.toString()) {
      throw new Error('Unauthorized');
    }

    const workouts = program.generatedContent.workoutProgram?.workouts;
    if (!workouts) {
      throw new Error('No workouts found in program');
    }

    const swaps = [];
    const modifications = [];

    // Iterate through all exercises
    workouts.forEach((workout, workoutIdx) => {
      const exercises = workout.exercises || [];
      
      exercises.forEach((exercise, exerciseIdx) => {
        // Check if exercise requires unavailable equipment
        const needsSwap = this._needsEquipmentSwap(exercise, availableEquipment);
        
        if (needsSwap) {
          const alternative = findBestAlternative(exercise.name, {
            availableEquipment,
            reason: 'equipment',
            minSimilarity: 0.7,
          });

          if (alternative && alternative.recommended) {
            const originalExercise = { ...exercise };
            
            // Apply swap
            exercises[exerciseIdx] = {
              ...exercise,
              name: alternative.recommended.exercise,
              equipment: alternative.recommended.equipment,
              swapped: true,
              swappedAt: new Date(),
              swapReason: 'Equipment availability',
              originalExercise: exercise.name,
            };

            swaps.push({
              workoutIndex: workoutIdx,
              exerciseIndex: exerciseIdx,
              from: originalExercise.name,
              to: alternative.recommended.exercise,
              reason: alternative.recommended.notes,
            });

            modifications.push({
              field: `workouts[${workoutIdx}].exercises[${exerciseIdx}]`,
              originalValue: originalExercise,
              modifiedValue: exercises[exerciseIdx],
              reason: 'Bulk equipment swap',
              modifiedAt: new Date(),
            });
          }
        }
      });
    });

    if (modifications.length > 0) {
      program.quality = program.quality || {};
      program.quality.modifications = program.quality.modifications || [];
      program.quality.modifications.push(...modifications);
      await program.save();
    }

    logger.info('Bulk equipment swap completed', {
      programId,
      swapsCount: swaps.length,
    });

    return {
      program,
      swaps,
      summary: `Swapped ${swaps.length} exercise(s) based on equipment availability`,
    };
  }

  /**
   * Adjust workout difficulty (sets/reps/weight)
   */
  async adjustDifficulty(programId, adjustment, coachId) {
    const program = await GeneratedProgram.findById(programId);

    if (!program) {
      throw new Error('Generated program not found');
    }

    if (program.coachId.toString() !== coachId.toString()) {
      throw new Error('Unauthorized');
    }

    const workouts = program.generatedContent.workoutProgram?.workouts;
    if (!workouts) {
      throw new Error('No workouts found');
    }

    const modifications = [];
    const multiplier = adjustment.type === 'increase' ? 1.1 : 0.9;

    workouts.forEach((workout, workoutIdx) => {
      const exercises = workout.exercises || [];
      
      exercises.forEach((exercise, exerciseIdx) => {
        const original = { ...exercise };

        // Adjust based on type
        if (adjustment.parameter === 'sets' || adjustment.parameter === 'all') {
          exercise.sets = Math.max(1, Math.round(exercise.sets * multiplier));
        }

        if (adjustment.parameter === 'reps' || adjustment.parameter === 'all') {
          exercise.reps = Math.max(1, Math.round(exercise.reps * multiplier));
        }

        if (adjustment.parameter === 'weight' || adjustment.parameter === 'all') {
          if (exercise.weight) {
            exercise.weight = Math.round(exercise.weight * multiplier);
          }
        }

        // Track if changed
        if (JSON.stringify(original) !== JSON.stringify(exercise)) {
          modifications.push({
            field: `workouts[${workoutIdx}].exercises[${exerciseIdx}]`,
            originalValue: original,
            modifiedValue: { ...exercise },
            reason: `Difficulty ${adjustment.type} - ${adjustment.parameter}`,
            modifiedAt: new Date(),
          });
        }
      });
    });

    if (modifications.length > 0) {
      program.quality = program.quality || {};
      program.quality.modifications = program.quality.modifications || [];
      program.quality.modifications.push(...modifications);
      await program.save();
    }

    logger.info('Workout difficulty adjusted', {
      programId,
      adjustment,
      modificationsCount: modifications.length,
    });

    return {
      program,
      modifications,
      summary: `Adjusted difficulty: ${adjustment.type} ${adjustment.parameter}`,
    };
  }

  /**
   * Get edit history for a program
   */
  async getEditHistory(programId) {
    const program = await GeneratedProgram.findById(programId)
      .populate('reviewedBy', 'firstName lastName')
      .populate('appliedBy', 'firstName lastName');

    if (!program) {
      throw new Error('Program not found');
    }

    const modifications = program.quality?.modifications || [];

    return {
      programId,
      totalEdits: modifications.length,
      modifications: modifications.map(mod => ({
        field: mod.field,
        reason: mod.reason,
        modifiedAt: mod.modifiedAt,
        changes: this._summarizeChange(mod.originalValue, mod.modifiedValue),
      })),
      reviewInfo: {
        status: program.status,
        reviewedBy: program.reviewedBy,
        reviewedAt: program.reviewedAt,
      },
    };
  }

  /**
   * Revert specific edit
   */
  async revertEdit(programId, modificationIndex, coachId) {
    const program = await GeneratedProgram.findById(programId);

    if (!program) {
      throw new Error('Program not found');
    }

    if (program.coachId.toString() !== coachId.toString()) {
      throw new Error('Unauthorized');
    }

    const modifications = program.quality?.modifications || [];
    if (!modifications[modificationIndex]) {
      throw new Error('Modification not found');
    }

    const mod = modifications[modificationIndex];

    // Restore original value
    this._applyValueToPath(
      program.generatedContent,
      mod.field,
      mod.originalValue
    );

    // Remove from modifications
    modifications.splice(modificationIndex, 1);

    await program.save();

    logger.info('Edit reverted', {
      programId,
      modificationIndex,
      field: mod.field,
    });

    return {
      program,
      reverted: mod,
      message: 'Edit successfully reverted',
    };
  }

  // Private helper methods

  _editWorkoutProgram(workoutProgram, edits, reason) {
    const modifications = [];

    if (edits.name && edits.name !== workoutProgram.name) {
      modifications.push({
        field: 'workoutProgram.name',
        originalValue: workoutProgram.name,
        modifiedValue: edits.name,
        reason: reason || 'Name change',
        modifiedAt: new Date(),
      });
      workoutProgram.name = edits.name;
    }

    if (edits.description) {
      modifications.push({
        field: 'workoutProgram.description',
        originalValue: workoutProgram.description,
        modifiedValue: edits.description,
        reason: reason || 'Description update',
        modifiedAt: new Date(),
      });
      workoutProgram.description = edits.description;
    }

    if (edits.duration) {
      modifications.push({
        field: 'workoutProgram.duration',
        originalValue: { ...workoutProgram.duration },
        modifiedValue: edits.duration,
        reason: reason || 'Duration adjustment',
        modifiedAt: new Date(),
      });
      workoutProgram.duration = { ...workoutProgram.duration, ...edits.duration };
    }

    return modifications;
  }

  _editNutritionPlan(nutritionPlan, edits, reason) {
    const modifications = [];

    if (edits.dailyTargets) {
      modifications.push({
        field: 'nutritionPlan.dailyTargets',
        originalValue: { ...nutritionPlan.dailyTargets },
        modifiedValue: edits.dailyTargets,
        reason: reason || 'Macro targets adjustment',
        modifiedAt: new Date(),
      });
      nutritionPlan.dailyTargets = { ...nutritionPlan.dailyTargets, ...edits.dailyTargets };
    }

    if (edits.name) {
      modifications.push({
        field: 'nutritionPlan.name',
        originalValue: nutritionPlan.name,
        modifiedValue: edits.name,
        reason: reason || 'Name change',
        modifiedAt: new Date(),
      });
      nutritionPlan.name = edits.name;
    }

    return modifications;
  }

  _needsEquipmentSwap(exercise, availableEquipment) {
    // Simple check - in production would be more sophisticated
    if (!exercise.equipment) return false;
    
    const requiredEquipment = Array.isArray(exercise.equipment) 
      ? exercise.equipment 
      : [exercise.equipment];

    return !requiredEquipment.every(eq => availableEquipment.includes(eq));
  }

  _generateEditSummary(modifications) {
    const fieldCounts = {};
    modifications.forEach(mod => {
      const topLevel = mod.field.split('.')[0];
      fieldCounts[topLevel] = (fieldCounts[topLevel] || 0) + 1;
    });

    return {
      totalEdits: modifications.length,
      editsByField: fieldCounts,
      mostRecentEdit: modifications[modifications.length - 1],
    };
  }

  _summarizeChange(original, modified) {
    if (typeof original === 'object' && original !== null) {
      const changes = {};
      for (const key in modified) {
        if (original[key] !== modified[key]) {
          changes[key] = {
            from: original[key],
            to: modified[key],
          };
        }
      }
      return changes;
    }
    
    return {
      from: original,
      to: modified,
    };
  }

  _applyValueToPath(obj, path, value) {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const arrayMatch = part.match(/(.+)\[(\d+)\]/);
      
      if (arrayMatch) {
        const arrayName = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);
        current = current[arrayName][index];
      } else {
        current = current[part];
      }
    }

    const lastPart = parts[parts.length - 1];
    const arrayMatch = lastPart.match(/(.+)\[(\d+)\]/);
    
    if (arrayMatch) {
      const arrayName = arrayMatch[1];
      const index = parseInt(arrayMatch[2]);
      current[arrayName][index] = value;
    } else {
      current[lastPart] = value;
    }
  }
}

module.exports = new ProgramEditorService();


