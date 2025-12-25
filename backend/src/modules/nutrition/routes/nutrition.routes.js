/**
 * Nutrition Routes
 */

const express = require('express');
const nutritionController = require('../controllers/nutrition.controller');
const nutritionTargetRoutes = require('./nutritionTarget.routes');
const nutritionLogRoutes = require('./nutritionLog.routes');
const autoAdjustRoutes = require('./autoAdjust.routes');
const groceryListRoutes = require('./groceryList.routes');
const { authenticate, authorize } = require('../../../common/middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Nutrition Target routes (TDEE, BMR, macro calculations)
router.use('/targets', nutritionTargetRoutes);

// Nutrition Logging routes (daily tracking with sleep/mood)
router.use('/logs', nutritionLogRoutes);

// Auto-Adjust Rules routes (trainer-controlled automatic adjustments)
router.use('/auto-adjust', autoAdjustRoutes);

// Grocery List routes
router.use('/grocery-list', groceryListRoutes);

// Meal Plan routes
router.post('/meal-plans', authorize('coach', 'admin'), nutritionController.createMealPlan);
router.get('/meal-plans', nutritionController.getMealPlans);
router.get('/meal-plans/active/:clientId?', nutritionController.getActiveMealPlan);
router.get('/meal-plans/:id', nutritionController.getMealPlan);
router.put('/meal-plans/:id', authorize('coach', 'admin'), nutritionController.updateMealPlan);
router.delete('/meal-plans/:id', authorize('coach', 'admin'), nutritionController.deleteMealPlan);
router.post('/meal-plans/:id/assign', authorize('coach', 'admin'), nutritionController.assignMealPlan);

// Food Log routes
router.post('/food-logs', nutritionController.logFood);
router.get('/food-logs', nutritionController.getFoodLogs);
router.get('/food-logs/date/:date', nutritionController.getFoodLogByDate);
router.get('/food-logs/:id', nutritionController.getFoodLog);
router.put('/food-logs/:id', nutritionController.updateFoodLog);

// Stats routes
router.get('/stats', nutritionController.getNutritionStats);
router.get('/calories/comparison', nutritionController.getCalorieComparison);

module.exports = router;
