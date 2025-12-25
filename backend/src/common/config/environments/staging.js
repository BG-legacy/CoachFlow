/**
 * Staging Environment Configuration
 * Settings for staging/QA environment - similar to production but with some relaxed constraints
 */

module.exports = {
  env: 'staging',

  // Specific CORS for staging domain
  cors: {
    origin: [
      'https://staging.coachflow.com',
      'https://staging-admin.coachflow.com',
    ],
    credentials: true,
  },

  // Production-like rate limiting but slightly more lenient
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Slightly higher than production
  },

  // Detailed logging for staging
  logging: {
    level: 'debug',
    filePath: './logs',
    console: true,
  },

  // Use S3 for staging
  aws: {
    useS3: true,
    s3Bucket: 'coachflow-staging-uploads',
    s3VideoBucket: 'coachflow-staging-videos',
  },

  // Redis required in staging
  redis: {
    enabled: true,
  },

  // Real email but with staging templates
  email: {
    enabled: true,
    from: 'CoachFlow Staging <noreply-staging@coachflow.com>',
  },

  // SMS can be enabled for testing
  sms: {
    enabled: true,
  },

  // Push notifications for testing
  firebase: {
    enabled: true,
  },

  // OpenAI enabled for testing
  openai: {
    enabled: true,
  },

  // Production-level security
  security: {
    bcryptRounds: 12,
  },

  // Monitoring enabled
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
  },
};
