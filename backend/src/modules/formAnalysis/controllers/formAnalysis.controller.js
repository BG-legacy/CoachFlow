/**
 * Form Analysis Controller
 */

const formAnalysisService = require('../services/formAnalysis.service');
const { successResponse, createdResponse, paginatedResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const config = require('../../../common/config');

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.videoUploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

class FormAnalysisController {
  uploadMiddleware = upload.single('video');

  uploadVideo = asyncHandler(async (req, res) => {
    const { exerciseName } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided',
      });
    }

    const analysis = await formAnalysisService.uploadVideoAndAnalyze(
      req.user._id,
      file,
      exerciseName
    );

    return createdResponse(res, analysis, 'Video uploaded successfully. Analysis in progress.');
  });

  getAnalysis = asyncHandler(async (req, res) => {
    const analysis = await formAnalysisService.getAnalysisById(req.params.id);
    return successResponse(res, analysis);
  });

  getAnalyses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort, userId, status } = req.query;
    const filters = {};

    if (userId) filters.userId = userId;
    if (status) filters.analysisStatus = status;

    const options = { page: parseInt(page), limit: parseInt(limit), sort };
    const { analyses, total } = await formAnalysisService.getAnalyses(filters, options);

    return paginatedResponse(res, analyses, parseInt(page), parseInt(limit), total);
  });

  addCoachFeedback = asyncHandler(async (req, res) => {
    const { feedback } = req.body;
    const analysis = await formAnalysisService.addCoachFeedback(
      req.params.id,
      req.user._id,
      feedback
    );
    return successResponse(res, analysis, 'Feedback added successfully');
  });

  getUserHistory = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const history = await formAnalysisService.getUserAnalysisHistory(req.user._id, parseInt(limit));
    return successResponse(res, history);
  });
}

module.exports = new FormAnalysisController();

