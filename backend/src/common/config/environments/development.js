/**
 * Development Environment Configuration
 * Overrides and specific settings for local development
 */

module.exports = {
  env: 'development',

  // Relaxed CORS for local development
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
  },

  // More lenient rate limiting in dev
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Much higher limit for development
  },

  // Verbose logging for development
  logging: {
    level: 'debug',
    filePath: './logs',
    console: true,
  },

  // Local storage instead of S3
  aws: {
    useS3: false,
  },

  // Redis optional in development
  redis: {
    enabled: false,
  },

  // Email console logging instead of sending
  email: {
    provider: 'console', // Log emails to console instead of sending
    enabled: true,
  },

  // Disable external services in dev unless explicitly configured
  sms: {
    enabled: false,
  },

  firebase: {
    enabled: false,
  },

  // openai: {
  //   enabled: false, // Uncomment to disable AI features in development
  // },
  // Note: AI features controlled by ENABLE_AI_FEATURES in .env

  // Security settings (still use strong passwords!)
  security: {
    bcryptRounds: 10, // Slightly faster for development
  },

  // Monitoring disabled in dev
  monitoring: {
    sentryDsn: null,
  },
};
