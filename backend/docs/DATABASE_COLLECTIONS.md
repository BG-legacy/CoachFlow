# CoachFlow Database Collections

## C1. Minimum Required Collections ✅

This document outlines the minimum database collections required for CoachFlow's core functionality.

---

## 1. Users Collection 👤

**Model:** `User` (`src/modules/auth/models/user.model.js`)

**Purpose:** Authentication, authorization, and basic user management

### Core Fields

#### Authentication
- `email` - Unique email address (required)
- `password` - Hashed password (bcrypt, optional if OAuth)
- `authProviders[]` - Array of linked auth methods (local/google)
- `googleId` - Google OAuth ID (if applicable)
- `isEmailVerified` - Email verification status
- `passwordResetToken` - Password reset token
- `lastLogin` - Last login timestamp

#### Role-Based Access Control (RBAC)
- `role` - User role: `client`, `coach`, or `admin`
- `isActive` - Account status (active/inactive)

#### Basic Profile
- `firstName` - User's first name
- `lastName` - User's last name
- `phone` - Phone number (optional)
- `avatar` - Profile picture URL

#### Coach-Specific Fields
- `coachProfile.bio` - Coach biography
- `coachProfile.specializations[]` - Areas of expertise
- `coachProfile.certifications[]` - Professional certifications
- `coachProfile.yearsOfExperience` - Years coaching
- `coachProfile.hourlyRate` - Hourly rate

#### Preferences
- `preferences.language` - UI language
- `preferences.timezone` - User timezone
- `preferences.notifications` - Email/SMS/Push notification settings

#### Privacy & Compliance
- `consent` - Terms, privacy policy, marketing consent
- `consentHistory[]` - Audit trail of consent changes
- `deletedAt` - Soft delete timestamp
- `isDeleted` - Soft delete flag

### Key Indexes
```javascript
{ email: 1 }
{ role: 1 }
{ isActive: 1 }
{ googleId: 1 }
{ 'authProviders.provider': 1 }
```

