# API Security Implementation

## Overview

This document describes the comprehensive API security hardening implemented in the CoachFlow backend.

## Security Features Implemented

### 1. Rate Limiting

Multiple rate limiters protect different endpoint categories:

#### Global Rate Limiter
- **Window**: 15 minutes
- **Max Requests**: 100 (dev: 1000)
- **Applies to**: All `/api/` routes
- **Purpose**: Prevent API abuse

#### Authentication Rate Limiters

**Login Limiter**
- **Window**: 15 minutes
- **Max Requests**: 3 (dev: 10)
- **Applies to**: `/api/v1/auth/login`
- **Special**: Skips counting successful logins
- **Purpose**: Prevent brute force attacks

**Auth Limiter**
- **Window**: 15 minutes
- **Max Requests**: 5 (dev: 20)
- **Applies to**: Token refresh, password change
- **Purpose**: Prevent authentication abuse

**Registration Limiter**
- **Window**: 1 hour
- **Max Requests**: 3 (dev: 10)
- **Applies to**: `/api/v1/auth/register`
- **Purpose**: Prevent registration spam

**Password Reset Limiter**
- **Window**: 1 hour
- **Max Requests**: 3 (dev: 10)
- **Applies to**: Password reset requests
- **Purpose**: Prevent reset abuse

#### AI/Analysis Rate Limiter
- **Window**: 1 hour
- **Max Requests**: 10 (dev: 50)
- **Applies to**: Form analysis, AI-powered endpoints
- **Purpose**: Control computational costs

#### Upload Rate Limiter
- **Window**: 1 hour
- **Max Requests**: 20 (dev: 100)
- **Applies to**: File upload endpoints
- **Purpose**: Prevent storage abuse

### 2. Request Validation

Comprehensive validation on all endpoints:

#### Body Validation
- Required fields checking
- Type validation
- Format validation (email, phone, etc.)
- Length constraints
- Custom business rule validation

#### Query Parameter Validation
- Pagination validation (page, limit)
- Sort field validation
- Date range validation
- Search query sanitization

#### URL Parameter Validation
- MongoDB ObjectId validation
- Resource existence checking
- Permission validation

#### Middleware Functions
```javascript
// Available validation middleware
validate(schema)              // Joi schema validation
requireBody()                 // Ensure body exists
requireFields([...])          // Check specific fields
validatePagination()          // Validate page/limit
validateSort(allowedFields)   // Validate sort params
validateObjectId('paramName') // Validate MongoDB IDs
validateDateRange()           // Validate date queries
validateSearch()              // Sanitize search terms
validateContentType()         // Check Content-Type header
preventParameterPollution()   // Prevent duplicate params
```

### 3. CORS Configuration

Enhanced CORS security with origin validation:

#### Features
- **Origin Whitelist**: Only allowed origins can access the API
- **Wildcard Support**: Pattern matching for subdomains
- **Credentials**: Supports cookies/auth headers
- **Dev Mode**: Relaxed for localhost in development
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Exposed Headers**: Request ID, rate limit info

#### Configuration
```javascript
// In config or .env
ALLOWED_ORIGINS=https://app.coachflow.com,https://*.coachflow.com
```

### 4. Security Headers (Helmet)

Production-grade security headers:

#### Implemented Headers
- **Content-Security-Policy**: Restricts resource loading
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: 1 year with preload
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restrictive permissions

#### Custom Headers
- Cache control for sensitive endpoints
- API version header
- Rate limit headers
- Removed: X-Powered-By, Server

### 5. Input Sanitization

Multi-layer protection against injection attacks:

#### XSS Protection
- Removes `<script>` tags
- Filters `<iframe>` tags
- Removes `javascript:` URLs
- Strips inline event handlers
- Blocks `<embed>` and `<object>` tags

#### NoSQL Injection Protection
- Detects MongoDB operators ($where, $ne, $gt, etc.)
- Blocks object keys starting with `$`
- Validates query patterns
- Recursive object sanitization

#### SQL Injection Protection
- Detects SQL keywords (SELECT, INSERT, UPDATE, etc.)
- Blocks SQL comments (-- , /* */)
- Filters SQL operators

#### Features
- **Automatic**: Applied to all requests
- **Recursive**: Sanitizes nested objects
- **Depth Limited**: Prevents deep recursion attacks
- **Logging**: Records injection attempts

### 6. File Upload Validation

Secure file upload with multiple validation layers:

#### Type Validation
- **MIME Type Check**: Validates against whitelist
- **Extension Check**: Verifies file extension
- **Double Extension**: Blocks .php.jpg patterns
- **Dangerous Extensions**: Blocks .exe, .sh, .php, etc.

#### Size Validation
- **Default Max**: 50MB
- **Configurable**: Per upload type
- **Category-Specific**: Different limits for videos/images

#### Content Scanning
- **Pattern Detection**: Scans for malicious code
- **Header Analysis**: Checks first 1KB for threats
- **PHP/Script Detection**: Blocks embedded code

#### Categories
```javascript
// Available categories
'images'     // JPEG, PNG, GIF, WebP
'videos'     // MP4, MOV, AVI, MPEG
'documents'  // PDF, DOC, DOCX
'all'        // All allowed types
```

#### Usage
```javascript
// Pre-configured middleware
uploadSingleImage.single('image')
uploadMultipleImages.array('images', 10)
uploadSingleVideo.single('video')
uploadDocument.single('document')

// Custom configuration
createUploadMiddleware({
  maxFiles: 5,
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedCategory: 'images',
  useMemory: true, // For content scanning
})
```

