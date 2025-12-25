# Configuration Quick Start Guide

Get up and running with CoachFlow backend configuration in 5 minutes.

## 🚀 Quick Setup (3 Steps)

### Step 1: Initialize Your Environment File

```bash
npm run config:init
```

This creates `.env` from the template.

### Step 2: Generate Secure Secrets

```bash
npm run secrets:generate
```

Copy the generated secrets into your `.env` file.

### Step 3: Configure Required Services

Edit `.env` and set at minimum:

```bash
# Database (required)
MONGODB_URI=mongodb://localhost:27017/coachflow

# Secrets (generated in step 2)
JWT_SECRET=<paste-generated-secret>
JWT_REFRESH_SECRET=<paste-generated-secret>
SESSION_SECRET=<paste-generated-secret>
```

### Step 4: Validate & Start

```bash
# Validate configuration
npm run config:validate

# Start development server
npm run dev
```

## ✅ What You Get

- **Automatic validation** - App won't start with missing config
- **Environment-specific settings** - Different configs for dev/staging/prod
- **Secure by default** - No secrets in version control
- **Feature flags** - Enable/disable features easily
- **Fail-fast** - Clear error messages for misconfiguration

## 🔧 Common Configurations

### Development (Minimal)

```bash
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/coachflow
JWT_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
SESSION_SECRET=<generated>
```

This is enough to run the app locally!

### Enable AI Features

```bash
ENABLE_AI_FEATURES=true
OPENAI_API_KEY=sk-your-key-here
```

### Enable S3 Storage

```bash
USE_S3_STORAGE=true
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1
```

### Enable Email Notifications

```bash
ENABLE_EMAIL_NOTIFICATIONS=true
EMAIL_PROVIDER=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 🐛 Troubleshooting

### "Missing required environment variables"

**Problem**: App won't start, shows missing variables.

**Solution**: Check the error message and add the missing variables to `.env`.

### "Default secret detected"

**Problem**: Warning about using default/weak secrets.

**Solution**: Run `npm run secrets:generate` and use the generated values.

### Configuration not loading

**Problem**: Changes to `.env` not taking effect.

**Solution**: Restart the server. The `.env` file is only loaded at startup.

## 📚 Next Steps

- Read [CONFIGURATION.md](./CONFIGURATION.md) for detailed documentation
- See [.env.template](./.env.template) for all available options
- Check environment examples: `.env.development.example`, `.env.staging.example`, `.env.production.example`

## 🔒 Security Checklist

Before going to production:

- [ ] Run `npm run secrets:generate` for production secrets
- [ ] Use unique secrets for each environment
- [ ] Never commit `.env` files
- [ ] Set `USE_S3_STORAGE=true`
- [ ] Configure `REDIS_URL`
- [ ] Set specific `CORS_ORIGIN` (not `*`)
- [ ] Enable monitoring (`SENTRY_DSN`)
- [ ] Use strong `ADMIN_DEFAULT_PASSWORD`

## 🆘 Need Help?

1. Check error messages - they're designed to be helpful
2. Run `npm run config:validate` to test your config
3. Review [CONFIGURATION.md](./CONFIGURATION.md) for details
4. Check [.env.template](./.env.template) for examples

