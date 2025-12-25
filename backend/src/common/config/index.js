/**
 * Configuration Module
 * Centralizes all environment variables and app configuration
 * Validates configuration on boot and fails fast if critical vars are missing
 */

require('dotenv').config();
const { validateConfig, logConfigSummary, isEnabled } = require('./config.validator');
const { applyEnvironmentOverrides } = require('./loader');

const baseConfig = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5001,
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coachflow',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/coachflow_test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Redis Cache
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    ttl: parseInt(process.env.REDIS_TTL, 10) || 3600,
    enabled: !!process.env.REDIS_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
  },

  // Authentication Providers
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'],
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // OpenAI / AI Features
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 2000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    enabled: isEnabled('ENABLE_AI_FEATURES') && !!process.env.OPENAI_API_KEY,
  },

  // AWS / S3 Storage
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
    s3VideoBucket: process.env.AWS_S3_VIDEO_BUCKET,
    useS3: isEnabled('USE_S3_STORAGE'),
  },

  // Email
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: isEnabled('EMAIL_SECURE'),
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'CoachFlow <noreply@coachflow.com>',
    // Provider-specific configs
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
    },
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
    },
    enabled: isEnabled('ENABLE_EMAIL_NOTIFICATIONS'),
  },

  // SMS (Twilio)
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    enabled: isEnabled('ENABLE_SMS_NOTIFICATIONS') && !!process.env.TWILIO_ACCOUNT_SID,
  },

  // Push Notifications (Firebase)
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    enabled: isEnabled('ENABLE_PUSH_NOTIFICATIONS') && !!process.env.FIREBASE_PROJECT_ID,
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 50 * 1024 * 1024,
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    videoUploadPath: process.env.VIDEO_UPLOAD_PATH || './uploads/videos',
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES
      ? process.env.ALLOWED_FILE_TYPES.split(',')
      : ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'],
  },

  // Python Analysis Service
  pythonAnalysis: {
    serviceUrl: process.env.PYTHON_ANALYSIS_SERVICE_URL || 'http://localhost:8000/analyze',
    apiKey: process.env.PYTHON_ANALYSIS_API_KEY,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'default_session_secret',
  },

  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@coachflow.com',
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD,
  },

  // Cron Jobs
  cron: {
    weeklyReportSchedule: process.env.WEEKLY_REPORT_CRON || '0 0 * * 1',
  },

  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    newRelicKey: process.env.NEW_RELIC_LICENSE_KEY,
    analyticsId: process.env.ANALYTICS_TRACKING_ID,
  },
};

// Apply environment-specific overrides
const config = applyEnvironmentOverrides(baseConfig);

// Validate configuration on load (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  try {
    validateConfig(true);
    logConfigSummary(config);
  } catch (error) {
    // Configuration validation failed - log and exit
    console.error('\n❌ CONFIGURATION ERROR:\n');
    console.error(error.message);
    console.error('\nApplication cannot start with invalid configuration.');
    process.exit(1);
  }
}

module.exports = config;
