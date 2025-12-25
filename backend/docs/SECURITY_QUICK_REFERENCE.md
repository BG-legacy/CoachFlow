# Security Quick Reference

Quick reference for developers implementing security features in CoachFlow API.

## 🔒 Import Statements

```javascript
// Rate Limiting
const { 
  globalLimiter, 
  authLimiter, 
  loginLimiter,
  aiLimiter,
  uploadLimiter,
  registrationLimiter,
  passwordResetLimiter
} = require('../../../common/middleware/rateLimiter');

// Validation
const { 
  validate,
  requireBody,
  requireFields,
  validatePagination,
  validateSort,
  validateObjectId,
  validateDateRange,
  validateSearch,
  validateContentType,
  preventParameterPollution
} = require('../../../common/middleware/validation');

// Sanitization
const { 
  sanitizeInputs,
  sanitizeString,
  sanitizeObject,
  validateAgainstInjection
} = require('../../../common/middleware/sanitization');

// File Upload
const { 
  createUploadMiddleware,
  validateUploadedFiles,
  uploadSingleImage,
  uploadMultipleImages,
  uploadSingleVideo,
  uploadDocument
} = require('../../../common/middleware/fileUpload');

// Audit Logging
const { 
  auditHelpers,
  logAuditEvent,
  extractRequestMetadata
} = require('../../../common/utils/auditLogger');

// Security Headers
const { 
  applySecurityHeaders,
  customSecurityHeaders,
  getCorsOptions
} = require('../../../common/middleware/securityHeaders');
```

## 🛣️ Route Examples

### Basic Route with Validation
```javascript
const schema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
});

router.post('/users', validate(schema), controller.createUser);
```

### Auth Route with Rate Limiting
```javascript
router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/register', registrationLimiter, validate(registerSchema), controller.register);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
```

### AI Endpoint with Rate Limiting
```javascript
router.post('/analyze', aiLimiter, validate(analysisSchema), controller.analyze);
```

### File Upload Route
```javascript
// Single image
router.post('/avatar', 
  uploadSingleImage.single('avatar'),
  validateUploadedFiles({ 
    maxSize: 5 * 1024 * 1024,
    allowedCategory: 'images'
  }),
  controller.uploadAvatar
);

// Multiple images
router.post('/gallery',
  uploadMultipleImages.array('images', 10),
  validateUploadedFiles({ allowedCategory: 'images' }),
  controller.uploadGallery
);

// Video with AI analysis
router.post('/form-analysis',
  uploadLimiter,
  aiLimiter,
  uploadSingleVideo.single('video'),
  validateUploadedFiles({ allowedCategory: 'videos' }),
  controller.analyzeForm
);
```

### Paginated Route
```javascript
router.get('/users', 
  authenticate,
  validatePagination,
  validateSort(['name', 'email', 'createdAt']),
  controller.getUsers
);

// Access in controller
const { page, limit, skip } = req.pagination;
const sort = req.sort;
```

### Route with ObjectId Validation
```javascript
router.get('/users/:id', 
  authenticate,
  validateObjectId('id'),
  controller.getUser
);
```

## 🎮 Controller Examples

### Auth Controller with Audit Logging
```javascript
class AuthController {
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const result = await authService.login(email, password);
      
      // Log successful login
      await auditHelpers.loginSuccess(req, result.user._id);
      
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      // Log failed login
      await auditHelpers.loginFailure(req, email, error.message);
      throw error;
    }
  });

  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user._id, 
      currentPassword, 
      newPassword
    );
    
    // Log password change
    await auditHelpers.passwordChange(req, req.user._id);
    
    return successResponse(res, result);
  });

  logout = asyncHandler(async (req, res) => {
    const result = await authService.logout(req.user._id);
    
    // Log logout
    await auditHelpers.logout(req, req.user._id);
    
    return successResponse(res, result);
  });
}
```

### Plan Controller with Audit Logging
```javascript
class WorkoutController {
  createProgram = asyncHandler(async (req, res) => {
    const program = await workoutService.createProgram(req.user._id, req.body);
    
    // Log plan creation
    await auditHelpers.planCreated(req, program._id, {
      name: program.name,
      clientId: program.clientId,
      duration: program.duration,
    });
    
    return createdResponse(res, program);
  });

  updateProgram = asyncHandler(async (req, res) => {
    const program = await workoutService.updateProgram(
      req.params.id,
      req.user._id,
      req.body
    );
    
    // Log plan update
    await auditHelpers.planUpdated(req, program._id, {
      updates: Object.keys(req.body),
    });
    
    return successResponse(res, program);
  });

  deleteProgram = asyncHandler(async (req, res) => {
    await workoutService.deleteProgram(req.params.id, req.user._id);
    
    // Log plan deletion
    await auditHelpers.planDeleted(req, req.params.id);
    
    return successResponse(res, { message: 'Program deleted' });
  });
}
```

### Admin Controller with Audit Logging
```javascript
class AdminController {
  updateUserRole = asyncHandler(async (req, res) => {
    const { userId, role } = req.body;
    const oldRole = user.role; // Get before update
    
    const user = await adminService.updateUserRole(userId, role);
    
    // Log role change
    await auditHelpers.adminRoleChange(req, userId, oldRole, role);
    
    return successResponse(res, user);
  });

  toggleUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await adminService.toggleUserStatus(userId);
    
    // Log status change
    await auditHelpers.adminUserUpdate(req, userId, { 
      isActive: user.isActive,
      status: user.isActive ? 'activated' : 'suspended'
    });
    
    return successResponse(res, user);
  });
}
```

