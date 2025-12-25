# Authentication & Authorization - Quick Reference Card

## 🚀 Common Tasks

### Register a User

```javascript
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Secure#Pass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "client"  // or "coach"
}

Response: { user, accessToken, refreshToken }
```

### Login

```javascript
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Secure#Pass123"
}

Response: { user, accessToken, refreshToken }
```

### Make Authenticated Request

```javascript
GET /api/v1/auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Refresh Token

```javascript
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}

Response: { accessToken, refreshToken }  // New tokens!
```

### Logout

```javascript
POST /api/v1/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}

Response: { message: "Logout successful" }
```

### Change Password

```javascript
PUT /api/v1/auth/change-password
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "currentPassword": "OldPass#123",
  "newPassword": "NewPass#456"
}

Response: { message: "Password changed successfully. Please login again." }
// All tokens are revoked!
```

---

## 🔐 Middleware Usage

### Require Authentication

```javascript
const { authenticate } = require('./common/middleware/auth');

router.get('/protected', authenticate, controller.method);
```

### Require Specific Role(s)

```javascript
const { authenticate, authorize } = require('./common/middleware/auth');

// Single role
router.post('/admin', authenticate, authorize('admin'), controller.method);

// Multiple roles
router.post('/workouts', authenticate, authorize('coach', 'admin'), controller.method);
```

### Require Specific Permission

```javascript
const { authenticate } = require('./common/middleware/auth');
const { requirePermission, RESOURCES, ACTIONS } = require('./common/utils/rbac');

router.post('/meal-plans',
  authenticate,
  requirePermission(RESOURCES.MEAL_PLAN, ACTIONS.CREATE),
  controller.method
);
```

### Check Ownership or Permission

```javascript
const { authenticate } = require('./common/middleware/auth');
const { requireOwnershipOrPermission, RESOURCES, ACTIONS } = require('./common/utils/rbac');

router.put('/profiles/:id',
  authenticate,
  requireOwnershipOrPermission(
    RESOURCES.CLIENT_PROFILE,
    ACTIONS.UPDATE,
    async (req) => {
      // Return true if user owns the resource
      return req.params.id === req.user._id.toString();
    }
  ),
  controller.method
);
```

---

## ✅ Permission Checks in Code

### Check Permission

```javascript
const { hasPermission, RESOURCES, ACTIONS } = require('./common/utils/rbac');

if (!hasPermission(user.role, RESOURCES.WORKOUT, ACTIONS.CREATE)) {
  throw new ForbiddenError('Cannot create workouts');
}
```

### Check Any Permission

```javascript
const { hasAnyPermission, RESOURCES, ACTIONS } = require('./common/utils/rbac');

if (hasAnyPermission(user.role, RESOURCES.WORKOUT, [ACTIONS.CREATE, ACTIONS.UPDATE])) {
  // User can create OR update workouts
}
```

### Check All Permissions

```javascript
const { hasAllPermissions, RESOURCES, ACTIONS } = require('./common/utils/rbac');

if (hasAllPermissions(user.role, RESOURCES.WORKOUT, [ACTIONS.READ, ACTIONS.UPDATE])) {
  // User can read AND update workouts
}
```

### Get All Permissions for Resource

```javascript
const { getResourcePermissions, RESOURCES } = require('./common/utils/rbac');

const permissions = getResourcePermissions(user.role, RESOURCES.WORKOUT);
// Returns: ['create', 'read', 'update', 'delete', 'list'] for coach
```

---

## 🔑 Password Validation

### Validate Password

```javascript
const { validatePassword } = require('./common/utils/passwordPolicy');

const result = validatePassword('MyP@ssw0rd123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
});

if (!result.valid) {
  console.log('Errors:', result.errors);
  // ["Password must contain at least one uppercase letter", ...]
}

console.log('Strength:', result.strength);
// "weak", "fair", "good", "strong", or "excellent"
```

### Get Password Requirements

```javascript
const { getPasswordRequirements } = require('./common/utils/passwordPolicy');

const requirements = getPasswordRequirements();
// Returns array of requirement strings
```

---

## 🎯 Roles & Resources

### Roles

```javascript
const { ROLES } = require('./common/utils/rbac');

ROLES.CLIENT    // 'client'
ROLES.TRAINER   // 'coach'
ROLES.ADMIN     // 'admin'
```

### Resources

```javascript
const { RESOURCES } = require('./common/utils/rbac');

RESOURCES.USER
RESOURCES.CLIENT_PROFILE
RESOURCES.WORKOUT
RESOURCES.WORKOUT_LOG
RESOURCES.PROGRAM
RESOURCES.NUTRITION
RESOURCES.FOOD_LOG
RESOURCES.MEAL_PLAN
RESOURCES.SESSION
RESOURCES.CHECKIN
RESOURCES.FORM_ANALYSIS
RESOURCES.REPORT
RESOURCES.GAMIFICATION
RESOURCES.ADMIN
```

### Actions

```javascript
const { ACTIONS } = require('./common/utils/rbac');

