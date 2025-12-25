/**
 * Form Analysis Routes
 * With AI rate limiting for analysis endpoints
 */

const express = require('express');
const formAnalysisController = require('../controllers/formAnalysis.controller');
const { authenticate, authorize } = require('../../../common/middleware/auth');
const { aiLimiter, uploadLimiter } = require('../../../common/middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

// Apply AI rate limiter to upload endpoint (as it triggers AI analysis)
router.post(
  '/upload',
  uploadLimiter,
  aiLimiter,
  formAnalysisController.uploadMiddleware,
  formAnalysisController.uploadVideo,
);
router.get('/', formAnalysisController.getAnalyses);
router.get('/history', formAnalysisController.getUserHistory);
router.get('/:id', formAnalysisController.getAnalysis);
router.post('/:id/feedback', authorize('coach', 'admin'), formAnalysisController.addCoachFeedback);

module.exports = router;
