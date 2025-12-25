/**
 * Check-in Routes
 */

const express = require('express');
const checkinController = require('../controllers/checkin.controller');
const { authenticate, authorize } = require('../../../common/middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Check-in routes
router.post('/', checkinController.createCheckin);
router.get('/', checkinController.getCheckins);
router.get('/latest/:clientId?', checkinController.getLatestCheckin);
router.get('/stats', checkinController.getCheckinStats);
router.get('/:id', checkinController.getCheckin);
router.put('/:id', checkinController.updateCheckin);
router.delete('/:id', checkinController.deleteCheckin);

// Coach-only routes
router.post('/:id/feedback', authorize('coach', 'admin'), checkinController.addCoachFeedback);

module.exports = router;
