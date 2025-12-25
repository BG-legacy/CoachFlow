/**
 * Production Environment Configuration
 * Strict settings for production environment - all security and monitoring enabled
 */

module.exports = {
  env: 'production',

  // Strict CORS for production
  cors: {
    origin: [
      'https://coachflow.com',
      'https://www.coachflow.com',
      'https://app.coachflow.com',
      'https://admin.coachflow.com',
    ],
    credentials: true,
  },

  // Strict rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Conservative limit
  },

  // Production logging - info level only
  logging: {
    level: 'info',
    filePath: './logs',
    console: false, // Don't log to console in production, use log files
  },

  // S3 required in production
  aws: {
    useS3: true,
  },

  // Redis required in production
  redis: {
    enabled: true,
  },

  // Production email settings
  email: {
    enabled: true,
    from: 'CoachFlow <noreply@coachflow.com>',
  },

  // SMS enabled
  sms: {
    enabled: true,
  },

  // Push notifications enabled
  firebase: {
    enabled: true,
  },

  // OpenAI enabled
  openai: {
    enabled: true,
  },

  // Maximum security settings
  security: {
    bcryptRounds: 12,
  },

  // Full monitoring enabled
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    newRelicKey: process.env.NEW_RELIC_LICENSE_KEY,
    analyticsId: process.env.ANALYTICS_TRACKING_ID,
  },

  // Production-specific features
  features: {
    // Enable response compression
    compression: true,
    // Enable request logging
    requestLogging: true,
    // Enable performance monitoring
    performanceMonitoring: true,
  },
};
