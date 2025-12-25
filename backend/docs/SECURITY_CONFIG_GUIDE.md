# Security Configuration Guide

This guide helps you configure the security features in your `.env` file.

## Required Environment Variables

### CORS Configuration

```bash
# Comma-separated list of allowed origins
# Production example:
ALLOWED_ORIGINS=https://app.coachflow.com,https://admin.coachflow.com,https://mobile.coachflow.com

# Wildcard support for subdomains:
ALLOWED_ORIGINS=https://app.coachflow.com,https://*.staging.coachflow.com

# Development (already handled by code, but you can override):
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
```

### Rate Limiting

```bash
# Global API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100         # Max requests per window

# These are applied globally to /api/* routes
# Specific endpoint limiters are configured in code
```

#### Rate Limit Tiers (Configured in Code)

The following rate limits are environment-aware and automatically adjust:

| Endpoint | Production | Development | Window |
|----------|-----------|-------------|---------|
| Global API | 100 | 1000 | 15 min |
| Login | 3 | 10 | 15 min |
| Registration | 3 | 10 | 1 hour |
| Password Reset | 3 | 10 | 1 hour |
| Auth (refresh/change) | 5 | 20 | 15 min |
| AI Analysis | 10 | 50 | 1 hour |
| File Upload | 20 | 100 | 1 hour |

### File Upload Configuration

```bash
# Maximum file size in bytes (50MB default)
MAX_FILE_SIZE=52428800

# Upload directories
UPLOAD_PATH=./uploads
VIDEO_UPLOAD_PATH=./uploads/videos

# Allowed file types (comma-separated MIME types)
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime
```

### Security Settings

```bash
# Bcrypt rounds (higher = more secure but slower)
# Recommended: 12-14 for production
BCRYPT_ROUNDS=12

# Session secret (generate a strong random string)
SESSION_SECRET=your-secure-random-session-secret-change-this
```

### JWT Configuration

```bash
# JWT Access Token
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# JWT Refresh Token
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-too
JWT_REFRESH_EXPIRE=30d
```

## Security Checklist

### ✅ Before Deployment

- [ ] Generate strong random secrets for JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Set SESSION_SECRET to a strong random string
- [ ] Configure ALLOWED_ORIGINS with your actual domains
- [ ] Set appropriate rate limits for your traffic
- [ ] Configure file upload limits based on your needs
- [ ] Set BCRYPT_ROUNDS to at least 12
- [ ] Enable HTTPS in production (required for HSTS)
- [ ] Review and test all security settings

### 🔐 Generating Secure Secrets

You can generate secure random secrets using Node.js:

```bash
# Generate JWT secrets (run in terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use the provided script
npm run secrets:generate
```

### 🌍 Environment-Specific Configuration

#### Development
```bash
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
RATE_LIMIT_MAX_REQUESTS=1000
BCRYPT_ROUNDS=10
```

#### Staging
```bash
NODE_ENV=staging
ALLOWED_ORIGINS=https://staging.coachflow.com,https://admin.staging.coachflow.com
RATE_LIMIT_MAX_REQUESTS=200
BCRYPT_ROUNDS=12
```

#### Production
```bash
NODE_ENV=production
ALLOWED_ORIGINS=https://app.coachflow.com,https://admin.coachflow.com
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
```

## Advanced Configuration

### Custom Rate Limits

To adjust rate limits for specific endpoints, edit:
- `src/common/middleware/rateLimiter.js`

Example:
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.env === 'production' ? 5 : 15, // Increased from 3 to 5
  // ... rest of config
});
```

### Custom File Types

To allow additional file types, add them to `ALLOWED_FILE_TYPES`:

```bash
# Example: Adding PDF support
ALLOWED_FILE_TYPES=image/jpeg,image/png,video/mp4,application/pdf
```

Also update the whitelist in `src/common/middleware/fileUpload.js`:
```javascript
const ALLOWED_MIME_TYPES = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  // ...
};

