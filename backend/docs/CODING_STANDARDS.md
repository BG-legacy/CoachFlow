# CoachFlow Backend - Coding Standards & Guidelines

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Naming Conventions](#naming-conventions)
4. [Layered Architecture](#layered-architecture)
5. [Response Format](#response-format)
6. [Error Handling](#error-handling)
7. [Code Style](#code-style)
8. [Best Practices](#best-practices)

---

## Architecture Overview

CoachFlow backend follows a **clean layered architecture** pattern:

```
Routes → Controllers → Services → Repositories → Models (Database)
```

This separation ensures:
- **Maintainability**: Each layer has a single responsibility
- **Testability**: Layers can be tested independently
- **Scalability**: Easy to modify or extend functionality
- **Reusability**: Services and repositories can be reused

---

## Folder Structure

```
backend/
├── src/
│   ├── common/                    # Shared utilities and middleware
│   │   ├── config/               # Configuration management
│   │   ├── database/             # Database connection
│   │   ├── middleware/           # Global middleware (auth, error handling)
│   │   ├── utils/                # Utility functions (logger, security, errors)
│   │   └── validators/           # Validation schemas
│   │
│   ├── modules/                   # Feature modules
│   │   ├── auth/                 # Authentication & Users
│   │   ├── clients/              # Client Profiles & Preferences
│   │   ├── workouts/             # Workouts & Programs
│   │   ├── nutrition/            # Nutrition & Meal Plans
│   │   ├── checkins/             # Check-ins & Adherence
│   │   ├── sessions/             # Sessions & Bookings
│   │   ├── notifications/        # Email/SMS/Push Notifications
│   │   ├── gamification/         # XP, Levels, Badges
│   │   ├── reports/              # Weekly Summaries & Analytics
│   │   ├── formAnalysis/         # Video Analysis
│   │   └── admin/                # Admin/Coach Dashboard
│   │
│   ├── app.js                    # Express app configuration
│   └── server.js                 # Server entry point
│
├── uploads/                       # File uploads
├── logs/                          # Application logs
├── package.json
├── .env.example
├── .gitignore
└── CODING_STANDARDS.md
```

### Module Structure

Each module follows this consistent structure:

```
module/
├── models/           # Mongoose schemas
├── repositories/     # Data access layer
├── services/         # Business logic
├── controllers/      # Request handlers
└── routes/           # Route definitions
```

---

## Naming Conventions

### Files

- **Models**: `{entity}.model.js` (e.g., `user.model.js`)
- **Repositories**: `{entity}.repository.js` (e.g., `user.repository.js`)
- **Services**: `{entity}.service.js` (e.g., `auth.service.js`)
- **Controllers**: `{entity}.controller.js` (e.g., `auth.controller.js`)
- **Routes**: `{entity}.routes.js` (e.g., `auth.routes.js`)

### Variables & Functions

- **camelCase** for variables and functions: `getUserById`, `isActive`
- **PascalCase** for classes: `AuthService`, `UserRepository`
- **UPPER_SNAKE_CASE** for constants: `JWT_SECRET`, `MAX_FILE_SIZE`

### Database

- **Models**: PascalCase singular: `User`, `WorkoutLog`
- **Collections**: Lowercase plural: `users`, `workoutlogs`
- **Fields**: camelCase: `firstName`, `createdAt`

### Routes

- **Kebab-case** for URLs: `/api/v1/workout-logs`, `/api/v1/meal-plans`
- **Plural** for collections: `/users`, `/workouts`
- **Singular** for single resources: `/users/:id`, `/profile/me`

---

## Layered Architecture

### 1. Routes Layer

**Responsibility**: Define endpoints and apply route-level middleware

```javascript
const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../../../common/middleware/auth');
const { validate } = require('../../../common/validators/common.validators');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
```

**Rules**:
- Import controller methods
- Apply validation and authentication middleware
- NO business logic
- Export router

### 2. Controllers Layer

**Responsibility**: Handle HTTP requests and responses

```javascript
const authService = require('../services/auth.service');
const { successResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');

class AuthController {
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return successResponse(res, result, 'Login successful');
  });
}

module.exports = new AuthController();
```

**Rules**:
- Extract data from `req` (body, params, query)
- Call service methods
- Return formatted responses
- NO business logic
- Use `asyncHandler` for error handling

### 3. Services Layer

**Responsibility**: Implement business logic

```javascript
const userRepository = require('../repositories/user.repository');
const { UnauthorizedError } = require('../../../common/utils/errors');
const { comparePassword, generateAccessToken } = require('../../../common/utils/security');

class AuthService {
  async login(email, password) {
    const user = await userRepository.findByEmail(email, true);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await comparePassword(password, user.password);
    
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = generateAccessToken({ userId: user._id, role: user.role });

    return { user, token };
  }
}

module.exports = new AuthService();
```

**Rules**:
- Contain ALL business logic
- Call repository methods
- Throw custom errors
- Return plain data objects
- NO HTTP concepts (req, res)

### 4. Repositories Layer

**Responsibility**: Data access and database operations

```javascript
const User = require('../models/user.model');

class UserRepository {
  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  async create(userData) {
    return await User.create(userData);
  }
}

module.exports = new UserRepository();
```

**Rules**:
- Interact with database models
- NO business logic
- Return database results
- Handle queries, aggregations, transactions

### 5. Models Layer

**Responsibility**: Define database schemas

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['client', 'coach', 'admin'],
    default: 'client',
  },
}, {
  timestamps: true,
});

userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
```

**Rules**:
- Define schema structure
- Add validation rules
- Create indexes
- Define virtuals and methods

---

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ /* validation errors */ ]
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Success",
  "data": [ /* array of items */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "limit": 10,
    "total": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Response Utilities

Use helper functions from `common/utils/response.js`:

```javascript
const { successResponse, errorResponse, paginatedResponse, createdResponse } = require('../../../common/utils/response');

// Success
return successResponse(res, data, 'Success message', 200);

// Created
return createdResponse(res, data, 'Resource created');

// Paginated
return paginatedResponse(res, data, page, limit, total);
```

---

## Error Handling

### Custom Error Classes

Located in `common/utils/errors.js`:

- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `ValidationError` (422)
- `InternalServerError` (500)

### Usage

```javascript
const { NotFoundError, UnauthorizedError } = require('../../../common/utils/errors');

// Throw error
if (!user) {
  throw new NotFoundError('User');
}

if (!isAuthorized) {
  throw new UnauthorizedError('Insufficient permissions');
}
```

### Async Error Handling

Wrap all async route handlers with `asyncHandler`:

```javascript
const { asyncHandler } = require('../../../common/middleware/errorHandler');

getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return successResponse(res, user);
});
```

---

## Code Style

### General Rules

1. **Use ES6+ features**: arrow functions, destructuring, async/await
2. **Single responsibility**: Each function does one thing
3. **DRY**: Don't repeat yourself
4. **Meaningful names**: Self-documenting code
5. **Comments**: Explain WHY, not WHAT

### Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: Max 100 characters
- **Trailing commas**: Use them

### Example

```javascript
/**
 * Create a new workout program
 * @param {String} coachId - Coach user ID
 * @param {Object} programData - Program details
 * @returns {Object} Created program
 */
async createProgram(coachId, programData) {
  const program = await programRepository.create({
    coachId,
    ...programData,
  });

  logger.info(`Program created: ${program._id}`);

  return program;
}
```

---

## Best Practices

### Security

1. **Never expose sensitive data** in responses (passwords, tokens)
2. **Validate all inputs** using Joi schemas
3. **Use parameterized queries** (Mongoose handles this)
4. **Implement rate limiting** on all routes
5. **Hash passwords** with bcrypt (12+ rounds)
6. **Use JWT** for authentication
7. **Implement CORS** properly

### Performance

1. **Use indexes** on frequently queried fields
2. **Paginate** large result sets
3. **Minimize database queries** (use populate wisely)
4. **Cache** when appropriate
5. **Compress** responses
6. **Log efficiently** (avoid logging in loops)

### Database

1. **Define indexes** in schemas
2. **Use transactions** for multi-document operations
3. **Validate at schema level** when possible
4. **Use virtuals** for computed fields
5. **Populate selectively** to avoid over-fetching

### Testing

1. **Write unit tests** for services
2. **Write integration tests** for routes
3. **Mock external services**
4. **Test error cases**
5. **Aim for 80%+ coverage**

### Logging

```javascript
const logger = require('../../../common/utils/logger');

// Log levels: error, warn, info, debug
logger.info('User logged in', { userId, email });
logger.error('Database connection failed', error);
```

### Environment Variables

1. **Never commit** `.env` files
2. **Use** `.env.example` for documentation
3. **Access via** `config` module
4. **Validate** required variables at startup

---

## Module Creation Checklist

When creating a new module, ensure:

- [ ] Model with proper validation and indexes
- [ ] Repository with CRUD operations
- [ ] Service with business logic
- [ ] Controller with request handlers
- [ ] Routes with proper middleware
- [ ] Validation schemas (if needed)
- [ ] Error handling with custom errors
- [ ] Consistent response format
- [ ] Documentation comments
- [ ] Export from routes

---

## Git Commit Messages

Use conventional commits:

```
feat: add user authentication
fix: resolve password reset bug
docs: update API documentation
refactor: simplify workout service
test: add tests for nutrition module
chore: update dependencies
```

---

## Summary

**Remember the flow:**

```
HTTP Request
    ↓
Route (validation, auth)
    ↓
Controller (extract data, call service)
    ↓
Service (business logic, validation)
    ↓
Repository (database operations)
    ↓
Model (schema, validation)
    ↓
Database
    ↓
[Return up the chain]
    ↓
HTTP Response (formatted)
```

**Key Principles:**
1. **Separation of Concerns**: Each layer has a specific purpose
2. **Consistency**: Follow the same patterns across all modules
3. **Readability**: Code should be self-documenting
4. **Security**: Never trust user input
5. **Performance**: Optimize database queries and responses

---

*For questions or clarifications, please reach out to the development team.*

