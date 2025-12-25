/**
 * Auto-Adjust Routes
 */

const express = require('express');
const autoAdjustController = require('../controllers/autoAdjust.controller');
const { authenticate, authorize } = require('../../../common/middleware/auth.middleware');
const { validate } = require('../../../common/middleware/validation.middleware');
const { body, param } = require('express-validator');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['coach', 'admin'])); // Only coaches/admins can manage rules

// Create rule
router.post(
  '/',
  [
    body('userId').isMongoId().withMessage('Valid user ID required'),
    body('name').notEmpty().withMessage('Rule name required'),
    validate,
  ],
  autoAdjustController.createRule,
);

// Get rules for user
router.get('/user/:userId', [param('userId').isMongoId(), validate], autoAdjustController.getRules);

// Update rule
router.patch('/:ruleId', [param('ruleId').isMongoId(), validate], autoAdjustController.updateRule);

// Check rules (manually trigger check)
router.post('/check/:userId', [param('userId').isMongoId(), validate], autoAdjustController.checkRules);

// Approve and apply rule
router.post('/approve/:ruleId', [param('ruleId').isMongoId(), validate], autoAdjustController.approveRule);

// Delete rule
router.delete('/:ruleId', [param('ruleId').isMongoId(), validate], autoAdjustController.deleteRule);

module.exports = router;

