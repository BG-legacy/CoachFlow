# Workout Logging for AI-Generated Programs

## Overview

This module provides comprehensive workout logging functionality for AI-generated programs, including:
- **Mark workout complete** - Complete full workout sessions with all exercises
- **Set-by-set logging** - Progressive logging as you complete each set (optional MVP)
- **Compliance metrics** - Track adherence, progression, and RPE targets

## Features

### 1. Workout Session Management
- Start a workout session (creates draft log)
- Log individual sets progressively
- Complete workout with full details
- Update and delete workout logs

### 2. Set-by-Set Logging (Progressive)
- Log sets as you complete them
- Track RPE (Rate of Perceived Exertion) per set
- Record weight, reps, duration for each set
- Add notes to individual sets
- Automatic metric calculations

### 3. Compliance & Adherence Tracking
- Calculate adherence rate vs expected workouts
- Track current and longest workout streaks
- Compare actual RPE vs program targets
- Weekly and overall adherence metrics
- Performance insights and recommendations

### 4. Progression Analysis
- Volume trend analysis
- RPE trend analysis
- Exercise-specific progression tracking
- Deload recommendations based on progression engine rules
- Progression score calculation

## API Endpoints

### Start Workout Session
```http
POST /api/v1/ai-programs/:programId/workouts/start
```

**Request Body:**
```json
{
  "workoutIndex": 0,
  "workoutName": "Upper Body Strength",
  "date": "2025-12-24T10:00:00Z"
}
```

**Response:**
```json
{
  "workoutLog": {
    "_id": "...",
    "userId": "...",
    "programId": "...",
    "exercises": [
      {
        "exerciseId": "bench_press_001",
        "name": "Bench Press",
        "sets": [],
        "targetSets": 3,
        "targetReps": "5",
        "targetWeight": 100
      }
    ],
    "completed": false
  },
  "targetWorkout": { /* workout details from program */ }
}
```

---

### Log Individual Set (Set-by-Set)
```http
POST /api/v1/ai-programs/workout-logs/:logId/sets
```

**Request Body:**
```json
{
  "exerciseIndex": 0,
  "setNumber": 1,
  "reps": 5,
  "weight": 100,
  "duration": 30,
  "rpe": 7.5,
  "notes": "Felt strong"
}
```

**Response:**
```json
{
  "workoutLog": {
    "_id": "...",
    "exercises": [
      {
        "name": "Bench Press",
        "sets": [
          {
            "setNumber": 1,
            "reps": 5,
            "weight": 100,
            "rpe": 7.5,
            "completed": true,
            "notes": "Felt strong"
          }
        ],
        "averageRPE": 7.5
      }
    ],
    "totalVolume": 500,
    "averageRPE": 7.5
  }
}
```

---

### Mark Workout Complete
```http
POST /api/v1/ai-programs/:programId/workouts/complete
```

**Request Body:**
```json
{
  "workoutIndex": 0,
  "workoutName": "Upper Body Strength",
  "duration": 60,
  "exercises": [
    {
      "exerciseId": "bench_press_001",
      "name": "Bench Press",
      "sets": [
        { "setNumber": 1, "reps": 5, "weight": 100, "rpe": 7 },
        { "setNumber": 2, "reps": 5, "weight": 100, "rpe": 7.5 },
        { "setNumber": 3, "reps": 5, "weight": 100, "rpe": 8 }
      ]
    },
    {
      "exerciseId": "row_001",
      "name": "Barbell Row",
      "sets": [
        { "setNumber": 1, "reps": 5, "weight": 80, "rpe": 7 },
        { "setNumber": 2, "reps": 5, "weight": 80, "rpe": 7.5 },
        { "setNumber": 3, "reps": 5, "weight": 80, "rpe": 8 }
      ]
    }
  ],
  "rating": 4,
  "difficulty": "just_right",
  "notes": "Great workout!",
  "mood": "energized",
  "date": "2025-12-24T10:00:00Z"
}
```

**Response:**
```json
{
  "workoutLog": {
    "_id": "...",
    "completed": true,
    "totalVolume": 1400,
    "averageRPE": 7.5,
    "duration": 60,
    "rating": 4
  },
  "complianceMetrics": {
    "adherence": {
      "expectedWorkouts": 9,
      "completedWorkouts": 8,
      "adherenceRate": 88.9,
      "status": "excellent"
    },
    "performance": {
      "averageRPE": 7.5,
      "averageRating": 4.2,
      "totalVolume": 12500
    },
    "streaks": {
      "currentStreak": 3,
      "longestStreak": 7
    }
  },
  "progressionInsights": {
    "currentWeek": 3,
    "targetRPE": 7.5,
    "actualRPE": 7.5,
    "difference": 0,
    "insight": "RPE on target",
    "recommendation": "Keep up the great work!"
  }
}
```

