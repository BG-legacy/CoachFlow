# CoachFlow Backend API

A comprehensive fitness coaching platform backend built with Node.js, Express, and MongoDB.

## 🚀 Features

### Core Modules

- **Authentication & Users**: JWT-based auth, Google OAuth, account linking, user management, role-based access control
- **Client Profiles**: Detailed client info, goals, preferences, measurements tracking
- **Workouts & Programs**: Workout creation, program management, exercise logging
- **Nutrition & Meal Plans**: Meal planning, food logging, calorie tracking
- **Check-ins & Adherence**: Progress tracking, coach feedback, adherence monitoring
- **Sessions & Bookings**: Session scheduling, booking management, reminders
- **Notifications**: Multi-channel (Email/SMS/Push) notification system
- **Gamification**: XP, levels, badges, streaks, achievements, leaderboards
- **Reports**: Weekly summaries, monthly reports, analytics
- **Form Analysis**: Video upload, Python-based form analysis integration
- **Admin/Coach Dashboard**: Analytics, user management, system overview

### Technical Features

- Clean layered architecture (Routes → Controllers → Services → Repositories → Models)
- Comprehensive error handling with custom error classes
- Input validation using Joi
- Secure authentication with JWT and refresh tokens
- Google OAuth integration with automatic account linking
- Rate limiting and security middleware (Helmet, CORS)
- Structured logging with Winston
- **Enterprise-grade API standards** with consistent response envelope
- **Advanced pagination** (offset and cursor-based)
- **Powerful filtering** with 11 operators
- **Multi-field sorting** and field selection
- **Request tracing** with unique IDs
- **OpenAPI/Swagger** documentation
- **API versioning** (v1)
- MongoDB with Mongoose ODM
- File upload support for videos and images

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm >= 9.0.0

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment setup**

Initialize your configuration:

```bash
# Create .env from template
npm run config:init

# Generate secure secrets
npm run secrets:generate
```

Edit `.env` with your configuration (minimum required):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coachflow
JWT_SECRET=<paste-generated-secret>
JWT_REFRESH_SECRET=<paste-generated-secret>
SESSION_SECRET=<paste-generated-secret>
```

**📖 See [CONFIG_QUICKSTART.md](./docs/CONFIG_QUICKSTART.md) for detailed setup guide**

**📚 Full documentation: [CONFIGURATION.md](./docs/CONFIGURATION.md)**

4. **Create required directories**

```bash
mkdir -p uploads/videos logs
```

5. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── common/                    # Shared utilities
│   │   ├── config/               # Configuration
│   │   ├── database/             # DB connection
│   │   ├── middleware/           # Global middleware
│   │   ├── utils/                # Utilities
│   │   └── validators/           # Validation schemas
│   │
│   ├── modules/                   # Feature modules
│   │   ├── auth/                 # Authentication
│   │   ├── clients/              # Client profiles
│   │   ├── workouts/             # Workouts & programs
│   │   ├── nutrition/            # Nutrition plans
│   │   ├── checkins/             # Check-ins
│   │   ├── sessions/             # Bookings
│   │   ├── notifications/        # Notifications
│   │   ├── gamification/         # Gamification
│   │   ├── reports/              # Reports
│   │   ├── formAnalysis/         # Form analysis
│   │   └── admin/                # Admin panel
│   │
│   ├── app.js                    # Express app
│   └── server.js                 # Entry point
│
├── docs/                          # 📚 All documentation
│   ├── API_STANDARDS.md
│   ├── API_QUICK_REFERENCE.md
│   ├── API_IMPLEMENTATION_SUMMARY.md
│   ├── IMPLEMENTATION_EXAMPLES.md
│   ├── GOOGLE_CLOUD_SETUP_GUIDE.md
│   ├── GOOGLE_OAUTH_COMPLETE_CHECKLIST.md
│   ├── GOOGLE_OAUTH_QUICK_SETUP.md
│   ├── GOOGLE_OAUTH_IMPLEMENTATION.md
│   ├── ENV_TEMPLATE.md
│   ├── CONFIGURATION.md
│   ├── CODING_STANDARDS.md
│   └── ... (38 documentation files)
├── uploads/                       # File uploads
├── logs/                          # Logs
├── package.json
├── .gitignore
└── README.md
```

## 📖 API Standards & Documentation

### 🎯 Standardized API Response

All endpoints follow a consistent response envelope:

```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-12-20T10:00:00.000Z",
  "data": {},
  "error": null,
  "meta": {
    "message": "Success",
    "pagination": {}
  }
}
```

### 📚 Documentation Resources

