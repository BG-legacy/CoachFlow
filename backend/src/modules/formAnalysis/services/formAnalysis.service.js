/**
 * Form Analysis Service
 * Orchestrates video upload and Python analysis
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const FormAnalysis = require('../models/formAnalysis.model');
const config = require('../../../common/config');
const logger = require('../../../common/utils/logger');
const { NotFoundError, InternalServerError } = require('../../../common/utils/errors');

class FormAnalysisService {
  async createAnalysis(userId, analysisData) {
    const analysis = await FormAnalysis.create({
      userId,
      ...analysisData,
      analysisStatus: 'pending',
    });

    logger.info(`Form analysis created: ${analysis._id}`);

    return analysis;
  }

  async uploadVideoAndAnalyze(userId, file, exerciseName) {
    // Create analysis record
    const analysis = await this.createAnalysis(userId, {
      exerciseName,
      videoUrl: file.path,
      videoFileName: file.filename,
    });

    // Trigger Python analysis in background
    this.processVideoAnalysis(analysis._id, file.path).catch((error) => {
      logger.error(`Error processing video analysis: ${error.message}`);
    });

    return analysis;
  }

  async processVideoAnalysis(analysisId, videoPath) {
    try {
      // Update status to processing
      await FormAnalysis.findByIdAndUpdate(analysisId, {
        analysisStatus: 'processing',
      });

      const startTime = Date.now();

      // Call Python analysis service
      const formData = new FormData();
      formData.append('video', fs.createReadStream(videoPath));
      formData.append('analysis_id', analysisId);

      const response = await axios.post(
        config.pythonAnalysis.serviceUrl,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${config.pythonAnalysis.apiKey}`,
          },
          timeout: 300000, // 5 minutes
        },
      );

      const processingTime = Date.now() - startTime;

      // Update analysis with results
      await FormAnalysis.findByIdAndUpdate(analysisId, {
        analysisStatus: 'completed',
        analysisResults: response.data.results,
        metadata: {
          ...response.data.metadata,
          processedAt: new Date(),
          processingTime,
        },
      });

      logger.info(`Video analysis completed for: ${analysisId}`);

      return response.data;
    } catch (error) {
      logger.error(`Video analysis failed for ${analysisId}:`, error);

      await FormAnalysis.findByIdAndUpdate(analysisId, {
        analysisStatus: 'failed',
      });

      throw new InternalServerError('Video analysis failed');
    }
  }

  async getAnalysisById(analysisId) {
    const analysis = await FormAnalysis.findById(analysisId)
      .populate('userId coachId', 'firstName lastName email');

    if (!analysis) {
      throw new NotFoundError('Form analysis');
    }

    return analysis;
  }

  async getAnalyses(filters, options) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const analyses = await FormAnalysis.find(filters)
      .populate('userId coachId', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await FormAnalysis.countDocuments(filters);

    return { analyses, total };
  }

  async addCoachFeedback(analysisId, coachId, feedback) {
    const analysis = await FormAnalysis.findById(analysisId);

    if (!analysis) {
      throw new NotFoundError('Form analysis');
    }

    const updatedAnalysis = await FormAnalysis.findByIdAndUpdate(
      analysisId,
      {
        coachId,
        coachFeedback: {
          text: feedback,
          addedAt: new Date(),
        },
        status: 'reviewed',
      },
      { new: true },
    ).populate('userId coachId', 'firstName lastName email');

    logger.info(`Coach feedback added to analysis: ${analysisId}`);

    return updatedAnalysis;
  }

  async getUserAnalysisHistory(userId, limit = 10) {
    return await FormAnalysis.find({ userId })
      .sort('-createdAt')
      .limit(limit)
      .select('exerciseName analysisResults.overallScore createdAt analysisStatus');
  }
}

module.exports = new FormAnalysisService();