---

### Get Workout Logs
```http
GET /api/v1/ai-programs/:programId/workout-logs?limit=20&skip=0&sortBy=-date
```

**Response:**
```json
[
  {
    "_id": "...",
    "date": "2025-12-24T10:00:00Z",
    "duration": 60,
    "completed": true,
    "totalVolume": 1400,
    "averageRPE": 7.5,
    "rating": 4,
    "exercises": [...]
  }
]
```

---

### Get Compliance Metrics
```http
GET /api/v1/ai-programs/:programId/compliance
```

**Response:**
```json
{
  "program": {
    "id": "...",
    "name": "12-Week Strength Program",
    "startDate": "2025-10-01T00:00:00Z",
    "duration": { "weeks": 12, "workoutsPerWeek": 3 }
  },
  "adherence": {
    "expectedWorkouts": 27,
    "completedWorkouts": 24,
    "adherenceRate": 88.9,
    "thisWeekWorkouts": 3,
    "thisWeekAdherence": 100,
    "status": "excellent"
  },
  "performance": {
    "averageRPE": 7.8,
    "averageRating": 4.3,
    "totalVolume": 35000,
    "rpeComparison": {
      "adherenceRate": 92.5,
      "averageDifference": 0.3,
      "recentComparisons": [...]
    }
  },
  "streaks": {
    "currentStreak": 5,
    "longestStreak": 9
  },
  "recentWorkouts": [...],
  "insights": [
    {
      "type": "positive",
      "category": "adherence",
      "message": "Excellent adherence at 89%! Keep it up!"
    },
    {
      "type": "positive",
      "category": "consistency",
      "message": "Amazing 5-workout streak! 🔥"
    }
  ]
}
```

---

### Get Progression Insights
```http
GET /api/v1/ai-programs/:programId/progression
```

**Response:**
```json
{
  "hasEnoughData": true,
  "volumeTrend": {
    "current": 1500,
    "average": 1400,
    "trend": "increasing",
    "percentChange": 7.1,
    "dataPoints": [...]
  },
  "rpeTrend": {
    "current": 7.8,
    "average": 7.5,
    "recentAverage": 7.7,
    "trend": "stable",
    "dataPoints": [...]
  },
  "exerciseProgression": [
    {
      "exercise": "Bench Press",
      "sessions": 12,
      "startWeight": 80,
      "currentWeight": 100,
      "weightIncrease": 20,
      "weightPercentChange": 25,
      "trend": "improving",
      "history": [...]
    }
  ],
  "deloadRecommendation": {
    "needsDeload": false,
    "triggers": [],
    "scheduledDeload": null,
    "recommendation": "No deload needed at this time"
  },
  "progressionScore": 85,
  "recommendations": [
    {
      "priority": "low",
      "category": "progress",
      "message": "Excellent progress! Volume is increasing while maintaining RPE. Keep it up!"
    }
  ]
}
```

---

### Update Workout Log
```http
PATCH /api/v1/ai-programs/workout-logs/:logId
```

**Request Body:**
```json
{
  "rating": 5,
  "difficulty": "just_right",
  "notes": "Updated notes",
  "completed": true
}
```

---

### Delete Workout Log
```http
DELETE /api/v1/ai-programs/workout-logs/:logId
```

---

## Usage Examples

### Example 1: Progressive Set-by-Set Logging

