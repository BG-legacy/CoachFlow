# AI-Assisted Program Generation Module

## Overview

This module provides AI-powered generation of personalized workout programs and nutrition plans based on structured client profile data using OpenAI's GPT models.

**NEW:** Now includes **versioned artifacts** and **template reuse** system to prevent random regeneration and create a reusable program library.

## Directory Structure

```
ai-programs/
├── controllers/
│   └── programGenerator.controller.js    # HTTP request handlers
├── services/
│   ├── openai.service.js                 # OpenAI API integration
│   └── programGenerator.service.js       # Core generation logic
├── models/
│   └── generatedProgram.model.js         # Generated program schema
├── validators/
│   └── programGenerator.validators.js    # Request validation
├── routes/
│   └── programGenerator.routes.js        # API routes
└── README.md                              # This file
```

## Features

### 1. **Complete Program Generation**
- Generates both workout program AND nutrition plan
- Uses comprehensive client profile data
- Considers goals, experience, equipment, limitations, and preferences
- **NEW:** Auto-saves as reusable template

### 2. **Workout Program Generation**
- Generates standalone workout programs
- Includes exercise selection, sets, reps, rest times
- Progressive overload built-in
- Respects equipment availability

### 3. **Nutrition Plan Generation**
- Generates standalone meal plans
- Calculates TDEE and adjusts for goals
- Respects dietary restrictions and allergies
- Provides macro-balanced meals

### 4. **Workout Logging & Tracking (NEW)**
- **Mark workout complete** - Complete full workout sessions
- **Set-by-set logging** - Progressive logging as you complete each set
- **Compliance metrics** - Track adherence, streaks, and RPE targets
- **Progression analysis** - Volume trends, RPE trends, exercise progression
- **Deload recommendations** - Automatic recovery week suggestions
- See [WORKOUT_LOGGING_README.md](./WORKOUT_LOGGING_README.md) for details

### 5. **Versioned Templates**
- Programs stored as immutable, versioned artifacts
- Content and input fingerprinting for deduplication
- Automatic template matching before generation
- 60-80% cost savings through reuse
- Full version history and rollback

### 6. **Template Library**
- Search templates by characteristics
- Private, organization, and public templates
- Rating and feedback system
- Usage analytics
- Featured templates

### 7. **Smart Reuse**
- Automatic template lookup before AI generation
- Exact and similar matching
- Customization options (duration, equipment, macros)
- Instant program delivery (no AI call)

### 8. **Review & Approval Workflow**
- Coaches review generated programs before applying
- Rating and feedback system
- Modification tracking
- Quality metrics

### 9. **Cost & Usage Tracking**
- All AI requests tracked in AIRequest model
- Token usage and cost estimation
- Performance metrics
- Template usage analytics (NEW)

## API Endpoints

### Program Generation (9 endpoints)

All program generation endpoints remain the same.

---

### Workout Logging (10 NEW endpoints)

#### Start Workout Session
```
POST /api/v1/ai-programs/:programId/workouts/start
Body: { workoutIndex, workoutName?, date? }
```
Start a workout session (creates draft log for progressive logging).

#### Mark Workout Complete
```
POST /api/v1/ai-programs/:programId/workouts/complete
Body: { workoutIndex, exercises[], duration?, rating?, difficulty?, notes?, mood?, date? }
```
Complete a full workout with all exercises and sets.

#### Log Individual Set
```
POST /api/v1/ai-programs/workout-logs/:logId/sets
Body: { exerciseIndex, setNumber, reps?, weight?, duration?, rpe?, notes? }
```
Log a single set (set-by-set progressive logging).

#### Get Workout Logs
```
GET /api/v1/ai-programs/:programId/workout-logs?limit=20&skip=0&sortBy=-date
```
Get all workout logs for a program.

#### Get Single Workout Log
```
GET /api/v1/ai-programs/workout-logs/:logId
```
Get details of a specific workout log.

#### Update Workout Log
```
PATCH /api/v1/ai-programs/workout-logs/:logId
Body: { duration?, rating?, difficulty?, notes?, mood?, completed?, exercises? }
```
Update a workout log.

