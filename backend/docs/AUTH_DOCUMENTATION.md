# Authentication & Authorization Documentation

## Overview

CoachFlow implements a comprehensive authentication and authorization system with:
- **Email/Password Authentication** (industry-standard bcrypt hashing)
- **JWT-based Access & Refresh Tokens** with rotation
- **Token Revocation & Session Management**
- **Role-Based Access Control (RBAC)** with 3 roles
- **Strong Password Policy** enforcement
- **Secure logout** and token blacklisting

---

## Table of Contents

1. [Authentication Methods](#authentication-methods)
2. [Token Management](#token-management)
3. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
4. [Password Policy](#password-policy)
5. [Session Management](#session-management)
6. [API Endpoints](#api-endpoints)
7. [Security Best Practices](#security-best-practices)
8. [Implementation Examples](#implementation-examples)

---

## Authentication Methods

### Email/Password Authentication

CoachFlow uses industry-standard email/password authentication with the following features:

- **bcrypt hashing** with configurable rounds (default: 12)
- **Email validation** (RFC 5322 compliant)
- **Password complexity requirements**
- **Account activation** status checks
- **Email verification** support

#### Registration Flow

```
1. User submits email, password, name, and role
2. System validates email uniqueness
3. Password validated against policy
4. Password hashed with bcrypt
5. User created in database
6. Access & refresh tokens generated
7. Tokens returned to client
```

#### Login Flow

```
1. User submits email and password
2. System finds user by email
3. Verify account is active
4. Compare password with bcrypt hash
5. Update last login timestamp
6. Generate new access & refresh tokens
7. Return tokens to client
```

---

## Token Management

### Token Types

#### Access Token
- **Purpose**: Authentication for API requests
- **Lifetime**: 7 days (configurable via `JWT_EXPIRE`)
- **Payload**: `{ userId, role }`
- **Storage**: Client-side (memory/localStorage)
- **Usage**: Include in `Authorization: Bearer <token>` header

#### Refresh Token
- **Purpose**: Obtain new access tokens
- **Lifetime**: 30 days (configurable via `JWT_REFRESH_EXPIRE`)
- **Payload**: `{ userId }`
- **Storage**: Client-side (httpOnly cookie recommended)
- **Usage**: Submit to `/auth/refresh` endpoint

### Token Rotation

CoachFlow implements **automatic token rotation** for enhanced security:

1. When refresh token is used, it is immediately blacklisted
2. New access AND refresh tokens are generated
3. Old tokens cannot be reused (prevents replay attacks)

### Token Revocation

Tokens can be revoked in several scenarios:

| Scenario | Trigger | Action |
|----------|---------|--------|
| **Logout** | User logs out | Both tokens blacklisted |
| **Password Change** | User changes password | All user tokens revoked |
| **Security Breach** | Admin detects compromise | All user tokens revoked |
| **Manual Revocation** | Admin action | Specific token blacklisted |

### Token Blacklist

Revoked tokens are stored in MongoDB with TTL (Time-To-Live) indexing:

```javascript
{
  token: String,          // The revoked token
  userId: ObjectId,       // User who owned the token
  tokenType: 'access' | 'refresh',
  reason: 'logout' | 'revoked' | 'password_change' | 'security',
  expiresAt: Date,        // Auto-deleted by MongoDB after expiration
  revokedBy: ObjectId,    // Admin who revoked (if applicable)
  ipAddress: String,      // For audit trail
  userAgent: String       // For audit trail
}
```

---

## Role-Based Access Control (RBAC)

### Roles

CoachFlow supports three primary roles:

1. **client** - End users receiving coaching services
2. **coach** (also called trainer) - Fitness professionals
3. **admin** - System administrators

### Permissions Matrix

The following table defines what each role can do:

#### User Management

| Action | Client | Coach | Admin |
|--------|--------|-------|-------|
| View own profile | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ |
| View other profiles | ❌ | ✅ (assigned) | ✅ |
| Create users | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |

#### Workouts & Programs

| Action | Client | Coach | Admin |
|--------|--------|-------|-------|
| View assigned workouts | ✅ | ✅ | ✅ |
| Create workout logs | ✅ | ❌ | ✅ |
| View workout logs | ✅ (own) | ✅ (clients) | ✅ |
| Create workouts | ❌ | ✅ | ✅ |
| Edit workouts | ❌ | ✅ | ✅ |
| Delete workouts | ❌ | ✅ | ✅ |
| Create programs | ❌ | ✅ | ✅ |
| Assign programs | ❌ | ✅ | ✅ |

#### Nutrition

| Action | Client | Coach | Admin |
|--------|--------|-------|-------|
| View meal plans | ✅ (assigned) | ✅ | ✅ |
| Create food logs | ✅ | ❌ | ✅ |
| View food logs | ✅ (own) | ✅ (clients) | ✅ |
| Edit food logs | ✅ (own) | ❌ | ✅ |
| Create meal plans | ❌ | ✅ | ✅ |
| Edit meal plans | ❌ | ✅ | ✅ |
| Delete meal plans | ❌ | ✅ | ✅ |

#### Sessions

| Action | Client | Coach | Admin |
|--------|--------|-------|-------|
| View sessions | ✅ (own) | ✅ | ✅ |
| Schedule sessions | ❌ | ✅ | ✅ |
| Cancel sessions | ❌ | ✅ | ✅ |
| Complete sessions | ❌ | ✅ | ✅ |

#### Check-ins

| Action | Client | Coach | Admin |
|--------|--------|-------|-------|
| Create check-ins | ✅ | ❌ | ✅ |
| View check-ins | ✅ (own) | ✅ (clients) | ✅ |
| Edit check-ins | ✅ (own) | ✅ | ✅ |
| Delete check-ins | ❌ | ❌ | ✅ |

#### Form Analysis

| Action | Client | Coach | Admin |
|--------|--------|-------|-------|
| View analyses | ✅ (own) | ✅ (clients) | ✅ |
| Create analyses | ❌ | ✅ | ✅ |
| Edit analyses | ❌ | ✅ | ✅ |
| Delete analyses | ❌ | ✅ | ✅ |

#### Reports

| Action | Client | Coach | Admin |
|--------|--------|-------|-------|
| View reports | ✅ (own) | ✅ (clients) | ✅ |
| Generate reports | ❌ | ✅ | ✅ |

#### Admin Functions

| Action | Client | Coach | Admin |
|--------|--------|-------|-------|
| View analytics | ❌ | ❌ | ✅ |
| Manage roles | ❌ | ❌ | ✅ |
| System configuration | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |

### Using RBAC in Code

#### Method 1: Middleware Authorization

```javascript
const { authenticate, authorize } = require('../common/middleware/auth');

// Only coaches and admins can access
router.post('/workouts', 
  authenticate, 
  authorize('coach', 'admin'), 
  workoutController.create
);

// Only admins can access
router.delete('/users/:id', 
  authenticate, 
  authorize('admin'), 
  userController.delete
);
```

#### Method 2: Permission-Based Authorization

```javascript
const { requirePermission } = require('../common/utils/rbac');
const { RESOURCES, ACTIONS } = require('../common/utils/rbac');

// Check specific permission
router.post('/meal-plans', 
  authenticate, 
  requirePermission(RESOURCES.MEAL_PLAN, ACTIONS.CREATE),
  mealPlanController.create
);
```

#### Method 3: Ownership + Permission

```javascript
const { requireOwnershipOrPermission } = require('../common/utils/rbac');

// Allow if user owns resource OR has permission
router.put('/profiles/:id',
  authenticate,
  requireOwnershipOrPermission(
    RESOURCES.CLIENT_PROFILE,
    ACTIONS.UPDATE,
    async (req) => req.params.id === req.user._id.toString()
  ),
  profileController.update
);
```

#### Method 4: Programmatic Permission Check

```javascript
const { hasPermission, RESOURCES, ACTIONS } = require('../common/utils/rbac');

// In service or controller
if (!hasPermission(user.role, RESOURCES.WORKOUT, ACTIONS.CREATE)) {
  throw new ForbiddenError('Insufficient permissions');
}
```

---

## Password Policy

CoachFlow enforces industry-standard password requirements:

### Minimum Requirements

- ✅ At least **8 characters** long (maximum 128)
- ✅ At least **one uppercase** letter (A-Z)
- ✅ At least **one lowercase** letter (a-z)
- ✅ At least **one number** (0-9)
- ✅ At least **one special character** (!@#$%^&*()_+-=[]{}|;:,.<>?)
- ✅ Not a **commonly used password** (checked against list of 100+ common passwords)
- ✅ Should not contain **personal information** (email, name, etc.)

### Password Strength Levels

Passwords are rated on a 5-level scale:

| Level | Score | Description |
|-------|-------|-------------|
| **Weak** | ≤3 | Fails basic requirements, easily guessable |
| **Fair** | 4-5 | Meets minimum requirements |
| **Good** | 6-7 | Good mix of characters |
| **Strong** | 8-9 | Excellent complexity and length |
| **Excellent** | 10+ | Maximum security, diverse patterns |

### Password Validation Examples

```javascript
// Valid passwords
"MyP@ssw0rd123"     // Excellent
"Secure#2024Pass"   // Strong
"Train!ng99"        // Good

// Invalid passwords
"password"          // Too common
"12345678"          // No letters
"onlylowercase"     // No uppercase, numbers, or special chars
"john@example.com"  // Contains personal info (if user's email)
```

### Hashing

- **Algorithm**: bcrypt
- **Rounds**: 12 (configurable via `BCRYPT_ROUNDS`)
- **Time**: ~250ms per hash (intentionally slow to prevent brute force)

---

## Session Management

### Logout

When a user logs out:

1. Client sends access token (in header) and refresh token (in body)
2. Server blacklists both tokens
3. Tokens cannot be used again
4. Client should clear stored tokens

```javascript
POST /api/v1/auth/logout
Authorization: Bearer <access_token>

{
  "refreshToken": "<refresh_token>"
}
```

### Token Refresh

Token rotation is automatic:

```javascript
POST /api/v1/auth/refresh

{
  "refreshToken": "<current_refresh_token>"
}

// Response:
{
  "success": true,
  "data": {
    "accessToken": "<new_access_token>",
    "refreshToken": "<new_refresh_token>"  // Old one is now invalid
  }
}
```

### Revoke Specific Token

Admins or users can manually revoke tokens:

```javascript
POST /api/v1/auth/revoke-token
Authorization: Bearer <access_token>

{
  "token": "<token_to_revoke>",
  "tokenType": "refresh",  // or "access"
  "reason": "security"     // optional: logout, revoked, security
}
```

### View Active Sessions

Users can view their session history:

```javascript
GET /api/v1/auth/sessions
Authorization: Bearer <access_token>

// Response: List of recent sessions (last 10)
{
  "success": true,
  "data": [
    {
      "tokenType": "refresh",
      "reason": "logout",
      "createdAt": "2024-01-15T10:30:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

### Revoke All Tokens (Security)

When security breach is detected or password changes:

```javascript
// Automatically triggered on password change
// Or manually by admin:
await authService.revokeAllUserTokens(userId, 'security');
```

---

## API Endpoints

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Get new access token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/verify-email/:token` | Verify email address |

### Protected Endpoints (Authentication Required)

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/auth/me` | Get current user | Any |
| PUT | `/auth/change-password` | Change password | Any |
| POST | `/auth/logout` | Logout and revoke tokens | Any |
| POST | `/auth/revoke-token` | Revoke specific token | Any |
| GET | `/auth/sessions` | Get session history | Any |

---

## Security Best Practices

### For Developers

1. **Never log tokens** in production
2. **Always use HTTPS** in production
3. **Store refresh tokens** in httpOnly cookies (not localStorage)
4. **Implement rate limiting** on auth endpoints
5. **Use environment variables** for secrets (never hardcode)
6. **Validate all inputs** before processing
7. **Implement account lockout** after failed login attempts (future enhancement)
8. **Monitor for suspicious activity** (multiple failed logins, unusual IP addresses)

### Token Storage Recommendations

| Storage | Access Token | Refresh Token | Recommended |
|---------|--------------|---------------|-------------|
| **Memory** | ✅ Yes | ✅ Yes | ✅ Best (lost on refresh) |
| **httpOnly Cookie** | ✅ Yes | ✅ Yes | ✅ Excellent (XSS safe) |
| **localStorage** | ⚠️ OK | ❌ No | ⚠️ Acceptable (vulnerable to XSS) |
| **sessionStorage** | ✅ Yes | ❌ No | ✅ Good (cleared on tab close) |

### Client-Side Implementation

```javascript
// Example: Using httpOnly cookies (recommended)
// Server sets cookie with refresh token
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
});

// Client stores access token in memory
let accessToken = null;

// Include token in requests
axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

// Refresh token flow
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh it
      const { data } = await axios.post('/auth/refresh'); // Cookie sent automatically
      accessToken = data.accessToken;
      error.config.headers['Authorization'] = `Bearer ${accessToken}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## Implementation Examples

### Example 1: Register and Login

```javascript
// Register
const response = await axios.post('/api/v1/auth/register', {
  email: 'john@example.com',
  password: 'MySecure#Pass123',
  firstName: 'John',
  lastName: 'Doe',
  role: 'client'
});

const { user, accessToken, refreshToken } = response.data.data;

// Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

### Example 2: Protected Request

```javascript
// Make authenticated request
const response = await axios.get('/api/v1/workouts', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Example 3: Logout

```javascript
// Logout
await axios.post('/api/v1/auth/logout', 
  { refreshToken },
  {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  }
);

// Clear local storage
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

### Example 4: Role-Based UI

```javascript
// Show/hide features based on role
const user = await axios.get('/api/v1/auth/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

if (user.data.role === 'coach') {
  // Show coach dashboard
  showCoachFeatures();
} else if (user.data.role === 'client') {
  // Show client dashboard
  showClientFeatures();
}
```

### Example 5: Permission Check

```javascript
const { hasPermission, RESOURCES, ACTIONS } = require('./utils/rbac');

// In a service
class WorkoutService {
  async createWorkout(userId, workoutData) {
    const user = await User.findById(userId);
    
    if (!hasPermission(user.role, RESOURCES.WORKOUT, ACTIONS.CREATE)) {
      throw new ForbiddenError('You cannot create workouts');
    }
    
    // Create workout...
  }
}
```

---

## Environment Variables

Required environment variables for authentication:

```bash
# JWT Configuration
JWT_SECRET=your_super_secret_key_here_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_here_min_32_chars
JWT_REFRESH_EXPIRE=30d

# Security
BCRYPT_ROUNDS=12

# MongoDB (for token blacklist)
MONGODB_URI=mongodb://localhost:27017/coachflow
```

---

## Testing Authentication

### Manual Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test#Pass123",
    "firstName": "Test",
    "lastName": "User",
    "role": "client"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test#Pass123"
  }'

# Get current user (use token from login)
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Logout
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

---

## Future Enhancements

Potential improvements for the authentication system:

- [ ] **OAuth 2.0** integration (Google, Facebook, Apple)
- [ ] **Passwordless authentication** (Magic links, WebAuthn)
- [ ] **Two-Factor Authentication (2FA)** with TOTP
- [ ] **Account lockout** after failed login attempts
- [ ] **IP whitelisting/blacklisting**
- [ ] **Device fingerprinting** for session management
- [ ] **Password breach detection** (Have I Been Pwned API)
- [ ] **Session persistence** in Redis for better scalability
- [ ] **Audit logging** for all authentication events
- [ ] **Remember me** functionality

---

## Support

For questions or issues related to authentication:

1. Check this documentation first
2. Review the code in `/src/modules/auth/`
3. Check logs in `/logs/` directory
4. Contact the development team

---

**Last Updated**: December 2024  
**Version**: 1.0.0

