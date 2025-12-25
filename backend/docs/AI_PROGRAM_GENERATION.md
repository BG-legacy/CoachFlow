# AI-Assisted Program Generation

## Overview

The AI-Assisted Program Generation module enables coaches to automatically generate personalized workout programs and nutrition plans based on structured client profile data using OpenAI's GPT models.

## Features

### 1. Complete Program Generation
- **Endpoint**: `POST /api/v1/ai-programs/generate/complete`
- Generates both workout program AND nutrition plan
- Comprehensive solution for new clients
- Considers all client profile data

### 2. Workout Program Generation
- **Endpoint**: `POST /api/v1/ai-programs/generate/workout`
- Generates workout program only
- Includes exercises, sets, reps, and progression
- Respects equipment availability and limitations

### 3. Nutrition Plan Generation
- **Endpoint**: `POST /api/v1/ai-programs/generate/nutrition`
- Generates meal plan only
- Calculates macros and calorie targets
- Respects dietary restrictions and preferences

## Configuration

### Required Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4                    # or gpt-3.5-turbo, gpt-4-turbo
OPENAI_MAX_TOKENS=3000                # Maximum tokens per request
OPENAI_TEMPERATURE=0.7                # Creativity level (0.0-1.0)

# Feature Toggle
ENABLE_AI_FEATURES=true               # Enable/disable AI features
```

### Optional Configuration

The system uses sensible defaults from the main config but can be customized:

- **Model Selection**: Choose between GPT-4 (higher quality, higher cost) or GPT-3.5-Turbo (faster, lower cost)
- **Temperature**: Higher values (0.8-1.0) for more creative programs, lower values (0.5-0.7) for more consistent/safe programs
- **Max Tokens**: Adjust based on program complexity needs

## Usage

### 1. Check AI Service Status

```bash
GET /api/v1/ai-programs/status
```

**Response:**
```json
{
  "data": {
    "enabled": true,
    "service": "openai",
    "features": {
      "workoutGeneration": true,
      "nutritionGeneration": true,
      "combinedGeneration": true
    }
  }
}
```

### 2. Generate Complete Program

```bash
POST /api/v1/ai-programs/generate/complete
Authorization: Bearer <coach_token>

{
  "clientId": "64f7c8e9d4b2a1c3e5f6a7b8",
  "duration": 12,
  "goals": ["muscle_gain", "strength"],
  "additionalRequirements": "Focus on upper body development"
}
```

**Response:**
```json
{
  "data": {
    "_id": "64f7c8e9d4b2a1c3e5f6a7b9",
    "coachId": "64f7c8e9d4b2a1c3e5f6a7b0",
    "clientId": "64f7c8e9d4b2a1c3e5f6a7b8",
    "requestId": "uuid-v4",
    "generationType": "combined",
    "status": "generated",
    "generatedContent": {
      "workoutProgram": {
        "name": "12-Week Upper Body Focus Program",
        "description": "...",
        "duration": { "weeks": 12, "workoutsPerWeek": 4 },
        "workouts": [...],
        "reasoning": "..."
      },
      "nutritionPlan": {
        "name": "Muscle Gain Nutrition Plan",
        "description": "...",
        "dailyTargets": {...},
        "meals": [...],
        "reasoning": "..."
      },
      "summary": "...",
      "keyRecommendations": [...]
    },
    "aiMetadata": {
      "tokensUsed": {...},
      "estimatedCost": 0.15
    }
  }
}
```

### 3. Review Generated Program

```bash
PATCH /api/v1/ai-programs/:id/review
Authorization: Bearer <coach_token>