#### Delete Workout Log
```
DELETE /api/v1/ai-programs/workout-logs/:logId
```
Delete a workout log.

#### Get Compliance Metrics
```
GET /api/v1/ai-programs/:programId/compliance
```
Get adherence, streaks, and compliance metrics for a program.

#### Get Progression Insights
```
GET /api/v1/ai-programs/:programId/progression
```
Get volume trends, RPE trends, exercise progression, and deload recommendations.

---

### Program Generation (9 endpoints)

#### Status Check
```
GET /api/v1/ai-programs/status
```
Check if AI features are enabled and available.

### Generate Complete Program
```
POST /api/v1/ai-programs/generate/complete
Body: { clientId, duration?, goals?, preferences?, constraints?, additionalRequirements? }
```

### Generate Workout Program
```
POST /api/v1/ai-programs/generate/workout
Body: { clientId, duration?, goals?, preferences?, constraints?, additionalRequirements? }
```

### Generate Nutrition Plan
```
POST /api/v1/ai-programs/generate/nutrition
Body: { clientId, duration?, goals?, preferences?, constraints?, additionalRequirements? }
```

### List Generated Programs
```
GET /api/v1/ai-programs?clientId=xxx&status=xxx&generationType=xxx&limit=xxx
```

### Get Single Program
```
GET /api/v1/ai-programs/:id
```

### Review Program
```
PATCH /api/v1/ai-programs/:id/review
Body: { status, reviewNotes, quality }
```

### Apply Program to Client
```
POST /api/v1/ai-programs/:id/apply
```
Creates actual Program and MealPlan documents from generated content.

### Archive Program
```
DELETE /api/v1/ai-programs/:id
```

---

### Template Management (9 NEW endpoints)

#### Find Matching Template
```
POST /api/v1/ai-programs/templates/find-match
Body: { clientId, goals?, duration?, allowSimilar? }
```
Check for existing template before generating.

#### Search Templates
```
GET /api/v1/ai-programs/templates?experienceLevel=xxx&goals=xxx&sortBy=rating
```
Search and filter templates.

#### Get Featured Templates
```
GET /api/v1/ai-programs/templates/featured?limit=10
```
Get popular/featured templates.

#### Create Template from Generated
```
POST /api/v1/ai-programs/templates/from-generated/:id
Body: { name, description, visibility, tags }
```
Convert generated program to reusable template.

#### Get Template with History
```
GET /api/v1/ai-programs/templates/:templateId
```
Get template details and version history.

#### Apply Template to Client
```
POST /api/v1/ai-programs/templates/:templateId/apply
Body: { clientId, customizations? }
```
Use template with optional customizations.

#### Create New Version
```
POST /api/v1/ai-programs/templates/:templateId/version
Body: { updates }
```
Create new version of template.

#### Rate Template
```
POST /api/v1/ai-programs/templates/:templateId/rate
Body: { rating, feedback? }
```
Rate and provide feedback on template.

#### Archive Old Versions
```
POST /api/v1/ai-programs/templates/:templateId/archive-old
Body: { keepVersions? }
```
Cleanup old template versions.

## Models

### GeneratedProgram
Tracks AI-generated programs with:
- Input data (client profile, goals, requirements)
- Generated content (workouts, meals, reasoning)
- AI metadata (tokens, cost, model used)
- Status workflow (generating → generated → reviewed → approved → applied)
- Quality ratings and feedback
- Data retention and scheduled deletion

## Services

### OpenAIService
- Handles direct communication with OpenAI API
- Manages request/response lifecycle
- Tracks usage and costs
- Implements error handling and retries
- Parses JSON from completions

### ProgramGeneratorService
- Orchestrates program generation
- Builds prompts from client data
- Processes AI responses
- Creates Program and MealPlan documents
- Manages generated program lifecycle

## Configuration

Required environment variables:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=3000
OPENAI_TEMPERATURE=0.7
ENABLE_AI_FEATURES=true
```

## Usage Example

```javascript
// In your code
const programGeneratorService = require('./services/programGenerator.service');

