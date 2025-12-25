/**
 * Configuration Validator
 * Validates required environment variables on application boot
 * Fails fast if critical configuration is missing
 */

// Use console instead of logger to avoid circular dependency
// (logger depends on config, config depends on validator)
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data ? JSON.stringify(data) : ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg, data) => console.error(`[ERROR] ${msg}`, data ? JSON.stringify(data) : ''),
};

/**
 * Required environment variables by environment
 */
const REQUIRED_VARS = {
  // Always required regardless of environment
  all: [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ],

  // Required in production only
  production: [
    'REDIS_URL',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'EMAIL_PROVIDER',
    'CORS_ORIGIN',
  ],

  // Required in staging
  staging: [
    'REDIS_URL',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'EMAIL_PROVIDER',
  ],
};

/**
 * Conditional requirements based on feature flags
 */
const CONDITIONAL_VARS = {
  // If OpenAI features are enabled
  ENABLE_AI_FEATURES: ['OPENAI_API_KEY'],

  // If using S3 storage
  USE_S3_STORAGE: [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'AWS_REGION',
  ],

  // Email provider specific
  EMAIL_PROVIDER: {
    smtp: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'],
    sendgrid: ['SENDGRID_API_KEY'],
    ses: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
    mailgun: ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'],
  },

  // If SMS is enabled
  ENABLE_SMS_NOTIFICATIONS: [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
  ],

  // If push notifications are enabled
  ENABLE_PUSH_NOTIFICATIONS: [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
  ],
};

/**
 * Warnings for missing optional but recommended variables
 */
const RECOMMENDED_VARS = {
  all: ['LOG_LEVEL', 'ADMIN_EMAIL'],
  production: ['SENTRY_DSN'],
};

/**
 * Validate that a value is not empty
 */
function isValidValue(value) {
  return value !== undefined && value !== null && value !== '';
}

/**
 * Check if a boolean env var is enabled
 */
function isEnabled(varName) {
  const value = process.env[varName];
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Validate required environment variables
 */
function validateRequired() {
  const env = process.env.NODE_ENV || 'development';
  const missing = [];

  // Check always required vars
  REQUIRED_VARS.all.forEach((varName) => {
    if (!isValidValue(process.env[varName])) {
      missing.push(varName);
    }
  });

  // Check environment-specific vars
  if (REQUIRED_VARS[env]) {
    REQUIRED_VARS[env].forEach((varName) => {
      if (!isValidValue(process.env[varName])) {
        missing.push(varName);
      }
    });
  }

  return missing;
}

/**
 * Validate conditional requirements
 */
function validateConditional() {
  const missing = [];

  // Check boolean feature flags
  Object.entries(CONDITIONAL_VARS).forEach(([flag, requiredVars]) => {
    if (typeof requiredVars === 'object' && !Array.isArray(requiredVars)) {
      // Handle nested conditionals (like EMAIL_PROVIDER)
      const providerValue = process.env[flag];
      if (providerValue && requiredVars[providerValue]) {
        requiredVars[providerValue].forEach((varName) => {
          if (!isValidValue(process.env[varName])) {
            missing.push(`${varName} (required for ${flag}=${providerValue})`);
          }
        });
      }
    } else if (isEnabled(flag)) {
      // Handle simple boolean flags
      requiredVars.forEach((varName) => {
        if (!isValidValue(process.env[varName])) {
          missing.push(`${varName} (required when ${flag} is enabled)`);
        }
      });
    }
  });

  return missing;
}

/**
 * Check for recommended variables
 */
function checkRecommended() {
  const env = process.env.NODE_ENV || 'development';
  const missing = [];

  // Check always recommended vars
  RECOMMENDED_VARS.all.forEach((varName) => {
    if (!isValidValue(process.env[varName])) {
      missing.push(varName);
    }
  });

  // Check environment-specific recommended vars
  if (RECOMMENDED_VARS[env]) {
    RECOMMENDED_VARS[env].forEach((varName) => {
      if (!isValidValue(process.env[varName])) {
        missing.push(varName);
      }
    });
  }

  return missing;
}

/**
 * Validate security-critical configurations
 */
function validateSecurity() {
  const env = process.env.NODE_ENV || 'development';
  const warnings = [];

  // Check for default/weak secrets in production
  if (env === 'production' || env === 'staging') {
    const dangerousDefaults = {
      JWT_SECRET: ['default', 'secret', 'change'],
      JWT_REFRESH_SECRET: ['default', 'secret', 'change'],
      SESSION_SECRET: ['default', 'secret', 'change'],
    };

    Object.entries(dangerousDefaults).forEach(([varName, keywords]) => {
      const value = process.env[varName] || '';
      const lowerValue = value.toLowerCase();

      if (value.length < 32) {
        warnings.push(`${varName} is too short (minimum 32 characters recommended)`);
      }

      keywords.forEach((keyword) => {
        if (lowerValue.includes(keyword)) {
          warnings.push(`${varName} appears to use a default/weak value`);
        }
      });
    });

    // Check CORS configuration
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin === '*') {
      warnings.push('CORS_ORIGIN is set to wildcard (*) - this is a security risk in production');
    }
  }

  return warnings;
}

/**
 * Main validation function
 * @param {boolean} strict - If true, throw error on any missing required vars
 * @returns {object} Validation results
 */
function validateConfig(strict = true) {
  const env = process.env.NODE_ENV || 'development';

  logger.info('🔍 Validating configuration...', { environment: env });

  const missingRequired = validateRequired();
  const missingConditional = validateConditional();
  const missingRecommended = checkRecommended();
  const securityWarnings = validateSecurity();

  const allMissing = [...missingRequired, ...missingConditional];

  // Log results
  if (allMissing.length > 0) {
    logger.error('❌ Missing required environment variables:', allMissing);

    if (strict) {
      throw new Error(
        'Configuration validation failed. Missing required environment variables:\n'
        + `${allMissing.map((v) => `  - ${v}`).join('\n')}\n\n`
        + 'Please check your .env file against .env.template',
      );
    }
  }

  if (missingRecommended.length > 0) {
    logger.warn('⚠️  Missing recommended environment variables:', missingRecommended);
  }

  if (securityWarnings.length > 0) {
    logger.warn('🔒 Security warnings:', securityWarnings);

    if (env === 'production') {
      // In production, security warnings should be treated more seriously
      logger.error('Security issues detected in production environment!');
    }
  }

  if (allMissing.length === 0 && securityWarnings.length === 0) {
    logger.info('✅ Configuration validation passed');
  }

  return {
    valid: allMissing.length === 0,
    missingRequired,
    missingConditional,
    missingRecommended,
    securityWarnings,
  };
}

/**
 * Display configuration summary (without sensitive values)
 */
function logConfigSummary(config) {
  const env = process.env.NODE_ENV || 'development';

  logger.info('📋 Configuration Summary:', {
    environment: env,
    port: config.port,
    apiVersion: config.apiVersion,
    database: config.mongodb.uri.replace(/\/\/.*@/, '//***@'), // Hide credentials
    redis: config.redis?.url ? 'Configured' : 'Not configured',
    s3Storage: config.aws?.useS3 ? 'Enabled' : 'Disabled',
    emailProvider: config.email?.provider || 'smtp',
    aiFeatures: config.openai?.enabled ? 'Enabled' : 'Disabled',
    smsNotifications: config.sms?.enabled ? 'Enabled' : 'Disabled',
    pushNotifications: config.firebase?.enabled ? 'Enabled' : 'Disabled',
  });
}

module.exports = {
  validateConfig,
  logConfigSummary,
  isEnabled,
};
