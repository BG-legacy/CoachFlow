# AI Program Generation - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Configure OpenAI API Key

Add to your `.env` file:

```bash
# Required for AI features
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4
ENABLE_AI_FEATURES=true

# Optional tuning
OPENAI_MAX_TOKENS=3000
OPENAI_TEMPERATURE=0.7
```

Get your API key from: https://platform.openai.com/api-keys

### 2. Start the Server

```bash
cd backend
npm install  # If you haven't already
npm run dev
```

### 3. Test the Feature

#### Check Status
```bash
curl http://localhost:5000/api/v1/ai-programs/status \
  -H "Authorization: Bearer YOUR_COACH_TOKEN"
```

Expected response:
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

#### Generate a Complete Program
```bash
curl -X POST http://localhost:5000/api/v1/ai-programs/generate/complete \
  -H "Authorization: Bearer YOUR_COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "CLIENT_ID_HERE",
    "duration": 12,
    "goals": ["muscle_gain", "strength"],
    "additionalRequirements": "Focus on compound movements"
  }'
```

This will:
1. Fetch the client's profile
2. Generate a personalized 12-week workout program
3. Generate a matching nutrition plan
4. Return the generated content with reasoning

### 4. Review and Apply

#### Review the Generated Program
```bash
curl -X PATCH http://localhost:5000/api/v1/ai-programs/PROGRAM_ID/review \
  -H "Authorization: Bearer YOUR_COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reviewNotes": "Looks great!",
    "quality": {
      "coachRating": 5,
      "wasUseful": true
    }
  }'
```

#### Apply to Client
```bash
curl -X POST http://localhost:5000/api/v1/ai-programs/PROGRAM_ID/apply \
  -H "Authorization: Bearer YOUR_COACH_TOKEN"
```

This creates actual `Program` and `MealPlan` documents assigned to the client.

### 5. View All Generated Programs
```bash
curl http://localhost:5000/api/v1/ai-programs \
  -H "Authorization: Bearer YOUR_COACH_TOKEN"
```

Optional filters:
- `?clientId=xxx` - Filter by client
- `?status=generated` - Filter by status
- `?generationType=workout_only` - Filter by type
- `?limit=20` - Limit results

## 📚 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/ai-programs/status` | Check AI availability |
| POST | `/ai-programs/generate/complete` | Generate workout + nutrition |
| POST | `/ai-programs/generate/workout` | Generate workout only |
| POST | `/ai-programs/generate/nutrition` | Generate nutrition only |
| GET | `/ai-programs` | List all generated programs |
| GET | `/ai-programs/:id` | Get single program |
| PATCH | `/ai-programs/:id/review` | Review/approve program |
| POST | `/ai-programs/:id/apply` | Apply to client |
| DELETE | `/ai-programs/:id` | Archive program |

## 🎯 Common Use Cases

### Use Case 1: New Client Onboarding
```javascript
// After client completes onboarding
const program = await fetch('/api/v1/ai-programs/generate/complete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${coachToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    clientId: newClient.id,
    duration: 12,
  })
});

// Review in UI, then apply
await fetch(`/api/v1/ai-programs/${program.id}/apply`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${coachToken}` }
});
```

### Use Case 2: Quick Workout Plan
```javascript
// Generate just a workout program
const workout = await fetch('/api/v1/ai-programs/generate/workout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${coachToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    clientId: client.id,
    duration: 8,
    additionalRequirements: 'Focus on core and upper body',
  })
});
```

### Use Case 3: Nutrition Plan Update
```javascript
// Generate new nutrition plan
const nutrition = await fetch('/api/v1/ai-programs/generate/nutrition', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${coachToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    clientId: client.id,
    duration: 4,
    goals: ['weight_loss'],
  })
});
```

## 🔧 Troubleshooting

### "AI program generation is not available"
- Check `OPENAI_API_KEY` is set in `.env`
- Check `ENABLE_AI_FEATURES=true`
- Restart the server

### "Client profile not found"
- Ensure client has completed onboarding
- Check client exists in database
- Verify `clientId` is correct

### High Costs
- Use `gpt-3.5-turbo` instead of `gpt-4` in `.env`
- Reduce `OPENAI_MAX_TOKENS`
- Monitor usage in AIRequest collection

### Poor Quality Programs
- Ensure client profile is complete (all fields filled)
- Use `gpt-4` for better quality
- Add more specific `additionalRequirements`
- Review and provide feedback via quality ratings

## 💰 Cost Estimates

| Model | Cost per Program | Quality | Speed |
|-------|-----------------|---------|-------|
| gpt-3.5-turbo | $0.01-0.02 | Good | Fast |
| gpt-4-turbo | $0.05-0.15 | Excellent | Fast |
| gpt-4 | $0.15-0.30 | Excellent | Slower |

## 📊 Monitor Usage

Query the AIRequest collection:
```javascript
// Get cost stats for last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const stats = await AIRequest.getCostStats(
  thirtyDaysAgo,
  new Date(),
  'openai'
);
```

## 🔐 Security Notes

- Client data is sent to OpenAI (review their privacy policy)
- Only coaches can generate programs
- Coaches can only access their own generated programs
- All requests are logged and tracked
- Consider implementing additional rate limits

## 📖 Full Documentation

- **Complete Guide**: [AI_PROGRAM_GENERATION.md](./AI_PROGRAM_GENERATION.md)
- **Module README**: [../src/modules/ai-programs/README.md](../src/modules/ai-programs/README.md)
- **API Docs**: http://localhost:5000/api/docs (when server is running)

## 🧪 Testing

Run tests:
```bash
# All tests
npm test

# AI-specific tests
npm test tests/ai-program-generation.test.js

# Or use the script
./tests/run-ai-tests.sh
```

Note: Some tests require actual OpenAI API key and are skipped by default.

## 🎓 Next Steps

1. ✅ Configure OpenAI API key
2. ✅ Test status endpoint
3. ✅ Generate your first program
4. ✅ Review and apply it
5. ⭐ Collect feedback from coaches
6. ⭐ Monitor costs and usage
7. ⭐ Fine-tune prompts based on feedback

## 💡 Tips

- **Start with GPT-3.5-Turbo** for testing (much cheaper)
- **Always review** before applying to clients
- **Use specific requirements** for better results
- **Provide feedback** to improve future generations
- **Monitor costs** regularly
- **Cache programs** to avoid regenerating similar ones

---

**Need Help?** Check the [full documentation](./AI_PROGRAM_GENERATION.md) or contact the development team.