// Generate complete program
const result = await programGeneratorService.generateCompleteProgram(
  coachId,
  clientId,
  {
    duration: 12,
    goals: ['muscle_gain', 'strength'],
    additionalRequirements: 'Focus on upper body',
  }
);

// Review
await programGeneratorService.updateGeneratedProgram(result._id, {
  status: 'approved',
  reviewedBy: coachId,
  quality: { coachRating: 5, wasUseful: true },
});

// Apply to client
const applied = await programGeneratorService.applyGeneratedProgram(
  result._id,
  coachId
);

console.log('Program created:', applied.program._id);
console.log('Meal plan created:', applied.mealPlan._id);
```

## Testing

Run AI program generation tests:
```bash
npm test tests/ai-program-generation.test.js
# or
./tests/run-ai-tests.sh
```

Note: Some tests are skipped by default as they require actual OpenAI API calls. To run full integration tests:
1. Set `OPENAI_API_KEY` in test environment
2. Remove `.skip` from test cases
3. Be aware of API costs

## Prompt Engineering

### Workout Prompts
The workout generation prompt includes:
- Client experience level and goals
- Available equipment and gym access
- Schedule (days, duration, frequency)
- Medical considerations (injuries, limitations)
- Additional requirements from coach

The AI is instructed to:
- Follow progressive overload principles
- Balance muscle groups
- Respect limitations
- Provide exercise form cues
- Explain reasoning

### Nutrition Prompts
The nutrition generation prompt includes:
- Calculated TDEE and adjusted calories
- Macro targets based on goals
- Diet type and restrictions
- Allergies and dislikes
- Meal frequency preferences

The AI is instructed to:
- Meet calorie and macro targets
- Provide practical, sustainable meals
- Include variety
- Respect all restrictions
- Explain reasoning

## Cost Considerations

| Model | Avg Cost per Generation | Quality | Speed |
|-------|------------------------|---------|-------|
| GPT-4 | $0.15 - $0.30 | Excellent | Slower |
| GPT-4-Turbo | $0.05 - $0.15 | Excellent | Fast |
| GPT-3.5-Turbo | $0.01 - $0.02 | Good | Very Fast |

Recommendations:
- Use GPT-4 for initial program generation (higher quality)
- Use GPT-3.5-Turbo for quick iterations or regenerations
- Monitor costs via AIRequest collection
- Set appropriate rate limits per coach

## Data Privacy

⚠️ **Important**: Client profile data is sent to OpenAI as part of prompts.

- Review OpenAI's data usage policies
- Consider data sovereignty requirements
- Mark sensitive data with `containsPII` flag
- Implement data retention policies
- Obtain client consent for AI features

## Error Handling

Common errors and solutions:

**OpenAI API Key Not Configured**
```
Status: 503
Solution: Set OPENAI_API_KEY environment variable
```

**Rate Limit Exceeded**
```
Status: 500
Solution: Wait and retry, or upgrade OpenAI plan
```

**Client Profile Not Found**
```
Status: 404
Solution: Ensure client has completed onboarding
```

**Insufficient Client Data**
```
Status: 500
Solution: Ensure client profile is complete with all required fields
```

## Future Enhancements

Potential improvements:
- [ ] Program variation generation (create multiple options)
- [ ] Exercise substitution suggestions
- [ ] Program progression tracking
- [ ] A/B testing of prompts
- [ ] Fine-tuned model for coaching domain
- [ ] Multi-language support
- [ ] Voice-to-program generation
- [ ] Image-based meal plan generation
- [ ] Integration with wearable data

## Contributing

When adding features:
1. Follow existing code structure
2. Add comprehensive tests
3. Update Swagger documentation
4. Consider cost implications
5. Update this README

## Support

For issues:
- Check logs in `backend/logs/`
- Review AIRequest collection for API errors
- Check OpenAI status page
- Contact development team with request IDs

---

Built with ❤️ for CoachFlow

