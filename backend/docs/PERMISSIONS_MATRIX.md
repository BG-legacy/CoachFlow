# CoachFlow RBAC Permissions Matrix

## Quick Reference Guide

This document provides a comprehensive overview of what each role can do in the CoachFlow system.

---

## Roles

- **Client**: End users receiving coaching services
- **Coach** (Trainer): Fitness professionals providing coaching
- **Admin**: System administrators with full access

---

## Permissions by Resource

### 🔐 User Management

| Resource | Action | Client | Coach | Admin |
|----------|--------|:------:|:-----:|:-----:|
| Own Profile | Read | ✅ | ✅ | ✅ |
| Own Profile | Update | ✅ | ✅ | ✅ |
| Other Users | Read | ❌ | ✅* | ✅ |
| Other Users | Update | ❌ | ❌ | ✅ |
| Users | Create | ❌ | ❌ | ✅ |
| Users | Delete | ❌ | ❌ | ✅ |
| Users | List | ❌ | ✅* | ✅ |

*Coach can only view/manage assigned clients

---

### 💪 Workouts & Programs

| Resource | Action | Client | Coach | Admin |
|----------|--------|:------:|:-----:|:-----:|
| Workouts | Read | ✅* | ✅ | ✅ |
| Workouts | Create | ❌ | ✅ | ✅ |
| Workouts | Update | ❌ | ✅ | ✅ |
| Workouts | Delete | ❌ | ✅ | ✅ |
| Workouts | List | ✅* | ✅ | ✅ |
| **Workout Logs** | Create | ✅ | ❌ | ✅ |
| Workout Logs | Read | ✅* | ✅** | ✅ |
| Workout Logs | Update | ✅* | ❌ | ✅ |
| Workout Logs | Delete | ❌ | ❌ | ✅ |
| Workout Logs | List | ✅* | ✅** | ✅ |
| **Programs** | Read | ✅* | ✅ | ✅ |
| Programs | Create | ❌ | ✅ | ✅ |
| Programs | Update | ❌ | ✅ | ✅ |
| Programs | Delete | ❌ | ✅ | ✅ |
| Programs | List | ✅* | ✅ | ✅ |

*Client: Own data only  
**Coach: Assigned clients only

---

### 🥗 Nutrition

| Resource | Action | Client | Coach | Admin |
|----------|--------|:------:|:-----:|:-----:|
| Meal Plans | Read | ✅* | ✅ | ✅ |
| Meal Plans | Create | ❌ | ✅ | ✅ |
| Meal Plans | Update | ❌ | ✅ | ✅ |
| Meal Plans | Delete | ❌ | ✅ | ✅ |
| Meal Plans | List | ✅* | ✅ | ✅ |
| **Food Logs** | Create | ✅ | ❌ | ✅ |
| Food Logs | Read | ✅* | ✅** | ✅ |
| Food Logs | Update | ✅* | ❌ | ✅ |
| Food Logs | Delete | ✅* | ❌ | ✅ |
| Food Logs | List | ✅* | ✅** | ✅ |

*Client: Own data only  
**Coach: Assigned clients only

---

### 📅 Sessions

| Resource | Action | Client | Coach | Admin |
|----------|--------|:------:|:-----:|:-----:|
| Sessions | Read | ✅* | ✅ | ✅ |
| Sessions | Create | ❌ | ✅ | ✅ |
| Sessions | Update | ❌ | ✅ | ✅ |
| Sessions | Delete | ❌ | ✅ | ✅ |
| Sessions | List | ✅* | ✅ | ✅ |

*Client: Own sessions only

---

### ✅ Check-ins

| Resource | Action | Client | Coach | Admin |
|----------|--------|:------:|:-----:|:-----:|
| Check-ins | Create | ✅ | ❌ | ✅ |
| Check-ins | Read | ✅* | ✅** | ✅ |
| Check-ins | Update | ✅* | ✅** | ✅ |
| Check-ins | Delete | ❌ | ❌ | ✅ |
| Check-ins | List | ✅* | ✅** | ✅ |

*Client: Own check-ins only  
**Coach: Assigned clients only

---

### 🎥 Form Analysis

