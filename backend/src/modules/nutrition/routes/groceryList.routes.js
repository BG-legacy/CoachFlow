/**
 * Grocery List Routes
 */

const express = require('express');
const groceryListController = require('../controllers/groceryList.controller');
const { authenticate } = require('../../../common/middleware/auth.middleware');
const { validate } = require('../../../common/middleware/validation.middleware');
const { param } = require('express-validator');

const router = express.Router();

router.use(authenticate);

// Generate grocery list
router.get(
  '/:mealPlanId',
  [param('mealPlanId').isMongoId().withMessage('Invalid meal plan ID'), validate],
  groceryListController.generateGroceryList,
);

// Export grocery list as text
router.get(
  '/:mealPlanId/export',
  [param('mealPlanId').isMongoId(), validate],
  groceryListController.exportGroceryList,
);

module.exports = router;

