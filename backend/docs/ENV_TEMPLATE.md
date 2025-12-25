# Environment Variables Template for CoachFlow

This file contains all the environment variables needed for CoachFlow backend.

**To use this template:**
1. Copy the content below into a new file named `.env` in the backend directory
2. Replace placeholder values with your actual credentials
3. Never commit the `.env` file to version control

---

## Complete .env Template

```env
# ================================
# CoachFlow Backend Environment Configuration
# ================================
# Copy this to .env and fill in your values
# Never commit .env to version control!

# ================================
# Server Configuration
# ================================
NODE_ENV=development
PORT=5000
API_VERSION=v1

# ================================
# Database Configuration
# ================================
MONGODB_URI=mongodb://localhost:27017/coachflow
MONGODB_TEST_URI=mongodb://localhost:27017/coachflow_test

# ================================
# JWT Configuration (REQUIRED)
# ================================
# Generate secure secrets using: node scripts/generate-secrets.js
JWT_SECRET=your_jwt_secret_here_min_32_characters
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_characters
JWT_REFRESH_EXPIRE=30d

# ================================
# Google OAuth Configuration
# ================================
# Get credentials from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_google_client_secret

# Optional: Explicitly enable/disable Google auth
ENABLE_GOOGLE_AUTH=true

# ================================
# CORS Configuration
# ================================
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# ================================
# Redis Cache (Optional)
# ================================
# REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=
# REDIS_DB=0
# REDIS_TTL=3600

# ================================
# Rate Limiting
# ================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ================================
# Security Configuration
# ================================
SESSION_SECRET=your_session_secret_here
BCRYPT_ROUNDS=12

# ================================
# OpenAI / AI Features (Optional)
# ================================
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4
# OPENAI_MAX_TOKENS=2000
# OPENAI_TEMPERATURE=0.7
# ENABLE_AI_FEATURES=false

# ================================
# AWS / S3 Storage (Optional)
# ================================
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=coachflow-uploads
# AWS_S3_VIDEO_BUCKET=coachflow-videos
# USE_S3_STORAGE=false

# ================================
# Email Configuration (Optional)
# ================================
# EMAIL_PROVIDER=smtp
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password
# EMAIL_FROM=CoachFlow <noreply@coachflow.com>
# ENABLE_EMAIL_NOTIFICATIONS=false

# SendGrid (alternative)
# SENDGRID_API_KEY=

# Mailgun (alternative)
# MAILGUN_API_KEY=
# MAILGUN_DOMAIN=

# ================================
# SMS / Twilio (Optional)
# ================================
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE_NUMBER=
# ENABLE_SMS_NOTIFICATIONS=false

# ================================
# Push Notifications / Firebase (Optional)
# ================================
# FIREBASE_PROJECT_ID=
# FIREBASE_PRIVATE_KEY=
# FIREBASE_CLIENT_EMAIL=
# ENABLE_PUSH_NOTIFICATIONS=false

# ================================
# File Upload Configuration
# ================================
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads
VIDEO_UPLOAD_PATH=./uploads/videos
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,video/quicktime

# ================================
# Python Analysis Service (Optional)
# ================================
# PYTHON_ANALYSIS_SERVICE_URL=http://localhost:8000/analyze
# PYTHON_ANALYSIS_API_KEY=

# ================================
# Logging Configuration
# ================================
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# ================================
# Admin Configuration
# ================================
ADMIN_EMAIL=admin@coachflow.com
# ADMIN_DEFAULT_PASSWORD=

# ================================
# Cron Jobs
# ================================
WEEKLY_REPORT_CRON=0 0 * * 1

# ================================
# Monitoring (Optional)
# ================================
# SENTRY_DSN=
# NEW_RELIC_LICENSE_KEY=
# ANALYTICS_TRACKING_ID=

# ================================
# Feature Flags
# ================================
# ENABLE_AI_FEATURES=false
# ENABLE_EMAIL_NOTIFICATIONS=false
# ENABLE_SMS_NOTIFICATIONS=false
# ENABLE_PUSH_NOTIFICATIONS=false
# USE_S3_STORAGE=false
```

---

## Minimum Required Variables for Development

For a basic development setup, you only need these:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coachflow
JWT_SECRET=generate_a_secure_secret_here_min_32_chars
JWT_REFRESH_SECRET=generate_another_secure_secret_min_32_chars
SESSION_SECRET=generate_session_secret_here
```

---

## Required for Google OAuth

To enable Google authentication, add these:

```env
GOOGLE_CLIENT_ID=123456789-abc...xyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz...
ENABLE_GOOGLE_AUTH=true
```

Get your credentials from [Google Cloud Console](https://console.cloud.google.com/)

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit your `.env` file to Git
- Use different credentials for development, staging, and production
- Generate strong, random secrets (32+ characters)
- Store production secrets in a secure password manager
- Rotate secrets periodically (every 90 days recommended)

---

## Generating Secure Secrets

### Option 1: Using Node.js script
```bash
node scripts/generate-secrets.js
```

### Option 2: Using OpenSSL
```bash
openssl rand -base64 32
```

### Option 3: Using Node.js command
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Environment-Specific Configurations

### Development (.env)
```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
GOOGLE_CLIENT_ID=dev_client_id.apps.googleusercontent.com
LOG_LEVEL=debug
```

### Staging (.env)
```env
NODE_ENV=staging
CORS_ORIGIN=https://staging.yourdomain.com
GOOGLE_CLIENT_ID=staging_client_id.apps.googleusercontent.com
LOG_LEVEL=info
```

### Production (.env)
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
GOOGLE_CLIENT_ID=prod_client_id.apps.googleusercontent.com
LOG_LEVEL=warn
```

---

## Verification

After creating your `.env` file, verify it's being loaded correctly:

```bash
cd backend
node -e "require('dotenv').config(); console.log('✅ Environment loaded'); console.log('PORT:', process.env.PORT); console.log('Google Auth:', process.env.GOOGLE_CLIENT_ID ? 'Enabled ✅' : 'Disabled');"
```

Expected output:
```
✅ Environment loaded
PORT: 5000
Google Auth: Enabled ✅
```

---

## Troubleshooting

### "Missing required environment variables"
- Ensure `.env` file exists in the backend directory
- Check that all required variables are set
- Restart the server after changing .env

### "Google OAuth not working"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check that credentials match the environment (dev/staging/prod)
- Ensure `ENABLE_GOOGLE_AUTH=true` is set

### "JWT errors"
- Ensure `JWT_SECRET` is at least 32 characters
- Generate new secrets if using default values
- Don't use quotes around the secret values

---

## Related Documentation

- [GOOGLE_CLOUD_SETUP_GUIDE.md](./GOOGLE_CLOUD_SETUP_GUIDE.md) - Complete Google Cloud setup
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - Quick OAuth setup guide
- [CONFIGURATION.md](./CONFIGURATION.md) - Full configuration documentation
- [CONFIG_QUICKSTART.md](./CONFIG_QUICKSTART.md) - Quick configuration guide

