# Configuration Management

This document describes how configuration and environment variables are managed in the CoachFlow backend.

## Overview

The configuration system provides:

- ✅ **Environment-specific configs** for development, staging, and production
- ✅ **Environment variable validation** that fails fast on startup if critical vars are missing
- ✅ **Secure secret management** with no secrets committed to version control
- ✅ **Hierarchical configuration** with base configs and environment overrides
- ✅ **Type safety** with automatic parsing and type conversion

## Quick Start

### 1. Set Up Your Environment File

Copy the template to create your local environment file:

```bash
cp .env.template .env
```

### 2. Fill In Your Configuration

Edit `.env` and replace placeholder values with your actual configuration:

```bash
# Required for basic operation
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/coachflow
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

### 3. Start the Application

The application will automatically:
- Load your `.env` file
- Validate all required variables
- Apply environment-specific overrides
- Log a configuration summary
- Exit with an error if configuration is invalid

```bash
npm run dev
```

## Configuration Files

### Environment Files

| File | Purpose | Committed to Git? |
|------|---------|-------------------|
| `.env.template` | Template showing all available variables | ✅ Yes |
| `.env.development.example` | Example development config | ✅ Yes |
| `.env.staging.example` | Example staging config | ✅ Yes |
| `.env.production.example` | Example production config | ✅ Yes |
| `.env` | Your actual local config | ❌ No - gitignored |

### Configuration Code

```
src/common/config/
├── index.js                    # Main config module
├── config.validator.js         # Validation logic
├── loader.js                   # Environment-specific loader
└── environments/
    ├── development.js          # Development overrides
    ├── staging.js             # Staging overrides
    └── production.js          # Production overrides
```

## Environment Variables

### Required Variables (All Environments)

These variables must be set in all environments:

```bash
NODE_ENV=development|staging|production
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Production-Only Required Variables

These must be set in production and staging:

```bash
REDIS_URL=redis://...
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
EMAIL_PROVIDER=sendgrid|ses|mailgun
```

### Optional Feature Variables

These are required only when the feature is enabled:

#### OpenAI / AI Features
```bash
ENABLE_AI_FEATURES=true
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
```

#### S3 Storage
```bash
USE_S3_STORAGE=true
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_REGION=us-east-1
```

#### Email Notifications
```bash
ENABLE_EMAIL_NOTIFICATIONS=true
EMAIL_PROVIDER=smtp|sendgrid|ses|mailgun

# SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASSWORD=...

# SendGrid
SENDGRID_API_KEY=...

# Mailgun
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
```

#### SMS Notifications
```bash
ENABLE_SMS_NOTIFICATIONS=true
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

#### Push Notifications
```bash
ENABLE_PUSH_NOTIFICATIONS=true
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
```

## Configuration Validation

### Automatic Validation on Boot

The application validates configuration automatically when it starts:

```javascript
// In src/common/config/index.js
validateConfig(true);  // Fails fast if invalid
```

### Validation Rules

1. **Required Variables**: Must be present and non-empty
2. **Conditional Variables**: Required based on feature flags
3. **Security Checks**: Warns about weak/default secrets in production
4. **Type Validation**: Ensures numbers and booleans are properly formatted

### Example Validation Output

```
🔍 Validating configuration... { environment: 'development' }
📋 Configuration Summary: {
  environment: 'development',
  port: 5000,
  database: 'mongodb://***@localhost:27017/coachflow',
  redis: 'Not configured',
  s3Storage: 'Disabled',
  aiFeatures: 'Disabled'
}
✅ Configuration validation passed
```

### Handling Validation Errors

If validation fails, the application will exit with a detailed error message:

```
❌ CONFIGURATION ERROR:

Missing required environment variables:
  - MONGODB_URI
  - JWT_SECRET
  - OPENAI_API_KEY (required when ENABLE_AI_FEATURES is enabled)

Application cannot start with invalid configuration.
```

## Environment-Specific Configurations

### Development

- Relaxed CORS (allows localhost origins)
- Higher rate limits
- Verbose logging (debug level)
- Local storage instead of S3
- Email console logging instead of sending
- External services disabled by default

### Staging

- Specific CORS for staging domain
- Production-like settings with slightly relaxed limits
- Detailed logging for debugging
- Real S3, Redis, and external services
- All features enabled for testing

### Production

- Strict CORS (specific domains only)
- Conservative rate limits
- Info-level logging only
- All external services required and enabled
- Maximum security settings
- Full monitoring enabled

## Security Best Practices

### Generating Strong Secrets

Use cryptographically secure random strings for all secrets:

```bash
# Generate a 64-character secret
openssl rand -base64 64