### Example Document
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "role": "client",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg",
  "isActive": true,
  "isEmailVerified": true,
  "authProviders": [
    {
      "provider": "local",
      "linkedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "preferences": {
    "language": "en",
    "timezone": "America/New_York",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

---

## 2. Profiles Collection 📋

**Model:** `ClientProfile` (`src/modules/clients/models/clientProfile.model.js`)

**Purpose:** Detailed client fitness information, goals, injuries, preferences, and schedules

### Core Fields

#### Relationships
- `userId` - Reference to User (required, unique)
- `coachId` - Reference to assigned Coach

#### Personal Information
- `personalInfo.dateOfBirth` - Date of birth
- `personalInfo.gender` - Gender (male/female/other/prefer_not_to_say)
- `personalInfo.height` - Height in cm
- `personalInfo.weight` - Current weight in kg
- `personalInfo.bodyFatPercentage` - Body fat percentage

#### Fitness Goals 🎯
- `fitnessProfile.fitnessLevel` - beginner/intermediate/advanced/elite
- `fitnessProfile.goals[]` - Array of goals:
  - `weight_loss`
  - `muscle_gain`
  - `strength`
  - `endurance`
  - `flexibility`
  - `general_fitness`
  - `sports_performance`
- `fitnessProfile.primaryGoal` - Main goal (string)
- `fitnessProfile.targetWeight` - Target weight in kg
- `fitnessProfile.activityLevel` - Activity level enum

#### Medical & Injuries 🏥
- `medicalInfo.injuries[]` - List of current/past injuries
- `medicalInfo.conditions[]` - Medical conditions
- `medicalInfo.medications[]` - Current medications
- `medicalInfo.allergies[]` - Allergies
- `medicalInfo.restrictions[]` - Exercise restrictions
- `medicalInfo.notes` - Additional medical notes

#### Workout Preferences & Schedule 📅
- `preferences.workoutDays[]` - Preferred days (monday, tuesday, etc.)
- `preferences.workoutDuration` - Preferred workout length (minutes)
- `preferences.preferredExercises[]` - Favorite exercises
- `preferences.dislikedExercises[]` - Exercises to avoid
- `preferences.gymAccess` - Has gym access (boolean)
- `preferences.equipmentAvailable[]` - Available equipment

#### Nutrition Preferences
- `nutritionPreferences.dietType` - Diet type (vegetarian, vegan, keto, etc.)
- `nutritionPreferences.calorieTarget` - Daily calorie goal
- `nutritionPreferences.macroTargets` - Protein/carbs/fats targets
- `nutritionPreferences.mealsPerDay` - Number of meals per day
- `nutritionPreferences.restrictions[]` - Dietary restrictions
- `nutritionPreferences.dislikes[]` - Food dislikes

#### Measurements Tracking
- `measurements[]` - Array of measurement records:
  - `date` - Measurement date
  - `weight` - Weight in kg
  - `bodyFatPercentage` - Body fat %
  - `chest`, `waist`, `hips`, `biceps`, `thighs` - Body measurements
  - `notes` - Measurement notes

#### Status
- `status` - active/inactive/on_hold/completed

### Key Indexes
```javascript
{ userId: 1 }
{ coachId: 1 }
{ status: 1 }
```

### Example Document
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "coachId": "507f1f77bcf86cd799439020",
  "personalInfo": {
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "height": 180,
    "weight": 85,
    "bodyFatPercentage": 18
  },
  "fitnessProfile": {
    "fitnessLevel": "intermediate",
    "goals": ["muscle_gain", "strength"],
    "primaryGoal": "muscle_gain",
    "targetWeight": 90,
    "activityLevel": "moderately_active"
  },
  "medicalInfo": {
    "injuries": ["Previous lower back strain (2023)"],
    "conditions": [],
    "medications": [],
    "allergies": ["Latex"],
    "restrictions": ["Avoid heavy deadlifts until cleared"],
    "notes": "Cleared for exercise by physician"
  },
  "preferences": {
    "workoutDays": ["monday", "wednesday", "friday", "saturday"],
    "workoutDuration": 60,
    "preferredExercises": ["Bench Press", "Squats", "Pull-ups"],
    "dislikedExercises": ["Burpees"],
    "gymAccess": true,
    "equipmentAvailable": ["Barbell", "Dumbbells", "Bench", "Squat Rack"]
  },
  "nutritionPreferences": {
    "dietType": "none",
    "calorieTarget": 2800,
    "macroTargets": {
      "protein": 180,
      "carbs": 300,
      "fats": 80
    },
    "mealsPerDay": 4,
    "restrictions": [],
    "dislikes": ["Cottage cheese"]
  },
  "measurements": [
    {
      "date": "2025-01-01",
      "weight": 85,
      "bodyFatPercentage": 18,
      "chest": 105,
      "waist": 85,
      "hips": 100,
      "biceps": 38,
      "thighs": 60,
      "notes": "Starting measurements"
    }
  ],
  "status": "active",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

---

## 3. Workout Programs Collection 📚

**Model:** `Program` (`src/modules/workouts/models/program.model.js`)

**Purpose:** Versioned workout plans and training programs

### Core Fields

#### Ownership & Assignment
- `coachId` - Program creator (required)
- `clientId` - Assigned client (optional for templates)

#### Program Details
- `name` - Program name (required)
- `description` - Program description
- `goal` - Primary goal (weight_loss, muscle_gain, strength, etc.)
- `duration.weeks` - Program duration in weeks (required)
- `duration.workoutsPerWeek` - Frequency
- `difficulty` - beginner/intermediate/advanced

#### Workouts
- `workouts[]` - Array of Workout references (ObjectIds)

#### Template & Sharing
- `isTemplate` - Is this a reusable template? (boolean)
- `isPublic` - Is this publicly available? (boolean)

#### Versioning & Scheduling
- `startDate` - Program start date
- `endDate` - Program end date
- `status` - draft/active/completed/paused/cancelled

#### Progress Tracking
- `progress.completedWorkouts` - Number of workouts completed
- `progress.totalWorkouts` - Total workouts in program
- `progress.currentWeek` - Current week number

#### Organization
- `tags[]` - Tags for categorization

### Key Indexes
```javascript
{ coachId: 1 }
{ clientId: 1 }
{ status: 1 }
{ isTemplate: 1, isPublic: 1 }
```

### Example Document
```json
{
  "_id": "507f1f77bcf86cd799439030",
  "coachId": "507f1f77bcf86cd799439020",
  "clientId": "507f1f77bcf86cd799439011",
  "name": "12-Week Muscle Building Program",
  "description": "Progressive overload program focused on hypertrophy",
  "goal": "muscle_gain",
  "duration": {
    "weeks": 12,
    "workoutsPerWeek": 4
  },
  "difficulty": "intermediate",
  "workouts": [
    "507f1f77bcf86cd799439031",
    "507f1f77bcf86cd799439032",
    "507f1f77bcf86cd799439033",
    "507f1f77bcf86cd799439034"
  ],
  "isTemplate": false,
  "isPublic": false,
  "startDate": "2025-01-01",
  "endDate": "2025-03-24",
  "status": "active",
  "progress": {
    "completedWorkouts": 8,
    "totalWorkouts": 48,
    "currentWeek": 3
  },
  "tags": ["hypertrophy", "4-day-split", "intermediate"],
  "createdAt": "2024-12-15T00:00:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

---

## 4. Workout Logs Collection 📝

**Model:** `WorkoutLog` (`src/modules/workouts/models/workoutLog.model.js`)

**Purpose:** Track completed workout performance with sets, reps, weight, and RPE

### Core Fields

#### Relationships
- `userId` - User who completed the workout (required)
- `workoutId` - Reference to Workout template (required)
- `programId` - Reference to Program (optional)

#### Session Info
- `date` - Workout date (defaults to now)
- `duration` - Actual workout duration (minutes)
- `completed` - Was workout completed? (boolean)

#### Exercise Performance 💪
- `exercises[]` - Array of exercise logs:
  - `exerciseId` - Exercise identifier
  - `name` - Exercise name
  - `sets[]` - Array of set performance:
    - `setNumber` - Set number (1, 2, 3...)
    - `reps` - Actual reps completed
    - `weight` - Weight used (kg)
    - `duration` - Set duration (seconds, for timed exercises)
    - **`rpe`** - **Rate of Perceived Exertion (1-10)** ⭐
    - `completed` - Set completed? (boolean)
    - `notes` - Set-specific notes
  - `targetSets` - Planned number of sets
  - `targetReps` - Planned reps (string: "10", "8-12", "AMRAP")
  - `targetWeight` - Planned weight
  - **`averageRPE`** - **Average RPE across all sets** ⭐

#### Performance Metrics
- `totalVolume` - Total weight lifted (sets × reps × weight)
- `caloriesBurned` - Estimated calories burned
- `averageHeartRate` - Average heart rate (if tracked)

#### Subjective Feedback
- `rating` - Workout rating (1-5 stars)
- `difficulty` - too_easy/just_right/too_hard
- `mood` - How the user felt
- `notes` - General workout notes

### Key Indexes
```javascript
{ userId: 1 }
{ workoutId: 1 }
{ programId: 1 }
{ date: -1 }
```

### Example Document
```json
{
  "_id": "507f1f77bcf86cd799439040",
  "userId": "507f1f77bcf86cd799439011",
  "workoutId": "507f1f77bcf86cd799439031",
  "programId": "507f1f77bcf86cd799439030",
  "date": "2025-01-15T09:00:00.000Z",
  "duration": 65,
  "exercises": [
    {
      "exerciseId": "ex_bench_press",
      "name": "Barbell Bench Press",
      "sets": [
        {
          "setNumber": 1,
          "reps": 10,
          "weight": 80,
          "rpe": 7,
          "completed": true,
          "notes": "Felt strong"
        },
        {
          "setNumber": 2,
          "reps": 9,
          "weight": 80,
          "rpe": 8,
          "completed": true,
          "notes": "Last rep was tough"
        },
        {
          "setNumber": 3,
          "reps": 8,
          "weight": 80,
          "rpe": 9,
          "completed": true,
          "notes": "Close to failure"
        }
      ],
      "targetSets": 3,
      "targetReps": "8-10",
      "targetWeight": 80,
      "averageRPE": 8
    },
    {
      "exerciseId": "ex_incline_db_press",
      "name": "Incline Dumbbell Press",
      "sets": [
        {
          "setNumber": 1,
          "reps": 12,
          "weight": 30,
          "rpe": 7,
          "completed": true
        },
        {
          "setNumber": 2,
          "reps": 11,
          "weight": 30,
          "rpe": 8,
          "completed": true
        },
        {
          "setNumber": 3,
          "reps": 10,
          "weight": 30,
          "rpe": 8,
          "completed": true
        }
      ],
      "targetSets": 3,
      "targetReps": "10-12",
      "targetWeight": 30,
      "averageRPE": 7.67
    }
  ],
  "totalVolume": 3330,
  "caloriesBurned": 350,
  "averageHeartRate": 125,
  "rating": 5,
  "difficulty": "just_right",
  "mood": "energized",
  "notes": "Great session! Added 2.5kg to bench press",
  "completed": true,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

---

## Supporting Collections

### 5. Workouts (Templates)
**Model:** `Workout` (`src/modules/workouts/models/workout.model.js`)
- Individual workout templates that are used in programs
- Contains exercise definitions with target sets/reps/weight

### 6. Token Blacklist
**Model:** `TokenBlacklist` (`src/modules/auth/models/tokenBlacklist.model.js`)
- Tracks invalidated JWT tokens (logout, security)

### 7. Check-ins
**Model:** `Checkin` (`src/modules/checkins/models/checkin.model.js`)
- Weekly client check-ins with progress photos and feedback

### 8. Sessions
**Model:** `Session` (`src/modules/sessions/models/session.model.js`)
- Coaching session bookings and scheduling

### 9. Nutrition
**Models:**
- `MealPlan` (`src/modules/nutrition/models/mealPlan.model.js`)
- `FoodLog` (`src/modules/nutrition/models/foodLog.model.js`)

### 10. Gamification
**Model:** `GamificationProfile` (`src/modules/gamification/models/gamification.model.js`)
- XP, levels, badges, streaks, achievements

### 11. Form Analysis
**Model:** `FormAnalysis` (`src/modules/formAnalysis/models/formAnalysis.model.js`)
- Video-based exercise form analysis

---

## Collection Relationships

```
User (1) ─────┬─────> (1) ClientProfile
              │
              ├─────> (many) Programs (as coach)
              │
              ├─────> (many) Programs (as client)
              │
              ├─────> (many) Workouts (as coach)
              │
              └─────> (many) WorkoutLogs

Program (1) ──────> (many) Workouts

Workout (1) ──────> (many) WorkoutLogs

ClientProfile (1) ─> (many) Measurements
```

---

## Database Configuration

**Connection:** MongoDB with Mongoose ODM  
**Location:** `src/common/database/db.js`  
**Connection String:** Set via `MONGODB_URI` environment variable

### Recommended MongoDB Settings
```javascript
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}
```

---

## Indexing Strategy

### Performance Indexes
All collections include standard indexes on:
- Primary keys (`_id`)
- Foreign keys (references to other collections)
- Query-heavy fields (status, date ranges)
- Frequently filtered fields (role, isActive, etc.)

### Text Search Indexes
Consider adding text indexes for:
- Workout/Program names
- Exercise names
- User names (firstName, lastName)

---

## Data Validation

All models use:
- **Mongoose schema validation** for data types and required fields
- **Joi validation** at the API layer for request validation
- **Custom validation middleware** for complex business logic

---

## Best Practices

### 1. Always Use References
Don't duplicate user data across collections - use ObjectId references and populate when needed.

### 2. Track History with Arrays
Use embedded arrays (like `measurements[]`, `sets[]`) for historical data.

### 3. Soft Deletes
Use `isDeleted` and `deletedAt` for users and important data.

### 4. Timestamps
All collections have `createdAt` and `updatedAt` (via `timestamps: true`).

### 5. Indexes
Add indexes on frequently queried fields to improve performance.

---

## RPE (Rate of Perceived Exertion) Guide

RPE is tracked per set in workout logs using a 1-10 scale:

| RPE | Description | Reps in Reserve (RIR) |
|-----|-------------|----------------------|
| 10  | Maximum effort | 0 (failure) |
| 9   | Very hard | 1 rep left |
| 8   | Hard | 2 reps left |
| 7   | Moderately hard | 3 reps left |
| 6   | Somewhat hard | 4+ reps left |
| 5   | Moderate | Many reps left |
| 1-4 | Easy | Very easy |

**Usage:**
- Helps track training intensity
- Enables auto-regulation (adjust weight based on RPE)
- Tracks fatigue and recovery
- Essential for progressive overload planning

---

## Migration Notes

### Recent Updates
- ✅ **2025-01-15:** Added RPE tracking to workout logs
  - Added `rpe` field to each set (1-10 scale)
  - Added `averageRPE` to exercise logs
  - Enables better intensity tracking and progressive overload

### Future Enhancements
- Add versioning to Programs (track program changes over time)
- Add exercise library collection (standardized exercise database)
- Add workout template variants (deload weeks, progression schemes)

---

## Quick Reference

| Collection | Primary Use | Key Fields |
|------------|-------------|------------|
| **Users** | Auth & roles | email, password, role, authProviders |
| **ClientProfiles** | Goals & preferences | goals, injuries, workoutDays, preferences |
| **Programs** | Workout plans | name, duration, workouts[], status, progress |
| **WorkoutLogs** | Performance tracking | exercises[], sets[], reps, weight, **RPE** |

---

**Status:** ✅ All C1 minimum collections implemented and documented  
**Last Updated:** December 21, 2025  
**Version:** 1.0