| Document | Description |
|----------|-------------|
| **[API_STANDARDS.md](docs/API_STANDARDS.md)** | Complete API standards and guidelines |
| **[API_QUICK_REFERENCE.md](docs/API_QUICK_REFERENCE.md)** | Quick reference for common patterns |
| **[IMPLEMENTATION_EXAMPLES.md](docs/IMPLEMENTATION_EXAMPLES.md)** | Code examples for controllers/services |
| **[API_IMPLEMENTATION_SUMMARY.md](docs/API_IMPLEMENTATION_SUMMARY.md)** | Implementation overview |
| **[Interactive Docs](http://localhost:5000/api/docs)** | Swagger/OpenAPI documentation |

### 🔧 Key Features

#### 1. Pagination
```bash
# Offset-based
GET /api/v1/workouts?page=2&limit=20

# Cursor-based
GET /api/v1/workouts?cursor=xyz123&limit=20
```

#### 2. Filtering
```bash
# Basic filtering
GET /api/v1/workouts?status=active&type=strength

# Advanced operators
GET /api/v1/workouts?difficulty[gte]=3&status[in]=active,pending
```

Supported operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `like`, `exists`

#### 3. Sorting
```bash
# Single field
GET /api/v1/workouts?sort=-createdAt

# Multiple fields
GET /api/v1/workouts?sort=-priority,name:asc
```

#### 4. Field Selection
```bash
GET /api/v1/clients?fields=name,email,phone
```

#### 5. Request Tracing
Every request receives a unique ID for debugging and support:
```bash
curl -H "X-Request-ID: your-uuid" \
     -H "Authorization: Bearer token" \
     /api/v1/workouts
```

### 🚀 Interactive API Documentation

Access the interactive Swagger documentation:

```
http://localhost:5000/api/docs
```

Features:
- Try out API endpoints directly
- View request/response schemas
- Authentication support
- Examples and descriptions

### 📝 API Versioning

Current version: **v1**

All endpoints are prefixed with:
```
/api/v1/{resource}
```

## 🔑 API Endpoints

### Authentication

```
POST   /api/v1/auth/register          - Register new user
POST   /api/v1/auth/login             - Login user
POST   /api/v1/auth/refresh           - Refresh access token
POST   /api/v1/auth/forgot-password   - Request password reset
POST   /api/v1/auth/reset-password    - Reset password
GET    /api/v1/auth/me                - Get current user
PUT    /api/v1/auth/change-password   - Change password
```

### Client Profiles

```
POST   /api/v1/clients/profile        - Create profile
GET    /api/v1/clients/profile/me     - Get my profile
PUT    /api/v1/clients/profile/me     - Update my profile
GET    /api/v1/clients/profile/:id    - Get profile by ID
POST   /api/v1/clients/profile/measurements - Add measurement
GET    /api/v1/clients/profile/progress     - Get progress
```

### Workouts & Programs

```
POST   /api/v1/workouts/workouts      - Create workout
GET    /api/v1/workouts/workouts      - Get workouts
GET    /api/v1/workouts/workouts/:id  - Get workout
POST   /api/v1/workouts/programs      - Create program
GET    /api/v1/workouts/programs      - Get programs
POST   /api/v1/workouts/logs          - Log workout
GET    /api/v1/workouts/stats         - Get workout stats
```

### Nutrition

```
POST   /api/v1/nutrition/meal-plans   - Create meal plan
GET    /api/v1/nutrition/meal-plans   - Get meal plans
POST   /api/v1/nutrition/food-logs    - Log food
GET    /api/v1/nutrition/stats        - Get nutrition stats
```

### Check-ins

```
POST   /api/v1/checkins               - Create check-in
GET    /api/v1/checkins               - Get check-ins
GET    /api/v1/checkins/latest        - Get latest check-in
POST   /api/v1/checkins/:id/feedback  - Add coach feedback
```

### Sessions

```
POST   /api/v1/sessions               - Create session
GET    /api/v1/sessions               - Get sessions
GET    /api/v1/sessions/upcoming      - Get upcoming sessions
POST   /api/v1/sessions/:id/cancel    - Cancel session
```

### Gamification

```
GET    /api/v1/gamification/profile   - Get gamification profile
GET    /api/v1/gamification/leaderboard - Get leaderboard
```

### Reports

```
GET    /api/v1/reports/weekly         - Get weekly summary
GET    /api/v1/reports/monthly        - Get monthly report
GET    /api/v1/reports/coach-dashboard - Get coach dashboard
```

### Form Analysis

```
POST   /api/v1/form-analysis/upload   - Upload video for analysis
GET    /api/v1/form-analysis          - Get analyses
GET    /api/v1/form-analysis/:id      - Get analysis by ID
POST   /api/v1/form-analysis/:id/feedback - Add coach feedback
```

### Admin

```
GET    /api/v1/admin/dashboard        - Get admin dashboard
GET    /api/v1/admin/analytics        - Get system analytics
GET    /api/v1/admin/users            - Get all users
PUT    /api/v1/admin/users/role       - Update user role
PUT    /api/v1/admin/users/:id/toggle-status - Toggle user status
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login Flow

1. POST to `/api/v1/auth/login` with email and password
2. Receive `accessToken` and `refreshToken`
3. Include access token in requests:

```
Authorization: Bearer {accessToken}
```

4. Refresh token when expired using `/api/v1/auth/refresh`

### User Roles

- **client**: Regular users
- **coach**: Fitness coaches
- **admin**: System administrators

## 📝 Response Format

### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": { /* response data */ }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ /* optional validation errors */ ]
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Success",
  "data": [ /* items */ ],
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

## 🔐 Authentication

CoachFlow supports multiple authentication methods:

### Email/Password Authentication
- Standard JWT-based authentication
- Secure password hashing with bcrypt
- Refresh token rotation
- Password reset flow

### Google OAuth ✅ **CONFIGURED AND READY**
- One-click sign-in with Google
- Automatic account linking by email
- Support for multiple auth methods per account
- Seamless migration between auth types

**🎉 Google OAuth Status: READY FOR DEVELOPMENT**

**Quick Commands:**
```bash
npm run verify:google    # Verify configuration
npm run dev              # Start server with Google OAuth
npm run test:google      # Test OAuth endpoints
```

**Setup Documentation:**
- 🎯 [GOOGLE_OAUTH_READY.md](./GOOGLE_OAUTH_READY.md) - **Quick start guide (START HERE)**
- ✅ [GOOGLE_OAUTH_SETUP_STATUS.md](./docs/GOOGLE_OAUTH_SETUP_STATUS.md) - Complete setup status
- 🔍 [GOOGLE_OAUTH_VERIFICATION.md](./docs/GOOGLE_OAUTH_VERIFICATION.md) - Verification & testing
- 🚀 [GOOGLE_OAUTH_QUICK_SETUP.md](./docs/GOOGLE_OAUTH_QUICK_SETUP.md) - 5-minute quickstart guide
- ☁️ [GOOGLE_CLOUD_SETUP_GUIDE.md](./docs/GOOGLE_CLOUD_SETUP_GUIDE.md) - Complete Google Cloud Console setup
- ✅ [GOOGLE_OAUTH_COMPLETE_CHECKLIST.md](./docs/GOOGLE_OAUTH_COMPLETE_CHECKLIST.md) - Step-by-step checklist
- 📝 [GOOGLE_OAUTH_IMPLEMENTATION.md](./docs/GOOGLE_OAUTH_IMPLEMENTATION.md) - Implementation details
- 🔧 [ENV_TEMPLATE.md](./docs/ENV_TEMPLATE.md) - Environment variables reference

**Key Features:**
- ✅ Identity provider only (not a separate user type)
- ✅ One user = one account (regardless of login method)
- ✅ Automatic account linking (email/password ↔ Google)
- ✅ Link/unlink authentication methods
- ✅ Set password for OAuth-only accounts

**Available Endpoints:**
```
POST   /api/v1/auth/google           # Sign in/up with Google
POST   /api/v1/auth/google/link      # Link Google to existing account
DELETE /api/v1/auth/google/unlink    # Unlink Google account
POST   /api/v1/auth/set-password     # Add password to OAuth account
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 📚 Documentation

All comprehensive documentation is located in the `docs/` folder:

- [Database Collections](./docs/DATABASE_COLLECTIONS.md) - **Complete database schema reference (C1 minimum collections)** ⭐
- [Coding Standards](./docs/CODING_STANDARDS.md) - Detailed coding guidelines and architecture
- [Configuration Guide](./docs/CONFIGURATION.md) - Complete configuration documentation
- [API Standards](./docs/API_STANDARDS.md) - API design standards and conventions
- [Google OAuth Setup](./docs/GOOGLE_OAUTH_QUICK_SETUP.md) - 5-minute Google OAuth setup
- [Security Documentation](./docs/SECURITY_IMPLEMENTATION_SUMMARY.md) - Security features and best practices
- [Project Structure](./docs/PROJECT_STRUCTURE.md) - Detailed project organization
- And 30+ more documentation files in `docs/`

## 🛡️ Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with expiration
- Rate limiting on all endpoints
- Helmet.js for security headers
- Input validation and sanitization
- MongoDB injection prevention
- CORS configuration

## 🚦 Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- Email, SMS, Firebase configs for notifications

## 📊 Monitoring & Logging

Logs are stored in the `logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs

Log levels: error, warn, info, debug

## 🤝 Contributing

1. Follow the coding standards in `CODING_STANDARDS.md`
2. Write tests for new features
3. Update documentation
4. Use conventional commit messages

## 📄 License

MIT

## 👥 Authors

CoachFlow Development Team

## 📞 Support

For support, email support@coachflow.com or open an issue.

---

**Made with ❤️ for fitness coaches and their clients**