# Use for:
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
SESSION_SECRET=<generated-secret>
```

### Never Commit Secrets

- ❌ Never commit `.env` files
- ❌ Never commit files with real API keys
- ❌ Never use default secrets in production
- ✅ Use `.env.template` with placeholder values
- ✅ Use environment variables in CI/CD
- ✅ Use secret management services (AWS Secrets Manager, etc.)

### Production Security Checklist

Before deploying to production:

- [ ] All secrets are unique and strong (min 32 chars)
- [ ] No default/placeholder values in production
- [ ] CORS is restricted to specific domains
- [ ] Rate limiting is configured appropriately
- [ ] Monitoring (Sentry) is configured
- [ ] Environment variables are set in hosting platform
- [ ] `.env` files are never committed
- [ ] S3 buckets have proper access controls
- [ ] Database connection strings use authentication

## Usage in Code

### Accessing Configuration

```javascript
const config = require('./common/config');

// Server config
console.log(config.port);
console.log(config.env);

// Database
const dbUri = config.mongodb.uri;

// Feature flags
if (config.openai.enabled) {
  // Use OpenAI features
}

if (config.aws.useS3) {
  // Upload to S3
} else {
  // Use local storage
}
```

### Adding New Configuration

1. **Add to `.env.template`** with documentation:
   ```bash
   # ============================================
   # NEW FEATURE
   # ============================================
   NEW_FEATURE_API_KEY=your-api-key-here
   NEW_FEATURE_ENABLED=true
   ```

2. **Add to `config/index.js`**:
   ```javascript
   newFeature: {
     apiKey: process.env.NEW_FEATURE_API_KEY,
     enabled: isEnabled('NEW_FEATURE_ENABLED'),
   }
   ```

3. **Add validation** in `config.validator.js` if required:
   ```javascript
   CONDITIONAL_VARS: {
     NEW_FEATURE_ENABLED: ['NEW_FEATURE_API_KEY'],
   }
   ```

4. **Add to environment examples** (`.env.development.example`, etc.)

## Deployment

### Development

```bash
# Use local .env file
npm run dev
```

### Staging/Production

#### Option 1: Environment Variables (Recommended)

Set environment variables directly in your hosting platform:

- Heroku: `heroku config:set VAR_NAME=value`
- AWS: Use Parameter Store or Secrets Manager
- Docker: Use `-e` flag or `docker-compose.yml`
- Kubernetes: Use ConfigMaps and Secrets

#### Option 2: Environment Files

For VPS deployments, create environment-specific files:

```bash
# On server
cp .env.production.example .env
nano .env  # Edit with actual values
```

**Security**: Ensure proper file permissions:
```bash
chmod 600 .env  # Read/write for owner only
```

## Troubleshooting

### Application Won't Start

Check the error message for missing variables:

```
❌ Missing required environment variables:
  - JWT_SECRET
```

Solution: Add the missing variable to your `.env` file.

### "Default Secret" Warning

```
🔒 Security warnings:
  - JWT_SECRET appears to use a default/weak value
```

Solution: Generate a strong secret using `openssl rand -base64 64`.

### Feature Not Working

Check if the feature is enabled:

```javascript
console.log(config.openai.enabled);  // Should be true
```

Ensure:
1. Feature flag is set: `ENABLE_AI_FEATURES=true`
2. Required credentials are provided: `OPENAI_API_KEY=sk-...`

### Configuration Not Loading

1. Verify `.env` file exists in backend root
2. Check file permissions (should be readable)
3. Look for syntax errors in `.env` file
4. Check `NODE_ENV` is set correctly

## Additional Resources

- [dotenv documentation](https://github.com/motdotla/dotenv)
- [12-Factor App Configuration](https://12factor.net/config)
- [OWASP Configuration Management](https://owasp.org/www-community/vulnerabilities/Configuration)

## Support

If you encounter configuration issues:

1. Check this documentation
2. Review error messages carefully
3. Verify against `.env.template`
4. Check the configuration summary in logs
5. Contact the development team