### Custom Audit Logging
```javascript
// Log custom event
await logAuditEvent({
  eventType: 'PLAN_ASSIGNED',
  userId: req.user._id,
  targetUserId: clientId,
  action: 'Assigned workout plan to client',
  resource: 'workout-plan',
  resourceId: planId,
  details: { planName: plan.name },
  ...extractRequestMetadata(req),
  success: true,
});
```

## 📝 Validation Schemas

### Common Validators
```javascript
const Joi = require('joi');
const { validators } = require('../../../common/validators/common.validators');

// Email
validators.email // Pre-configured email validator

// Password (min 8 chars, requires uppercase, lowercase, number, special)
validators.password

// Phone
validators.phone

// MongoDB ObjectId
validators.objectId

// Example schema
const userSchema = Joi.object({
  email: validators.email,
  password: validators.password,
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  phone: validators.phone,
  role: Joi.string().valid('client', 'coach', 'admin').default('client'),
});
```

## 🔧 Custom File Upload Middleware
```javascript
// Custom configuration
const customUpload = createUploadMiddleware({
  maxFiles: 5,
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedCategory: 'images',
  useMemory: true, // For content scanning
});

router.post('/upload', 
  customUpload.array('files', 5),
  validateUploadedFiles({
    maxSize: 10 * 1024 * 1024,
    allowedCategory: 'images',
    scanContent: true
  }),
  controller.handleUpload
);
```

## 🔍 Audit Log Queries

### MongoDB Queries
```javascript
// Failed login attempts
db.auditevents.find({ 
  eventType: 'LOGIN_FAILURE',
  timestamp: { $gte: ISODate('2024-01-01') }
}).sort({ timestamp: -1 })

// Admin actions
db.auditevents.find({ 
  eventType: /^ADMIN_/ 
}).sort({ timestamp: -1 })

// User's activity
db.auditevents.find({ 
  userId: ObjectId('...') 
}).sort({ timestamp: -1 })

// Security events
db.auditevents.find({
  eventType: { 
    $in: ['INJECTION_ATTEMPT', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED'] 
  }
}).sort({ timestamp: -1 })
```

### Mongoose Queries
```javascript
const { AuditEvent } = require('../../../common/utils/auditLogger');

// Recent failed logins
const failedLogins = await AuditEvent.find({
  eventType: 'LOGIN_FAILURE',
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
})
.sort({ timestamp: -1 })
.limit(100);

// User's audit history
const userHistory = await AuditEvent.find({ 
  userId: userId 
})
.sort({ timestamp: -1 })
.limit(50);
```

## ⚡ Rate Limit Reference

| Limiter | Window | Limit (Prod) | Limit (Dev) | Use Case |
|---------|--------|--------------|-------------|----------|
| `globalLimiter` | 15 min | 100 | 1000 | All API routes |
| `loginLimiter` | 15 min | 3 | 10 | Login endpoint |
| `authLimiter` | 15 min | 5 | 20 | Auth operations |
| `registrationLimiter` | 1 hour | 3 | 10 | Registration |
| `passwordResetLimiter` | 1 hour | 3 | 10 | Password reset |
| `aiLimiter` | 1 hour | 10 | 50 | AI endpoints |
| `uploadLimiter` | 1 hour | 20 | 100 | File uploads |

## 🎯 Audit Event Types

```javascript
// Authentication
'LOGIN_SUCCESS'
'LOGIN_FAILURE'
'LOGOUT'
'TOKEN_REFRESH'
'REGISTRATION_SUCCESS'
'REGISTRATION_FAILURE'

// Password
'PASSWORD_CHANGE'
'PASSWORD_RESET_REQUEST'
'PASSWORD_RESET_SUCCESS'
'PASSWORD_RESET_FAILURE'

// Account
'ACCOUNT_UPDATE'
'ACCOUNT_DELETION'
'ACCOUNT_SUSPENSION'
'ACCOUNT_ACTIVATION'

// Plans
'PLAN_CREATED'
'PLAN_UPDATED'
'PLAN_DELETED'
'PLAN_ASSIGNED'

// Admin
'ADMIN_USER_CREATE'
'ADMIN_USER_UPDATE'
'ADMIN_USER_DELETE'
'ADMIN_ROLE_CHANGE'
'ADMIN_PERMISSION_CHANGE'
'ADMIN_SETTINGS_UPDATE'

// Security
'SUSPICIOUS_ACTIVITY'
'RATE_LIMIT_EXCEEDED'
'UNAUTHORIZED_ACCESS'
'INJECTION_ATTEMPT'
```

## 📚 Related Documentation

- **[API_SECURITY.md](./API_SECURITY.md)** - Comprehensive security guide
- **[SECURITY_CONFIG_GUIDE.md](./SECURITY_CONFIG_GUIDE.md)** - Configuration guide
- **[SECURITY_IMPLEMENTATION_SUMMARY.md](./SECURITY_IMPLEMENTATION_SUMMARY.md)** - Implementation summary

## 💡 Tips

1. **Always validate input** - Use validation middleware on all routes
2. **Use appropriate rate limiters** - Don't use global limiter for auth endpoints
3. **Log sensitive actions** - Use audit helpers for important operations
4. **Handle files carefully** - Always validate uploads
5. **Return consistent responses** - Use response helpers
6. **Don't log sensitive data** - Passwords, tokens, etc.
7. **Test security features** - Verify rate limits, validation, etc.

## 🚨 Security Checklist for New Endpoints

- [ ] Added appropriate rate limiter
- [ ] Added input validation schema
- [ ] Validated URL parameters (ObjectIds, etc.)
- [ ] Added authentication/authorization
- [ ] Added audit logging (if sensitive)
- [ ] Validated file uploads (if applicable)
- [ ] Tested with invalid inputs
- [ ] Tested rate limiting
- [ ] Reviewed for security issues
- [ ] Updated API documentation

---

**Quick Start**: Copy-paste examples above and adjust for your use case!

