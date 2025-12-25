/**
 * Auto-Adjust Service
 * Automatically adjust nutrition targets based on trainer-defined rules
 */

const AutoAdjustRule = require('../models/autoAdjustRule.model');
const NutritionLog = require('../models/nutritionLog.model');
const NutritionTarget = require('../models/nutritionTarget.model');
const nutritionTargetService = require('./nutritionTarget.service');
const logger = require('../../../common/utils/logger');

class AutoAdjustService {
  /**
   * Create auto-adjust rule
   */
  async createRule(userId, createdBy, ruleData) {
    const rule = new AutoAdjustRule({
      userId,
      createdBy,
      ...ruleData,
    });

    await rule.save();

    logger.info(`Auto-adjust rule created for user ${userId} by ${createdBy}`);

    return rule;
  }

  /**
   * Update rule
   */
  async updateRule(ruleId, updates) {
    const rule = await AutoAdjustRule.findById(ruleId);

    if (!rule) {
      throw new Error('Rule not found');
    }

    Object.assign(rule, updates);
    await rule.save();

    logger.info(`Auto-adjust rule updated: ${ruleId}`);

    return rule;
  }

  /**
   * Get rules for user
   */
  async getRulesForUser(userId) {
    const rules = await AutoAdjustRule.find({
      userId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return rules;
  }

  /**
   * Check rules for a user
   */
  async checkRulesForUser(userId) {
    const rules = await this.getRulesForUser(userId);

    if (rules.length === 0) {
      return [];
    }

    const triggeredRules = [];

    for (const rule of rules) {
      const shouldTrigger = await this._evaluateRule(rule);

      if (shouldTrigger) {
        triggeredRules.push(rule);

        if (rule.autoApply) {
          await this._applyRule(rule);
        } else {
          logger.info(`Rule ${rule._id} triggered but requires approval`);
        }
      }

      // Update last checked
      rule.lastChecked = new Date();
      await rule.save();
    }

    return triggeredRules;
  }

  /**
   * Evaluate if rule should trigger
   */
  async _evaluateRule(rule) {
    const { userId, conditions } = rule;
    let shouldTrigger = true;

    // Check weight trend condition
    if (conditions.weightTrend?.enabled) {
      const weightTrendMet = await this._checkWeightTrend(
        userId,
        conditions.weightTrend.threshold,
        conditions.weightTrend.direction,
        conditions.weightTrend.weeks,
      );

      if (!weightTrendMet) {
        shouldTrigger = false;
      }
    }

    // Check adherence condition
    if (conditions.adherence?.enabled) {
      const adherenceMet = await this._checkAdherence(
        userId,
        conditions.adherence.minPercentage,
        conditions.adherence.weeks,
      );

      if (!adherenceMet) {
        shouldTrigger = false;
      }
    }

    // Check performance condition
    if (conditions.performance?.enabled) {
      const performanceMet = await this._checkPerformance(
        userId,
        conditions.performance,
      );

      if (!performanceMet) {
        shouldTrigger = false;
      }
    }

    return shouldTrigger;
  }

  /**
   * Check weight trend
   */
  async _checkWeightTrend(userId, threshold, direction, weeks) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const logs = await NutritionLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      weight: { $exists: true },
    }).sort({ date: 1 });

    if (logs.length < 2) {
      return false; // Not enough data
    }

    const firstWeight = logs[0].weight;
    const lastWeight = logs[logs.length - 1].weight;
    const daysBetween = (logs[logs.length - 1].date - logs[0].date) / (1000 * 60 * 60 * 24);
    const weeklyChange = ((lastWeight - firstWeight) / daysBetween) * 7;

    const absChange = Math.abs(weeklyChange);
    const actualDirection = weeklyChange > 0 ? 'increasing' : weeklyChange < 0 ? 'decreasing' : 'stable';

    // Check if trend meets threshold and direction
    if (direction === 'stable') {
      return absChange < threshold;
    }

