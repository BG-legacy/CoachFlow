/**
 * Meal Plan Versioning Service
 * Handles version management with activeVersionId pointer pattern
 */

const MealPlan = require('../models/mealPlan.model');

class MealPlanVersionService {
  /**
   * Create new version of a meal plan
   */
  async createNewVersion(planId, updates, versionNotes) {
    const currentPlan = await MealPlan.findById(planId);
    if (!currentPlan) {
      throw new Error('Meal plan not found');
    }

    const rootPlanId = currentPlan.parentPlanId || currentPlan._id;

    const newVersion = new MealPlan({
      ...currentPlan.toObject(),
      _id: undefined,
      ...updates,
      version: currentPlan.version + 1,
      parentPlanId: rootPlanId,
      versionNotes,
      isCurrentVersion: true,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await newVersion.save();

    await MealPlan.updateMany(
      {
        $or: [
          { _id: rootPlanId },
          { parentPlanId: rootPlanId },
        ],
      },
      {
        $set: {
          activeVersionId: newVersion._id,
          isCurrentVersion: false,
        },
      }
    );

    newVersion.isCurrentVersion = true;
    newVersion.activeVersionId = newVersion._id;
    await newVersion.save();

    return newVersion;
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(versionId) {
    const targetVersion = await MealPlan.findById(versionId);
    if (!targetVersion) {
      throw new Error('Version not found');
    }

    const rootPlanId = targetVersion.parentPlanId || targetVersion._id;

    await MealPlan.updateMany(
      {
        $or: [
          { _id: rootPlanId },
          { parentPlanId: rootPlanId },
        ],
      },
      {
        $set: {
          activeVersionId: versionId,
          isCurrentVersion: false,
        },
      }
    );

    targetVersion.isCurrentVersion = true;
    targetVersion.activeVersionId = versionId;
    await targetVersion.save();

    return targetVersion;
  }

  /**
   * Get all versions of a meal plan
   */
  async getVersionHistory(planId) {
    const plan = await MealPlan.findById(planId);
    if (!plan) {
      throw new Error('Meal plan not found');
    }

    const rootPlanId = plan.parentPlanId || plan._id;

    const versions = await MealPlan.find({
      $or: [
        { _id: rootPlanId },
        { parentPlanId: rootPlanId },
      ],
    }).sort({ version: -1 });

    return versions;
  }

  /**
   * Get current active version
   */
  async getActiveVersion(planId) {
    const plan = await MealPlan.findById(planId);
    if (!plan) {
      throw new Error('Meal plan not found');
    }

    if (plan.activeVersionId) {
      return await MealPlan.findById(plan.activeVersionId);
    }

    return plan;
  }
}

module.exports = new MealPlanVersionService();




