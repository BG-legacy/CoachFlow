# CoachFlow Backend - Quick Start Guide

## Prerequisites Check

Before you begin, ensure you have:

- ✅ Node.js v18+ (`node --version`)
- ✅ MongoDB installed and running (`mongod --version`)
- ✅ npm v9+ (`npm --version`)

## 5-Minute Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
# Minimum required: MONGODB_URI and JWT_SECRET
```

**Quick .env setup:**

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coachflow
JWT_SECRET=your_super_secret_key_here_change_in_production
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Create Required Directories

```bash
mkdir -p uploads/videos logs
```

### Step 4: Start MongoDB

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

**Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 5: Start the Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:

```
╔═══════════════════════════════════════════════════════╗
║   🚀 CoachFlow API Server Running                    ║
║   Environment: development                            ║
║   Port: 5000                                          ║
╚═══════════════════════════════════════════════════════╝
```

## Verify Installation

### Check Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Test User Registration

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User",
    "role": "client"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

## Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Solution:**
- Ensure MongoDB is running: `mongosh` or `mongo`
- Check MONGODB_URI in .env
- Verify MongoDB port (default: 27017)

### Issue: Port Already in Use

**Solution:**
- Change PORT in .env to another port (e.g., 5001)
- Or kill the process using the port:
  ```bash
  # Find process
  lsof -i :5000
  # Kill process
  kill -9 <PID>
  ```

### Issue: Cannot find module

**Solution:**
- Delete node_modules and package-lock.json
- Run `npm install` again

### Issue: Permission Denied (uploads/logs)

**Solution:**
```bash
chmod -R 755 uploads logs
```

## Development Workflow

### 1. Create a New Feature

```bash
# Start development server
npm run dev

# Make changes - server auto-reloads
# Test your changes
```

### 2. Run Linter

```bash
npm run lint

# Auto-fix issues
npm run lint:fix
```

### 3. Run Tests

```bash
npm test
```

## API Testing Tools

### Using Postman

1. Import the API collection (if available)
2. Set base URL: `http://localhost:5000/api/v1`
3. Add Authorization header: `Bearer {token}`

### Using cURL

```bash
# Get auth token first
TOKEN=$(curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}' \
  | jq -r '.data.accessToken')

# Use token in requests
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Using HTTPie (Recommended)

```bash
# Install HTTPie
brew install httpie  # macOS
# or
pip install httpie   # Python

# Login
http POST :5000/api/v1/auth/login email=test@example.com password=Test1234!

# Authenticated request
http :5000/api/v1/auth/me "Authorization: Bearer $TOKEN"
```

## Database Management

### MongoDB Shell

```bash
# Connect to database
mongosh coachflow

# View collections
show collections

# Query users
db.users.find().pretty()

# Count documents
db.users.countDocuments()

# Drop database (careful!)
db.dropDatabase()
```

### MongoDB Compass

Download MongoDB Compass (GUI) from mongodb.com
Connection string: `mongodb://localhost:27017/coachflow`

## Environment Variables Guide

### Required Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/coachflow

# Authentication
JWT_SECRET=your_secret_here
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Optional Variables (for full functionality)

```env
# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Python Analysis Service
PYTHON_ANALYSIS_SERVICE_URL=http://localhost:8000/analyze
PYTHON_ANALYSIS_API_KEY=your_api_key
```

## Module Overview

Each module follows the same structure:

```
module/
├── models/          # Database schemas
├── repositories/    # Data access layer
├── services/        # Business logic
├── controllers/     # Request handlers
└── routes/          # API routes
```

**Available Modules:**
- `auth` - Authentication & Users
- `clients` - Client Profiles
- `workouts` - Workouts & Programs
- `nutrition` - Meal Plans & Food Logs
- `checkins` - Progress Check-ins
- `sessions` - Session Bookings
- `notifications` - Email/SMS/Push
- `gamification` - XP & Badges
- `reports` - Analytics & Reports
- `formAnalysis` - Video Analysis
- `admin` - Admin Dashboard

## Next Steps

1. **Read Documentation**
   - [README.md](./README.md) - Full documentation
   - [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Coding guidelines

2. **Explore API**
   - Test all endpoints with Postman/cURL
   - Check response formats
   - Understand authentication flow

3. **Customize**
   - Modify models as needed
   - Add custom validation
   - Extend services

4. **Deploy**
   - Set up production database
   - Configure environment variables
   - Use PM2 or Docker for deployment

## Useful Commands

```bash
# Development
npm run dev              # Start with hot reload

# Production
npm start               # Start server

# Testing
npm test                # Run tests
npm test -- --coverage  # With coverage

# Linting
npm run lint            # Check code style
npm run lint:fix        # Auto-fix issues

# Database
mongosh coachflow       # Open MongoDB shell
```

## Support

- 📧 Email: support@coachflow.com
- 📚 Documentation: [README.md](./README.md)
- 🐛 Issues: GitHub Issues
- 💬 Discord: [Join our community]

## Quick Reference

### Default Credentials (After Seeding)

```
Admin:
Email: admin@coachflow.com
Password: Admin1234!

Coach:
Email: coach@coachflow.com
Password: Coach1234!

Client:
Email: client@coachflow.com
Password: Client1234!
```

### Base URLs

- Development: `http://localhost:5000`
- API Base: `http://localhost:5000/api/v1`
- Health Check: `http://localhost:5000/health`

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

---

**🎉 You're all set! Happy coding!**