    return absChange >= threshold && actualDirection === direction;
  }

  /**
   * Check adherence
   */
  async _checkAdherence(userId, minPercentage, weeks) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const logs = await NutritionLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      'adherence.withinTarget': { $exists: true },
    });

    if (logs.length === 0) {
      return false;
    }

    const withinTarget = logs.filter(l => l.adherence.withinTarget).length;
    const adherenceRate = (withinTarget / logs.length) * 100;

    return adherenceRate >= minPercentage;
  }

  /**
   * Check performance metrics
   */
  async _checkPerformance(userId, performanceConditions) {
    const logs = await NutritionLog.find({
      userId,
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    if (logs.length === 0) {
      return false;
    }

    // Check energy levels
    if (performanceConditions.energyLevel) {
      const energyLevels = logs.filter(l => l.energy).map(l => l.energy);
      const lowEnergyCount = energyLevels.filter(e => e === 'very_low' || e === 'low').length;
      
      if (lowEnergyCount / energyLevels.length > 0.5) {
        return true; // More than half the days had low energy
      }
    }

    // Check sleep quality
    if (performanceConditions.sleepQuality) {
      const sleepQuality = logs.filter(l => l.sleep?.quality).map(l => l.sleep.quality);
      const poorSleepCount = sleepQuality.filter(q => q === 'poor' || q === 'fair').length;
      
      if (poorSleepCount / sleepQuality.length > 0.5) {
        return true; // More than half the days had poor sleep
      }
    }

    return false;
  }

  /**
   * Apply rule adjustments
   */
  async _applyRule(rule) {
    const { userId, actions } = rule;

    // Get current nutrition target
    const currentTarget = await NutritionTarget.findOne({
      userId,
      isActive: true,
    });

    if (!currentTarget) {
      logger.warn(`No active nutrition target for user ${userId}, cannot apply rule`);
      return;
    }

    const updates = {};
    let reason = `Auto-adjustment triggered by rule: ${rule.name}. `;

    // Calculate adjustments
    if (actions.calorieAdjustment) {
      updates.calorieTarget = currentTarget.calorieTarget.value + actions.calorieAdjustment;
      reason += `Calories ${actions.calorieAdjustment > 0 ? '+' : ''}${actions.calorieAdjustment}. `;
    }

    if (actions.percentageAdjustment) {
      const adjustment = Math.round(currentTarget.calorieTarget.value * (actions.percentageAdjustment / 100));
      updates.calorieTarget = currentTarget.calorieTarget.value + adjustment;
      reason += `Calories ${actions.percentageAdjustment > 0 ? '+' : ''}${actions.percentageAdjustment}% (${adjustment} kcal). `;
    }

    if (actions.proteinAdjustment) {
      updates.macroTargets = updates.macroTargets || {};
      updates.macroTargets.protein = currentTarget.macroTargets.protein.grams + actions.proteinAdjustment;
      reason += `Protein ${actions.proteinAdjustment > 0 ? '+' : ''}${actions.proteinAdjustment}g. `;
    }

    if (actions.carbAdjustment) {
      updates.macroTargets = updates.macroTargets || {};
      updates.macroTargets.carbs = currentTarget.macroTargets.carbs.grams + actions.carbAdjustment;
      reason += `Carbs ${actions.carbAdjustment > 0 ? '+' : ''}${actions.carbAdjustment}g. `;
    }

    if (actions.fatAdjustment) {
      updates.macroTargets = updates.macroTargets || {};
      updates.macroTargets.fats = currentTarget.macroTargets.fats.grams + actions.fatAdjustment;
      reason += `Fats ${actions.fatAdjustment > 0 ? '+' : ''}${actions.fatAdjustment}g. `;
    }

    // Apply updates
    await nutritionTargetService.updateTarget(
      currentTarget._id,
      userId.toString(),
      updates,
      reason.trim(),
      rule.createdBy,
    );

    // Record trigger
    rule.triggers.push({
      date: new Date(),
      conditions: rule.conditions,
      adjustmentsMade: updates,
      approved: true,
      approvedBy: rule.createdBy,
    });
    rule.lastTriggered = new Date();
    await rule.save();

    logger.info(`Auto-adjust rule ${rule._id} applied for user ${userId}`);

    return { updated: true, adjustments: updates, reason };
  }

  /**
   * Manually approve and apply rule
   */
  async approveAndApplyRule(ruleId, approvedBy) {
    const rule = await AutoAdjustRule.findById(ruleId);

    if (!rule) {
      throw new Error('Rule not found');
    }

    const result = await this._applyRule(rule);

    // Update last trigger record with approval
    if (rule.triggers.length > 0) {
      const lastTrigger = rule.triggers[rule.triggers.length - 1];
      lastTrigger.approved = true;
      lastTrigger.approvedBy = approvedBy;
      await rule.save();
    }

    return result;
  }

  /**
   * Delete rule
   */
  async deleteRule(ruleId) {
    const result = await AutoAdjustRule.deleteOne({ _id: ruleId });

    if (result.deletedCount === 0) {
      throw new Error('Rule not found');
    }

    logger.info(`Auto-adjust rule deleted: ${ruleId}`);

    return { message: 'Rule deleted successfully' };
  }
}

module.exports = new AutoAdjustService();