{
  "status": "approved",
  "reviewNotes": "Looks good, ready to apply",
  "quality": {
    "coachRating": 5,
    "wasUseful": true,
    "feedback": "Well-structured program"
  }
}
```

### 4. Apply Program to Client

```bash
POST /api/v1/ai-programs/:id/apply
Authorization: Bearer <coach_token>
```

This creates actual Program and MealPlan documents from the generated content and assigns them to the client.

### 5. List Generated Programs

```bash
GET /api/v1/ai-programs?clientId=xxx&status=generated&limit=20
Authorization: Bearer <coach_token>
```

## Input Data Structure

The AI uses structured client profile data including:

### Client Profile Data
- **Personal Info**: Age, gender, height, weight, body composition
- **Fitness Profile**: Experience level, goals, activity level, training history
- **Medical Info**: Injuries, limitations, chronic conditions, medications
- **Schedule**: Available days, preferred time, session duration, frequency
- **Equipment**: Gym access, home equipment availability
- **Preferences**: Preferred/disliked exercises, restrictions
- **Nutrition Preferences**: Diet type, restrictions, allergies, dislikes, calorie targets

### Additional Options
- **Duration**: Program length in weeks (1-52 for workouts, 1-12 for nutrition)
- **Goals**: Override profile goals if needed
- **Preferences**: Additional workout or nutrition preferences
- **Constraints**: Extra constraints beyond profile
- **Additional Requirements**: Free-text requirements

## Generated Program Structure

### Workout Program

```json
{
  "name": "Program Name",
  "description": "Program description",
  "duration": {
    "weeks": 12,
    "workoutsPerWeek": 4
  },
  "workouts": [
    {
      "name": "Upper Body Strength",
      "type": "strength",
      "difficulty": "intermediate",
      "duration": 60,
      "description": "...",
      "exercises": [
        {
          "exerciseId": "bench_press_01",
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps": "6-8",
          "restTime": 120,
          "notes": "Focus on controlled eccentric",
          "order": 1
        }
      ],
      "targetMuscles": ["chest", "triceps", "shoulders"],
      "equipment": ["barbell", "bench"]
    }
  ],
  "reasoning": "Detailed explanation of program design decisions..."
}
```

### Nutrition Plan

```json
{
  "name": "Nutrition Plan Name",
  "description": "Plan description",
  "dailyTargets": {
    "calories": 2800,
    "protein": 180,
    "carbs": 320,
    "fats": 85,
    "fiber": 35,
    "water": 3.5
  },
  "meals": [
    {
      "name": "Protein-Packed Breakfast",
      "type": "breakfast",
      "time": "08:00",
      "foods": [
        {
          "name": "Oatmeal",
          "quantity": 80,
          "unit": "g",
          "calories": 300,
          "protein": 10,
          "carbs": 54,
          "fats": 6
        }
      ],
      "totalCalories": 650,
      "totalProtein": 40,
      "totalCarbs": 70,
      "totalFats": 18,
      "instructions": "Cook oatmeal, add protein powder...",
      "prepTime": 10
    }
  ],
  "reasoning": "Explanation of nutrition strategy..."
}
```

## Workflow

### Typical Coach Workflow

1. **Client Completes Onboarding** → Client profile is fully populated
2. **Coach Requests Generation** → POST to generate endpoint with clientId
3. **AI Generates Program** → Status: `generating` → `generated`
4. **Coach Reviews** → Coach examines the generated program
5. **Coach Approves/Rejects** → PATCH /review endpoint with status
6. **Apply to Client** → POST /apply creates actual Program and MealPlan documents
7. **Client Begins Program** → Program is now active in their account

### Status Flow

```
generating → generated → reviewed → approved → applied
                      ↓
                   rejected → archived
```

## Cost Monitoring

All AI requests are tracked in the `AIRequest` collection with:
- Token usage (prompt + completion)
- Estimated cost in USD
- Performance metrics (latency, retries)
- Request/response details

### Cost Estimates (as of 2024)

| Model | Avg Tokens | Est. Cost per Program |
|-------|-----------|----------------------|
| GPT-4 | ~3000 | $0.15 - $0.30 |
| GPT-3.5-Turbo | ~3000 | $0.01 - $0.02 |

## Data Retention

- Generated programs are automatically deleted after 180 days by default
- Can be configured per-generation via `dataRetentionDays`
- TTL index automatically removes expired records
- Applied programs remain in Program/MealPlan collections indefinitely

## Security & Privacy

### Authentication
- All endpoints require coach authentication
- Coaches can only access programs they created
- Client data is access-controlled

### Data Privacy
- Client profile data is included in AI prompts
- OpenAI's data usage policies apply
- Consider data sovereignty requirements
- Can be marked with `containsPII` flag for compliance tracking

### Rate Limiting
- Standard API rate limits apply
- AI generation is resource-intensive
- Consider implementing specific rate limits for AI endpoints

## Error Handling

### Common Errors

**503 Service Unavailable**
```json
{
  "error": {
    "message": "AI program generation is not available. OpenAI API key not configured.",
    "statusCode": 503
  }
}
```

**404 Not Found**
```json
{
  "error": {
    "message": "Client profile not found",
    "statusCode": 404
  }
}
```

**500 OpenAI API Error**
```json
{
  "error": {
    "message": "OpenAI API error: Rate limit exceeded",
    "statusCode": 500
  }
}
```

## Best Practices

### For Coaches
1. **Always review generated programs** before applying
2. **Provide additional requirements** for better personalization
3. **Use the rating system** to improve future generations
4. **Monitor client feedback** on applied programs

### For Developers
1. **Set appropriate timeouts** (60s default)
2. **Implement retry logic** for transient failures
3. **Monitor token usage** to control costs
4. **Cache generated programs** to avoid re-generation
5. **Log AI request details** for debugging

## Troubleshooting

### AI Generation Fails
- Check OpenAI API key is valid
- Verify `ENABLE_AI_FEATURES=true`
- Check OpenAI account has credits
- Review error logs for API errors

### Poor Quality Programs
- Ensure client profile is complete
- Add more specific `additionalRequirements`
- Try adjusting temperature (lower = more conservative)
- Consider using GPT-4 instead of GPT-3.5

### High Costs
- Use GPT-3.5-Turbo instead of GPT-4
- Reduce `maxTokens` if responses are too long
- Implement caching for similar requests
- Add coach approval before generation

## API Reference

See Swagger documentation at `/api/docs` for complete API reference.

## Support

For issues or questions:
- Check logs in `backend/logs/`
- Review AI request tracking in database
- Contact development team with request IDs

