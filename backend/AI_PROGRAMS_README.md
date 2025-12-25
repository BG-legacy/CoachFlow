# 🤖 AI-Assisted Program Generation for CoachFlow

## Overview

A complete, production-ready AI-powered program generation system that enables coaches to automatically create personalized workout programs and nutrition plans from structured client profile data using OpenAI's GPT models.

---

## 🎯 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Add to your `.env` file:
```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4
ENABLE_AI_FEATURES=true
```

### 3. Start Server
```bash
npm run dev
```

### 4. Test It
```bash
# Check status
curl http://localhost:5000/api/v1/ai-programs/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or run the demo
node examples/ai-program-generation-demo.js
```

**📖 See [Quick Start Guide](docs/AI_PROGRAM_GENERATION_QUICKSTART.md) for detailed instructions.**

---

## 📦 What's Included

### Core Features
✅ **Complete Program Generation** - Workout + Nutrition in one request  
✅ **Workout Programs** - Personalized training plans with exercises, sets, reps  
✅ **Nutrition Plans** - Macro-balanced meal plans with recipes  
✅ **Review Workflow** - Approve/reject before applying to clients  
✅ **Cost Tracking** - Monitor token usage and costs  
✅ **Data Retention** - Auto-cleanup after configurable period  
✅ **Quality Ratings** - Feedback system for continuous improvement  

### API Endpoints (9 total)
- `GET /api/v1/ai-programs/status` - Check availability
- `POST /api/v1/ai-programs/generate/complete` - Generate full program
- `POST /api/v1/ai-programs/generate/workout` - Workout only
- `POST /api/v1/ai-programs/generate/nutrition` - Nutrition only
- `GET /api/v1/ai-programs` - List programs (with filters)
- `GET /api/v1/ai-programs/:id` - Get single program
- `PATCH /api/v1/ai-programs/:id/review` - Review/approve
- `POST /api/v1/ai-programs/:id/apply` - Apply to client
- `DELETE /api/v1/ai-programs/:id` - Archive program

---

## 📁 File Structure

```
backend/
├── src/modules/ai-programs/          # Main module
│   ├── controllers/                   # HTTP handlers
│   ├── services/                      # Business logic
│   │   ├── openai.service.js         # OpenAI integration
│   │   └── programGenerator.service.js # Generation logic
│   ├── models/                        # Database schemas
│   ├── validators/                    # Request validation
│   ├── routes/                        # API routes
│   └── README.md                      # Module documentation
│
├── docs/                              # Documentation
│   ├── AI_PROGRAM_GENERATION.md      # Complete guide
│   └── AI_PROGRAM_GENERATION_QUICKSTART.md
│
├── tests/                             # Test suite
│   ├── ai-program-generation.test.js # Comprehensive tests
│   └── run-ai-tests.sh               # Test runner
│
├── examples/                          # Example code
│   └── ai-program-generation-demo.js # Working demo
│
└── AI_PROGRAM_GENERATION_SUMMARY.md  # Implementation summary
```

**Total: ~3,900 lines** of production code, tests, and documentation

---

## 🔧 Configuration

### Environment Variables

#### Required
```env
OPENAI_API_KEY=sk-...           # Get from https://platform.openai.com
ENABLE_AI_FEATURES=true         # Enable AI functionality
```

#### Optional (with defaults)
```env
OPENAI_MODEL=gpt-4              # or gpt-3.5-turbo, gpt-4-turbo
OPENAI_MAX_TOKENS=3000          # Max tokens per request
OPENAI_TEMPERATURE=0.7          # Creativity (0.0-1.0)
```

### Cost Estimates

| Model | Cost per Program | Quality | Speed |
|-------|-----------------|---------|-------|
| gpt-3.5-turbo | $0.01-0.02 | Good | ⚡ Fast |
| gpt-4-turbo | $0.05-0.15 | Excellent | ⚡ Fast |
| gpt-4 | $0.15-0.30 | Excellent | 🐢 Slower |

---

## 💡 Usage Examples

### Example 1: Complete Program
```javascript
const programGeneratorService = require('./services/programGenerator.service');

const program = await programGeneratorService.generateCompleteProgram(
  coachId,
  clientId,
  {
    duration: 12,
    goals: ['muscle_gain'],
    additionalRequirements: 'Focus on compound movements',
  }
);

// Review and approve
await programGeneratorService.updateGeneratedProgram(program._id, {
  status: 'approved',
  reviewedBy: coachId,
});

// Apply to client
const result = await programGeneratorService.applyGeneratedProgram(
  program._id,
  coachId
);
```

### Example 2: REST API
```bash
# Generate
curl -X POST http://localhost:5000/api/v1/ai-programs/generate/complete \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "CLIENT_ID",
    "duration": 12,
    "additionalRequirements": "Upper body focus"
  }'

# Review
curl -X PATCH http://localhost:5000/api/v1/ai-programs/PROGRAM_ID/review \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status": "approved", "quality": {"coachRating": 5}}'

# Apply
curl -X POST http://localhost:5000/api/v1/ai-programs/PROGRAM_ID/apply \
  -H "Authorization: Bearer TOKEN"
```

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run AI-Specific Tests
```bash
npm test tests/ai-program-generation.test.js
# or
./tests/run-ai-tests.sh
```

### Run Demo Script
```bash
node examples/ai-program-generation-demo.js
```