| Resource | Action | Client | Coach | Admin |
|----------|--------|:------:|:-----:|:-----:|
| Form Analysis | Read | ✅* | ✅** | ✅ |
| Form Analysis | Create | ❌ | ✅ | ✅ |
| Form Analysis | Update | ❌ | ✅ | ✅ |
| Form Analysis | Delete | ❌ | ✅ | ✅ |
| Form Analysis | List | ✅* | ✅** | ✅ |

*Client: Own analyses only  
**Coach: Assigned clients only

---

### 📊 Reports

| Resource | Action | Client | Coach | Admin |
|----------|--------|:------:|:-----:|:-----:|
| Reports | Read | ✅* | ✅** | ✅ |
| Reports | Create | ❌ | ✅ | ✅ |
| Reports | List | ✅* | ✅** | ✅ |

*Client: Own reports only  
**Coach: Assigned clients only

---

### 🏆 Gamification

| Resource | Action | Client | Coach | Admin |
|----------|--------|:------:|:-----:|:-----:|
| Achievements | Read | ✅* | ✅** | ✅ |
| Achievements | Update | ❌ | ✅ | ✅ |
| Achievements | List | ✅* | ✅** | ✅ |

*Client: Own achievements only  
**Coach: Assigned clients only

---

### ⚙️ Admin Functions

| Resource | Action | Client | Coach | Admin |
|----------|--------|:------:|:-----:|:-----:|
| System Analytics | All | ❌ | ❌ | ✅ |
| User Roles | Manage | ❌ | ❌ | ✅ |
| Configuration | All | ❌ | ❌ | ✅ |
| Audit Logs | View | ❌ | ❌ | ✅ |
| Token Revocation | All Users | ❌ | ❌ | ✅ |

---

## Implementation Examples

### Using Middleware Authorization

```javascript
const { authenticate, authorize } = require('../common/middleware/auth');

// Only coaches and admins
router.post('/workouts', 
  authenticate, 
  authorize('coach', 'admin'), 
  controller.create
);

// Only admins
router.delete('/users/:id', 
  authenticate, 
  authorize('admin'), 
  controller.delete
);
```

### Using Permission Checks

```javascript
const { requirePermission, RESOURCES, ACTIONS } = require('../common/utils/rbac');

// Require specific permission
router.post('/meal-plans', 
  authenticate, 
  requirePermission(RESOURCES.MEAL_PLAN, ACTIONS.CREATE),
  controller.create
);
```

### Using Ownership Checks

```javascript
const { requireOwnershipOrPermission } = require('../common/utils/rbac');

// Allow if owner OR has permission
router.put('/check-ins/:id',
  authenticate,
  requireOwnershipOrPermission(
    RESOURCES.CHECKIN,
    ACTIONS.UPDATE,
    async (req) => {
      const checkin = await Checkin.findById(req.params.id);
      return checkin.userId.toString() === req.user._id.toString();
    }
  ),
  controller.update
);
```

### Programmatic Permission Checks

```javascript
const { hasPermission, RESOURCES, ACTIONS } = require('../common/utils/rbac');

// In service layer
if (!hasPermission(user.role, RESOURCES.WORKOUT, ACTIONS.CREATE)) {
  throw new ForbiddenError('Cannot create workouts');
}
```

---

## Resource Constants

Available in `src/common/utils/rbac.js`:

```javascript
const RESOURCES = {
  USER: 'user',
  CLIENT_PROFILE: 'clientProfile',
  WORKOUT: 'workout',
  WORKOUT_LOG: 'workoutLog',
  PROGRAM: 'program',
  NUTRITION: 'nutrition',
  FOOD_LOG: 'foodLog',
  MEAL_PLAN: 'mealPlan',
  SESSION: 'session',
  CHECKIN: 'checkin',
  FORM_ANALYSIS: 'formAnalysis',
  REPORT: 'report',
  GAMIFICATION: 'gamification',
  ADMIN: 'admin',
};

const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  MANAGE: 'manage', // Full CRUD
};
```

---

## Role Assignment

Roles are assigned during user registration:

```javascript
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "client"  // or "coach"
}
```

Only admins can change user roles after registration.

---

## Security Notes

1. **Ownership checks** should always be performed for resources that belong to users
2. **Coach-client relationships** should be validated before allowing access
3. **Admin actions** should be logged for audit trails
4. **Default role** for new registrations is `client`
5. **Role elevation** (client → coach, coach → admin) requires admin approval

---

**Last Updated**: December 2024  
**Version**: 1.0.0