ACTIONS.CREATE   // 'create'
ACTIONS.READ     // 'read'
ACTIONS.UPDATE   // 'update'
ACTIONS.DELETE   // 'delete'
ACTIONS.LIST     // 'list'
ACTIONS.MANAGE   // 'manage' (all CRUD)
```

---

## 🔒 Token Management

### Blacklist Token

```javascript
const authService = require('./modules/auth/services/auth.service');

await authService.revokeToken(
  token,
  userId,
  'refresh',  // or 'access'
  'security'  // or 'logout', 'revoked', 'password_change'
);
```

### Revoke All User Tokens

```javascript
await authService.revokeAllUserTokens(userId, 'security');
```

### Check if Token is Blacklisted

```javascript
const TokenBlacklist = require('./modules/auth/models/tokenBlacklist.model');

const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
```

---

## 📝 Validation Schemas

### Email

```javascript
const Joi = require('joi');
const { validators } = require('./common/validators/common.validators');

const schema = Joi.object({
  email: validators.email  // Required, valid email format
});
```

### Password

```javascript
const schema = Joi.object({
  password: validators.password  // Min 8, requires uppercase, lowercase, number, special char
});
```

### MongoDB ID

```javascript
const schema = Joi.object({
  userId: validators.mongoId  // Valid MongoDB ObjectId
});
```

---

## 🎨 Frontend Examples

### Store Tokens (Recommended)

```javascript
// After login/register
const { user, accessToken, refreshToken } = response.data.data;

// Option 1: Memory + httpOnly Cookie (BEST)
let accessTokenInMemory = accessToken;
// Refresh token in httpOnly cookie (set by server)

// Option 2: sessionStorage (GOOD)
sessionStorage.setItem('accessToken', accessToken);
sessionStorage.setItem('refreshToken', refreshToken);

// Option 3: localStorage (OK, but vulnerable to XSS)
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

### Axios Interceptor

```javascript
import axios from 'axios';

// Add token to all requests
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = sessionStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
        
        sessionStorage.setItem('accessToken', data.data.accessToken);
        sessionStorage.setItem('refreshToken', data.data.refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get('/api/v1/auth/me');
        setUser(data.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/v1/auth/login', { email, password });
    sessionStorage.setItem('accessToken', data.data.accessToken);
    sessionStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data.data;
  };

  const logout = async () => {
    const accessToken = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');
    
    try {
      await axios.post('/api/v1/auth/logout', 
        { refreshToken },
        { headers: { Authorization: `Bearer ${accessToken}` }}
      );
    } finally {
      sessionStorage.clear();
      setUser(null);
    }
  };

  const hasRole = (role) => user?.role === role;
  
  const hasAnyRole = (...roles) => roles.includes(user?.role);

  return { user, loading, login, logout, hasRole, hasAnyRole };
};
```

### Role-Based Rendering

```javascript
const { user } = useAuth();

return (
  <div>
    {user.role === 'client' && <ClientDashboard />}
    {user.role === 'coach' && <CoachDashboard />}
    {user.role === 'admin' && <AdminDashboard />}
    
    {/* Or with helper */}
    {hasRole('admin') && <AdminPanel />}
    {hasAnyRole('coach', 'admin') && <CreateWorkout />}
  </div>
);
```

---

## 🔍 Common Errors

### 401 Unauthorized

**Causes:**
- No token provided
- Invalid token
- Expired token
- Token has been revoked/blacklisted
- User account deactivated

**Solution:**
- Check token is in Authorization header
- Refresh token if expired
- Login again if refresh fails

### 403 Forbidden

**Causes:**
- User doesn't have required role
- User doesn't have required permission
- User doesn't own the resource

**Solution:**
- Check user role
- Check permission requirements
- Verify ownership logic

### 422 Validation Error

**Causes:**
- Password doesn't meet policy
- Invalid email format
- Missing required fields

**Solution:**
- Review password requirements
- Validate inputs client-side
- Check API documentation

---

## 🔬 Testing Commands

### cURL Examples

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test#Pass123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test#Pass123"}'

# Get Profile
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN_HERE"

# Logout
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN"}'
```

---

## ⚙️ Environment Variables

```bash
# Required
JWT_SECRET=your_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_chars
MONGODB_URI=mongodb://localhost:27017/coachflow

# Optional (with defaults)
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
BCRYPT_ROUNDS=12
```

---

## 📚 Documentation Links

- **Complete Guide**: `AUTH_DOCUMENTATION.md`
- **Implementation Summary**: `AUTH_IMPLEMENTATION_SUMMARY.md`
- **Permissions Matrix**: `PERMISSIONS_MATRIX.md`
- **This Quick Reference**: `AUTH_QUICK_REFERENCE.md`

---

**Quick Tip**: Bookmark this page for fast reference! 🚀

