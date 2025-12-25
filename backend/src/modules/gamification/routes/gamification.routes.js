/**
 * Gamification Routes
 */

const express = require('express');
const gamificationController = require('../controllers/gamification.controller');
const { authenticate } = require('../../../common/middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/profile', gamificationController.getProfile);
router.get('/leaderboard', gamificationController.getLeaderboard);

module.exports = router;
