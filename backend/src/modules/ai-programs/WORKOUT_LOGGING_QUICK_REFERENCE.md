# Workout Logging Quick Reference

## 🎯 Three Ways to Log Workouts

### 1. Progressive Set-by-Set Logging (Recommended for Live Workouts)

```javascript
// Step 1: Start session
POST /api/v1/ai-programs/:programId/workouts/start
{
  "workoutIndex": 0,
  "workoutName": "Upper Body"
}
// Returns: { workoutLog: { _id: "logId", ... } }

// Step 2: Log each set as you complete it
POST /api/v1/ai-programs/workout-logs/:logId/sets
{
  "exerciseIndex": 0,
  "setNumber": 1,
  "reps": 5,
  "weight": 100,
  "rpe": 7
}

// Step 3: Mark complete when done
PATCH /api/v1/ai-programs/workout-logs/:logId
{
  "completed": true,
  "rating": 4,
  "difficulty": "just_right"
}
```

### 2. Complete Workout in One Request (Recommended for Post-Workout Logging)

```javascript
POST /api/v1/ai-programs/:programId/workouts/complete
{
  "workoutIndex": 0,
  "duration": 60,
  "exercises": [
    {
      "name": "Bench Press",
      "sets": [
        { "setNumber": 1, "reps": 5, "weight": 100, "rpe": 7 },
        { "setNumber": 2, "reps": 5, "weight": 100, "rpe": 7.5 },
        { "setNumber": 3, "reps": 5, "weight": 100, "rpe": 8 }
      ]
    }
  ],
  "rating": 4,
  "difficulty": "just_right"
}
```

### 3. Update Existing Log

```javascript
PATCH /api/v1/ai-programs/workout-logs/:logId
{
  "rating": 5,
  "notes": "Updated notes",
  "exercises": [/* updated exercises */]
}
```

---

## 📊 Get Metrics

### Compliance Metrics
```javascript
GET /api/v1/ai-programs/:programId/compliance

// Returns:
{
  "adherence": {
    "adherenceRate": 88.9,
    "status": "excellent",
    "currentStreak": 5
  },
  "performance": {
    "averageRPE": 7.5,
    "totalVolume": 35000
  }
}
```

### Progression Insights
```javascript
GET /api/v1/ai-programs/:programId/progression

// Returns:
{
  "volumeTrend": { "trend": "increasing", "percentChange": 7.1 },
  "rpeTrend": { "trend": "stable" },
  "exerciseProgression": [/* top exercises */],
  "deloadRecommendation": { "needsDeload": false },
  "progressionScore": 85
}
```

### Workout History
```javascript
GET /api/v1/ai-programs/:programId/workout-logs?limit=20&sortBy=-date
```

---

## 📝 Data Structure

### Exercise Set Object
```javascript
{
  "setNumber": 1,           // Required: 1, 2, 3...
  "reps": 5,                // Optional: number of reps
  "weight": 100,            // Optional: weight in kg
  "duration": 30,           // Optional: duration in seconds
  "rpe": 7.5,               // Optional: 1-10 scale
  "completed": true,        // Optional: default true
  "notes": "Felt good"      // Optional: set notes
}
```

### Exercise Object
```javascript
{
  "exerciseId": "bench_001", // Optional: exercise ID from program
  "name": "Bench Press",     // Required: exercise name
  "sets": [/* set objects */] // Required: array of sets
}
```

### Workout Completion Object
```javascript
{
  "workoutIndex": 0,              // Required: index in program
  "workoutName": "Upper Body",    // Optional: workout name
  "duration": 60,                 // Optional: duration in minutes
  "exercises": [/* exercises */], // Required: array of exercises
  "rating": 4,                    // Optional: 1-5
  "difficulty": "just_right",     // Optional: too_easy/just_right/too_hard
  "notes": "Great workout!",      // Optional: notes
  "mood": "energized",            // Optional: mood
  "date": "2025-12-24T10:00:00Z" // Optional: workout date
}
```

---

## 🎯 RPE Scale Reference

| RPE | Description | Reps in Reserve |
|-----|-------------|-----------------|
| 1-2 | Very easy | 8-9+ RIR |
| 3-4 | Easy | 6-7 RIR |
| 5-6 | Moderate | 4-5 RIR |
| 7 | Challenging | 3 RIR |
| 8 | Hard | 2 RIR |
| 9 | Very hard | 1 RIR |
| 10 | Maximal | 0 RIR |

---

## ✅ Adherence Status

- **Excellent**: ≥80% adherence
- **Good**: 60-79% adherence
- **Needs Improvement**: <60% adherence

---

## 🔥 Common Use Cases

### Track a Live Workout
1. Start session → Get `logId`
2. Log each set as you complete it
3. Mark complete when done

### Log a Past Workout
1. Use complete workout endpoint
2. Include all exercises and sets
3. Get compliance metrics in response

### Check Your Progress
1. Get compliance metrics for adherence
2. Get progression insights for trends
3. Review deload recommendations

### Update Workout Rating
1. Use PATCH on workout log
2. Update rating, difficulty, or notes

---

## 🚀 Pro Tips

1. **Always include RPE** - Critical for progression tracking
2. **Log consistently** - Better data = better insights
3. **Review compliance weekly** - Stay on track
4. **Follow deload recommendations** - Recovery is key
5. **Track all sets** - Complete data enables better analysis

---

## 📱 Mobile App Integration

### Recommended Flow
```
1. User opens workout
   → Call: POST /workouts/start
   → Store logId locally

2. User completes each set
   → Call: POST /workout-logs/:logId/sets
   → Update UI with metrics

3. User finishes workout
   → Call: PATCH /workout-logs/:logId
   → Show compliance metrics
   → Show progression insights

4. User views progress
   → Call: GET /compliance
   → Call: GET /progression
   → Display charts and insights
```

---

## 🔧 Error Handling

### Common Errors

**404 - Program Not Found**
```json
{ "error": "Generated program not found" }
```
→ Verify programId is correct

**403 - Unauthorized**
```json
{ "error": "Unauthorized: Program does not belong to this user" }
```
→ User doesn't have access to this program

**400 - Validation Error**
```json
{ "error": "Validation failed", "details": [...] }
```
→ Check request body format

---

## 📚 Related Documentation

- [Full Workout Logging Documentation](./WORKOUT_LOGGING_README.md)
- [AI Programs README](./README.md)
- [Progression Engine Demo](../../examples/progression-engine-demo.js)
- [Workout Logging Demo](../../examples/workout-logging-demo.js)

---

Built with ❤️ for CoachFlow

