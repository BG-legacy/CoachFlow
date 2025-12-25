/**
 * Session Routes
 */

const express = require('express');
const sessionController = require('../controllers/session.controller');
const { authenticate, authorize } = require('../../../common/middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', authorize('coach', 'admin'), sessionController.createSession);
router.get('/', sessionController.getSessions);
router.get('/upcoming', sessionController.getUpcomingSessions);
router.get('/:id', sessionController.getSession);
router.put('/:id', sessionController.updateSession);
router.post('/:id/cancel', sessionController.cancelSession);

module.exports = router;