const ALLOWED_EXTENSIONS = {
  documents: ['.pdf', '.doc', '.docx'],
  // ...
};
```

### Security Headers Customization

To customize security headers, edit:
- `src/common/middleware/securityHeaders.js`

Example - Relaxing CSP for specific domains:
```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: ["'self'", 'https://api.openai.com'], // Add external API
    // ...
  },
}
```

## Testing Your Configuration

### 1. Test CORS
```bash
# Should succeed if origin is allowed
curl -H "Origin: https://app.coachflow.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:5000/api/v1/auth/login

# Should fail if origin is not allowed
curl -H "Origin: https://malicious.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:5000/api/v1/auth/login
```

### 2. Test Rate Limiting
```bash
# Bash script to test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done

# Should see 429 (Too Many Requests) after limit is reached
```

### 3. Test Input Sanitization
```bash
# Should block NoSQL injection
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":"test"}'
# Expected: 400 Bad Request

# Should block XSS
curl -X POST http://localhost:5000/api/v1/workouts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"<script>alert(1)</script>","description":"test"}'
# Expected: Script tags removed from response
```

### 4. Test File Upload Validation
```bash
# Should block dangerous file
echo '<?php system($_GET["cmd"]); ?>' > malicious.php
curl -X POST http://localhost:5000/api/v1/form-analysis/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@malicious.php"
# Expected: 400 Bad Request - File type not allowed
```

### 5. Test Security Headers
```bash
# Check security headers
curl -I http://localhost:5000/api/v1/auth/login

# Should see headers like:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## Monitoring and Maintenance

### Audit Logs

Audit logs are stored in MongoDB in the `auditevents` collection.

Query examples:
```javascript
// Failed login attempts in last 24 hours
db.auditevents.find({
  eventType: 'LOGIN_FAILURE',
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
}).sort({ timestamp: -1 })

// Admin actions
db.auditevents.find({
  eventType: { $regex: /^ADMIN_/ }
}).sort({ timestamp: -1 })

// Suspicious activity
db.auditevents.find({
  eventType: { $in: ['INJECTION_ATTEMPT', 'SUSPICIOUS_ACTIVITY'] }
}).sort({ timestamp: -1 })
```

### Regular Maintenance

1. **Weekly**
   - Review audit logs for suspicious activity
   - Check rate limit violations
   - Monitor failed login attempts

2. **Monthly**
   - Review and adjust rate limits based on traffic
   - Update allowed origins if needed
   - Check for security updates

3. **Quarterly**
   - Rotate JWT secrets
   - Security audit of logs
   - Update security documentation

## Troubleshooting

### CORS Issues
**Problem**: Frontend can't connect to API  
**Solution**: Ensure frontend origin is in `ALLOWED_ORIGINS`

### Rate Limiting Too Strict
**Problem**: Legitimate users getting blocked  
**Solution**: Increase `RATE_LIMIT_MAX_REQUESTS` or adjust specific limiters

### File Uploads Rejected
**Problem**: Valid files being rejected  
**Solution**: Check `ALLOWED_FILE_TYPES` and file size limits

### Slow Password Hashing
**Problem**: Registration/login taking too long  
**Solution**: Reduce `BCRYPT_ROUNDS` (but not below 10)

## Security Best Practices

1. **Never commit `.env` file** - It contains secrets
2. **Use different secrets per environment** - Dev, staging, and production should have unique secrets
3. **Rotate secrets regularly** - Especially after team changes
4. **Monitor audit logs** - Set up alerts for suspicious activity
5. **Keep dependencies updated** - Run `npm audit` regularly
6. **Use HTTPS in production** - Required for secure headers to work properly
7. **Implement rate limiting at load balancer** - For DDoS protection
8. **Regular security reviews** - Review configuration quarterly

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [API_SECURITY.md](./API_SECURITY.md) - Detailed implementation guide

## Support

For security issues:
1. Review this guide and `API_SECURITY.md`
2. Check the troubleshooting section
3. Review the implementation in source code
4. For security vulnerabilities, report privately to the development team