**Note:** Some tests require an OpenAI API key and are skipped by default to avoid costs.

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Coach Requests Generation                                │
│    POST /api/v1/ai-programs/generate/complete              │
│    { clientId, duration, goals, requirements }              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Fetch Client Profile                                     │
│    - Personal info (age, gender, weight, height)           │
│    - Fitness profile (experience, goals, activity)         │
│    - Medical info (injuries, limitations)                  │
│    - Schedule (days, times, duration)                      │
│    - Equipment (gym access, home equipment)                │
│    - Nutrition prefs (diet, restrictions, allergies)       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Build AI Prompts                                         │
│    - Workout prompt with all client data                   │
│    - Nutrition prompt with calculated TDEE & macros        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Call OpenAI API                                          │
│    - Generate workout program (exercises, sets, reps)      │
│    - Generate nutrition plan (meals, macros, recipes)      │
│    - Track usage, cost, performance in AIRequest           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Save as GeneratedProgram                                 │
│    - Status: "generated"                                    │
│    - Input data, generated content, AI metadata            │
│    - Return to coach for review                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Coach Reviews in UI                                      │
│    - Examines workouts and meals                           │
│    - Checks reasoning and recommendations                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Coach Approves                                           │
│    PATCH /api/v1/ai-programs/:id/review                    │
│    { status: "approved", quality: { coachRating: 5 } }     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Coach Applies to Client                                  │
│    POST /api/v1/ai-programs/:id/apply                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Create Actual Documents                                  │
│    - Program document (with Workout sub-documents)         │
│    - MealPlan document                                      │
│    - Assign to client                                       │
│    - Update GeneratedProgram status: "applied"             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. Client Starts Program! 🎉                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Privacy

### Authentication
- ✅ All endpoints require coach authentication
- ✅ Coaches only access their own generated programs
- ✅ Authorization checks on every request

### Data Privacy
- ⚠️ Client data is sent to OpenAI (review their privacy policy)
- ✅ Track with `containsPII` flag for compliance
- ✅ Auto-delete after retention period (default: 180 days)
- ✅ Configurable data retention per generation

### Rate Limiting
- ✅ Compatible with existing rate limiting
- 💡 Consider additional limits for AI endpoints (resource-intensive)

---

## 📖 Documentation

### For Developers
- **[Complete Guide](docs/AI_PROGRAM_GENERATION.md)** - Everything you need to know
- **[Module README](src/modules/ai-programs/README.md)** - Technical details
- **[Summary](AI_PROGRAM_GENERATION_SUMMARY.md)** - Implementation overview

### For Users
- **[Quick Start](docs/AI_PROGRAM_GENERATION_QUICKSTART.md)** - Get started in 5 minutes
- **[API Docs](http://localhost:5000/api/docs)** - Swagger/OpenAPI (when server running)

### Examples
- **[Demo Script](examples/ai-program-generation-demo.js)** - Working examples

---

## 🐛 Troubleshooting

### "AI program generation is not available"
**Cause:** OpenAI not configured  
**Fix:** Set `OPENAI_API_KEY` in `.env` and restart server

### "Client profile not found"
**Cause:** Client hasn't completed onboarding  
**Fix:** Ensure client profile exists with all required fields

### High costs
**Cause:** Using expensive model (GPT-4)  
**Fix:** Switch to `gpt-3.5-turbo` in `.env` for testing

### Poor quality programs
**Cause:** Incomplete client profile or unsuitable model  
**Fix:** 
- Ensure client profile is complete
- Use GPT-4 for best quality
- Add specific `additionalRequirements`

---

## ✅ Quality Checklist

- ✅ No linter errors
- ✅ Comprehensive test coverage (25+ tests)
- ✅ Full documentation (3 guides + API docs)
- ✅ Working demo script
- ✅ Production-ready error handling
- ✅ Security best practices
- ✅ Cost monitoring and control
- ✅ Data retention policies
- ✅ Follows CoachFlow architecture
- ✅ Swagger/OpenAPI documentation

---

## 🚀 Next Steps

1. ✅ **Setup**: Configure `OPENAI_API_KEY`
2. ✅ **Test**: Run `node examples/ai-program-generation-demo.js`
3. ✅ **Integrate**: Use REST API in your frontend
4. 📊 **Monitor**: Track costs via AIRequest collection
5. 📈 **Improve**: Collect feedback and refine prompts
6. 🎉 **Launch**: Enable for your coaches!

---

## 🤝 Support

**Need help?**
- 📖 Check [documentation](docs/)
- 🐛 Review logs in `backend/logs/`
- 💬 Contact development team with request IDs
- 🔍 Check AIRequest collection for API errors

---

## 📊 Stats

- **Total Files**: 13 files created
- **Lines of Code**: ~3,900 lines
- **Test Cases**: 25+ comprehensive tests
- **API Endpoints**: 9 RESTful endpoints
- **Documentation Pages**: 3 detailed guides
- **Models**: 1 new (GeneratedProgram)
- **Services**: 2 new (OpenAI, ProgramGenerator)
- **Coverage**: Models, Services, Controllers, Validators, Routes, Tests, Docs

---

## 🎉 Success!

The AI-Assisted Program Generation module is **complete and production-ready**. 

Coaches can now generate personalized workout programs and nutrition plans in seconds, with full tracking, cost monitoring, and quality controls.

**Built with ❤️ for CoachFlow**

---

*Last Updated: December 2025*