### 7. Audit Logging

Comprehensive audit trail for sensitive actions:

#### Logged Events

**Authentication**
- Login success/failure
- Logout
- Token refresh
- Registration attempts

**Password Management**
- Password changes
- Reset requests
- Reset completions

**Account Management**
- Account updates
- Account deletion
- Account suspension/activation

**Plan Management**
- Plan creation
- Plan updates
- Plan deletion
- Plan assignment

**Admin Actions**
- User creation/updates/deletion
- Role changes
- Permission changes
- Settings updates

**Security Events**
- Suspicious activity
- Rate limit exceeded
- Unauthorized access attempts
- Injection attempts

#### Stored Information
- Event type
- User ID
- Target user ID (for admin actions)
- Action description
- Resource type and ID
- IP address
- User agent
- Request ID
- Success/failure status
- Error message (if failed)
- Additional details (JSON)
- Timestamp

#### Database Schema
```javascript
// Indexed fields for fast querying
- eventType + timestamp
- userId + timestamp
- success + timestamp
- ipAddress
- requestId
```

#### Helper Functions
```javascript
// Available audit helpers
auditHelpers.loginSuccess(req, userId)
auditHelpers.loginFailure(req, email, reason)
auditHelpers.logout(req, userId)
auditHelpers.passwordChange(req, userId)
auditHelpers.passwordResetRequest(req, email)
auditHelpers.planCreated(req, planId, details)
auditHelpers.planUpdated(req, planId, details)
auditHelpers.planDeleted(req, planId)
auditHelpers.adminUserUpdate(req, targetUserId, changes)
auditHelpers.adminRoleChange(req, targetUserId, oldRole, newRole)
auditHelpers.suspiciousActivity(req, reason, details)
auditHelpers.injectionAttempt(req, attackType, details)
```

## Implementation Examples

### Adding Rate Limiting to a Route
```javascript
const { aiLimiter, uploadLimiter } = require('../../../common/middleware/rateLimiter');

// Single rate limiter
router.post('/analyze', aiLimiter, controller.analyze);

// Multiple rate limiters
router.post('/upload', uploadLimiter, aiLimiter, controller.upload);
```

### Adding Request Validation
```javascript
const { validate, validatePagination, validateObjectId } = require('../../../common/middleware/validation');
const Joi = require('joi');

const schema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
});

router.post('/users', validate(schema), controller.createUser);
router.get('/users', validatePagination, controller.getUsers);
router.get('/users/:id', validateObjectId('id'), controller.getUser);
```

### Adding File Upload with Validation
```javascript
const { uploadSingleImage, validateUploadedFiles } = require('../../../common/middleware/fileUpload');

router.post(
  '/profile/avatar',
  uploadSingleImage.single('avatar'),
  validateUploadedFiles({ 
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedCategory: 'images',
    scanContent: true 
  }),
  controller.updateAvatar
);
```

### Adding Audit Logging
```javascript
const { auditHelpers } = require('../../../common/utils/auditLogger');

// In controller
createResource = async (req, res) => {
  const resource = await service.createResource(req.body);
  
  // Log the action
  await auditHelpers.planCreated(req, resource._id, {
    name: resource.name,
    type: resource.type,
  });
  
  return successResponse(res, resource);
};
```

## Security Best Practices

### 1. Always Validate Input
- Use validation middleware on all endpoints
- Don't trust client data
- Validate types, formats, and ranges
- Use allow-lists, not deny-lists

### 2. Implement Defense in Depth
- Multiple layers of security
- Rate limiting + validation + sanitization
- MIME type + extension + content checks

### 3. Log Security Events
- Track all authentication attempts
- Monitor for patterns
- Alert on suspicious activity
- Maintain audit trail for compliance

### 4. Keep Secrets Secure
- Use environment variables
- Never commit secrets
- Rotate credentials regularly
- Use strong random values

### 5. Monitor and Respond
- Review audit logs regularly
- Set up alerts for security events
- Have incident response plan
- Update security measures based on threats

## Configuration

### Environment Variables

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window

# CORS
ALLOWED_ORIGINS=https://app.coachflow.com,https://admin.coachflow.com

# File Uploads
MAX_FILE_SIZE=52428800           # 50MB in bytes
UPLOAD_PATH=./uploads
VIDEO_UPLOAD_PATH=./uploads/videos
ALLOWED_FILE_TYPES=image/jpeg,image/png,video/mp4

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-secret-key

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=30d
```

## Testing Security Features

### Test Rate Limiting
```bash
# Should block after max requests
for i in {1..20}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test Input Sanitization
```bash
# Should block NoSQL injection
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":"test"}'
```

### Test File Upload Validation
```bash
# Should block dangerous file
curl -X POST http://localhost:5000/api/v1/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@malicious.php.jpg"
```

## Maintenance

### Regular Tasks
1. **Review audit logs** (weekly)
2. **Update rate limits** based on usage patterns
3. **Review allowed origins** when adding new frontends
4. **Update file type whitelist** as needed
5. **Monitor security headers** with security scanners
6. **Test injection protection** regularly

### Security Updates
- Keep dependencies updated
- Review security advisories
- Update patterns for new attack vectors
- Adjust rate limits based on abuse patterns

## Support

For security concerns or questions:
- Review this documentation
- Check implementation examples
- Consult OWASP guidelines
- Report security issues privately

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

