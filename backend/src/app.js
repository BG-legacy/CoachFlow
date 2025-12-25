/**
 * Express Application Setup
 * Main application configuration and middleware
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const config = require('./common/config');
const logger = require('./common/utils/logger');
const { errorHandler, notFoundHandler } = require('./common/middleware/errorHandler');
const requestIdMiddleware = require('./common/middleware/requestId');
const { swaggerUi, swaggerSpec, swaggerUiOptions } = require('./common/config/swagger');
const { globalLimiter } = require('./common/middleware/rateLimiter');
const { sanitizeInputs } = require('./common/middleware/sanitization');
const { applySecurityHeaders, customSecurityHeaders, getCorsOptions } = require('./common/middleware/securityHeaders');
const { handleUploadErrors } = require('./common/middleware/fileUpload');
const { preventParameterPollution } = require('./common/middleware/validation');

// Import routes
const authRoutes = require('./modules/auth/routes/auth.routes');
const clientRoutes = require('./modules/clients/routes/clientProfile.routes');
const workoutRoutes = require('./modules/workouts/routes/workout.routes');
const nutritionRoutes = require('./modules/nutrition/routes/nutrition.routes');
const checkinRoutes = require('./modules/checkins/routes/checkin.routes');
const sessionRoutes = require('./modules/sessions/routes/session.routes');
const gamificationRoutes = require('./modules/gamification/routes/gamification.routes');
const reportRoutes = require('./modules/reports/routes/report.routes');
const formAnalysisRoutes = require('./modules/formAnalysis/routes/formAnalysis.routes');
const adminRoutes = require('./modules/admin/routes/admin.routes');
const aiProgramRoutes = require('./modules/ai-programs/routes/programGenerator.routes');
const aiTemplateRoutes = require('./modules/ai-programs/routes/programTemplate.routes');

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxies)
app.set('trust proxy', 1);

// Request ID middleware (must be early in the chain)
app.use(requestIdMiddleware);

// Security headers with helmet
app.use(applySecurityHeaders());
app.use(customSecurityHeaders);

// CORS configuration with enhanced security
app.use(cors(getCorsOptions()));

// Prevent parameter pollution
app.use(preventParameterPollution(['sort', 'filter']));

// Compression middleware
app.use(compression());

// Body parsing middleware with limits
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization (must be after body parsing)
app.use(sanitizeInputs);

// HTTP request logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Global rate limiting for all API routes
app.use('/api/', globalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    requestId: req.id,
    data: {
      status: 'healthy',
      environment: config.env,
      version: config.apiVersion,
      timestamp: new Date().toISOString(),
    },
    error: null,
    meta: {
      message: 'Server is healthy',
    },
  });
});

// API Documentation
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
const API_PREFIX = `/api/${config.apiVersion}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/clients`, clientRoutes);
app.use(`${API_PREFIX}/workouts`, workoutRoutes);
app.use(`${API_PREFIX}/nutrition`, nutritionRoutes);
app.use(`${API_PREFIX}/checkins`, checkinRoutes);
app.use(`${API_PREFIX}/sessions`, sessionRoutes);
app.use(`${API_PREFIX}/gamification`, gamificationRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/form-analysis`, formAnalysisRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/ai-programs`, aiProgramRoutes);
app.use(`${API_PREFIX}/ai-programs/templates`, aiTemplateRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    requestId: req.id,
    data: {
      name: 'CoachFlow API',
      version: config.apiVersion,
      documentation: '/api/docs',
      apiPrefix: `/api/${config.apiVersion}`,
    },
    error: null,
    meta: {
      message: 'Welcome to CoachFlow API',
      timestamp: new Date().toISOString(),
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// File upload error handler
app.use(handleUploadErrors);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
