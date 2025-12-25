/**
 * Auto-Adjust Controller
 */

const autoAdjustService = require('../services/autoAdjust.service');

class AutoAdjustController {
  async createRule(req, res, next) {
    try {
      const userId = req.body.userId;
      const createdBy = req.user._id;

      // Only coaches/admins can create auto-adjust rules
      if (req.user.role !== 'coach' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only coaches and admins can create auto-adjust rules',
        });
      }

      const rule = await autoAdjustService.createRule(userId, createdBy, req.body);

      res.status(201).json({ success: true, data: rule });
    } catch (error) {
      next(error);
    }
  }

  async getRules(req, res, next) {
    try {
      const userId = req.params.userId || req.user._id;

      const rules = await autoAdjustService.getRulesForUser(userId);

      res.json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  }

  async updateRule(req, res, next) {
    try {
      const { ruleId } = req.params;

      const rule = await autoAdjustService.updateRule(ruleId, req.body);

      res.json({ success: true, data: rule });
    } catch (error) {
      next(error);
    }
  }

  async checkRules(req, res, next) {
    try {
      const userId = req.params.userId || req.user._id;

      const triggeredRules = await autoAdjustService.checkRulesForUser(userId);

      res.json({
        success: true,
        data: {
          triggered: triggeredRules.length,
          rules: triggeredRules,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async approveRule(req, res, next) {
    try {
      const { ruleId } = req.params;
      const approvedBy = req.user._id;

      const result = await autoAdjustService.approveAndApplyRule(ruleId, approvedBy);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteRule(req, res, next) {
    try {
      const { ruleId } = req.params;

      const result = await autoAdjustService.deleteRule(ruleId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AutoAdjustController();