```javascript
// 1. Start workout session
const session = await fetch('/api/v1/ai-programs/123/workouts/start', {
  method: 'POST',
  body: JSON.stringify({
    workoutIndex: 0,
    workoutName: 'Upper Body Day'
  })
});

const { workoutLog } = await session.json();
const logId = workoutLog._id;

// 2. Log sets as you complete them
await fetch(`/api/v1/ai-programs/workout-logs/${logId}/sets`, {
  method: 'POST',
  body: JSON.stringify({
    exerciseIndex: 0,
    setNumber: 1,
    reps: 5,
    weight: 100,
    rpe: 7
  })
});

// Log set 2
await fetch(`/api/v1/ai-programs/workout-logs/${logId}/sets`, {
  method: 'POST',
  body: JSON.stringify({
    exerciseIndex: 0,
    setNumber: 2,
    reps: 5,
    weight: 100,
    rpe: 7.5
  })
});

// 3. Complete workout
await fetch(`/api/v1/ai-programs/workout-logs/${logId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    completed: true,
    rating: 4,
    difficulty: 'just_right'
  })
});
```

### Example 2: Complete Workout in One Request

```javascript
const result = await fetch('/api/v1/ai-programs/123/workouts/complete', {
  method: 'POST',
  body: JSON.stringify({
    workoutIndex: 0,
    duration: 60,
    exercises: [
      {
        name: 'Bench Press',
        sets: [
          { setNumber: 1, reps: 5, weight: 100, rpe: 7 },
          { setNumber: 2, reps: 5, weight: 100, rpe: 7.5 },
          { setNumber: 3, reps: 5, weight: 100, rpe: 8 }
        ]
      }
    ],
    rating: 4,
    difficulty: 'just_right'
  })
});

const { workoutLog, complianceMetrics, progressionInsights } = await result.json();
```

### Example 3: Check Compliance

```javascript
const metrics = await fetch('/api/v1/ai-programs/123/compliance');
const data = await metrics.json();

console.log(`Adherence: ${data.adherence.adherenceRate}%`);
console.log(`Current Streak: ${data.streaks.currentStreak} workouts`);
console.log(`Status: ${data.adherence.status}`);
```

---

## RPE (Rate of Perceived Exertion) Scale

The system uses a 1-10 RPE scale:

| RPE | Description | Reps in Reserve (RIR) |
|-----|-------------|----------------------|
| 1-2 | Very easy | 8-9+ RIR |
| 3-4 | Easy | 6-7 RIR |
| 5-6 | Moderate | 4-5 RIR |
| 7 | Challenging | 3 RIR |
| 8 | Hard | 2 RIR |
| 9 | Very hard | 1 RIR |
| 10 | Maximal | 0 RIR (failure) |

---

## Compliance Metrics Explained

### Adherence Rate
- **Excellent**: ≥80%
- **Good**: 60-79%
- **Needs Improvement**: <60%

Calculated as: `(Completed Workouts / Expected Workouts) × 100`

### RPE Adherence
Compares actual RPE vs program targets:
- Tracks how closely you follow the prescribed intensity
- Helps identify if you're pushing too hard or not hard enough

### Progression Score (0-100)
Composite score based on:
- Volume trend (increasing = good)
- RPE trend (stable or decreasing while volume increases = good)
- Adherence to program

---

## Deload Recommendations

The system automatically checks for deload needs based on:

1. **Scheduled Deloads**: Pre-planned recovery weeks in the program
2. **Auto-Deload Triggers**:
   - High average RPE (sustained RPE > threshold)
   - Consecutive failed workouts
   - Poor recovery indicators

When a deload is recommended, the system provides:
- Reason for deload
- Recommended protocol (volume reduction, intensity reduction, etc.)
- Specific guidance from the progression engine

---

## Integration with Progression Engine

The workout logging system integrates with the AI program's progression engine:

- **RPE Targets**: Compares actual RPE vs weekly targets
- **Progression Rules**: Tracks if you're meeting progression conditions
- **Deload Protocol**: Automatically detects when deload is needed
- **Recovery Indicators**: Monitors fatigue and recovery

---

## Data Privacy

- All workout logs are private to the user
- Logs are linked to the user's AI-generated program
- Data retention follows the program's retention policy
- Logs can be deleted at any time

---

## Best Practices

1. **Be Honest with RPE**: Accurate RPE tracking is crucial for progression
2. **Log Consistently**: Regular logging provides better insights
3. **Review Compliance Weekly**: Check your adherence and adjust as needed
4. **Follow Deload Recommendations**: Recovery is essential for progress
5. **Track All Sets**: Complete data enables better progression analysis

---

## Future Enhancements

- [ ] Voice-based set logging
- [ ] Video form analysis integration
- [ ] Automatic weight recommendations based on RPE
- [ ] Social features (share workouts, compare with friends)
- [ ] Integration with wearables (heart rate, HRV)
- [ ] AI-powered form feedback
- [ ] Predictive deload recommendations
- [ ] Exercise substitution suggestions based on performance

---

Built with ❤️ for CoachFlow

