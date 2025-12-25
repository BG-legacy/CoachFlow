# 🚀 Quick Setup: Enable AI Features

## Current Status
❌ AI features are **disabled** - OpenAI API key not configured

## ✅ Steps to Enable

### 1. Get Your OpenAI API Key

**Option A: Free Trial (Good for Testing)**
- Visit: https://platform.openai.com/signup
- Sign up for a free account
- Get $5 in free credits (good for ~200-500 generations)
- Go to: https://platform.openai.com/api-keys
- Click "Create new secret key"
- Copy the key (starts with `sk-`)

**Option B: Paid Account (For Production)**
- Same as above, but add payment method
- Much higher rate limits
- Pay as you go

### 2. Add to Your `.env` File

Open `/Users/bernardginnjr./Desktop/Bernard Ginn JR. Presonal Folder/CoachFlow/backend/.env`

Add these lines:

```bash
# ================================
# AI Features Configuration
# ================================

# Your OpenAI API Key (REQUIRED)
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Model to use (choose one based on budget/quality needs)
OPENAI_MODEL=gpt-3.5-turbo          # Cheaper, good quality ($0.01-0.02 per program)
# OPENAI_MODEL=gpt-4-turbo          # Better, moderate cost ($0.05-0.15 per program)
# OPENAI_MODEL=gpt-4                # Best quality, expensive ($0.15-0.30 per program)

# Generation parameters
OPENAI_MAX_TOKENS=3000              # Maximum response length
OPENAI_TEMPERATURE=0.7              # Creativity (0.0-1.0, 0.7 is balanced)

# Enable the feature
ENABLE_AI_FEATURES=true
```

### 3. Restart Your Server

Stop the current server (Ctrl+C in terminal) and restart:

```bash
npm run dev
```

### 4. Test It

Run the demo script again:

```bash
node examples/ai-program-generation-demo.js
```

You should now see:
```
✅ AI features enabled
```

---

## 💰 Cost Estimates

### Free Trial ($5 credit)
- **gpt-3.5-turbo**: ~250-500 complete programs
- **gpt-4-turbo**: ~30-100 complete programs  
- **gpt-4**: ~15-30 complete programs

### Per Program Cost

| Model | Workout Only | Nutrition Only | Complete Program |
|-------|--------------|----------------|------------------|
| gpt-3.5-turbo | $0.005-0.01 | $0.005-0.01 | $0.01-0.02 |
| gpt-4-turbo | $0.02-0.05 | $0.02-0.05 | $0.05-0.15 |
| gpt-4 | $0.08-0.15 | $0.08-0.15 | $0.15-0.30 |

**Recommendation for Testing**: Start with `gpt-3.5-turbo` to save costs!

---

## 🔍 Troubleshooting

### "Invalid API Key"
- Make sure you copied the entire key (starts with `sk-`)
- Check for extra spaces or quotes
- Generate a new key if needed

### "Rate Limit Exceeded"
- Free tier has lower limits
- Wait a few seconds between generations
- Upgrade to paid tier for higher limits

### "Quota Exceeded"
- Free trial credits ran out
- Add payment method to OpenAI account
- Check usage at: https://platform.openai.com/usage

### Still Not Working?
```bash
# Check if environment variable is loaded
node -e "require('dotenv').config(); console.log('API Key:', process.env.OPENAI_API_KEY ? 'SET ✅' : 'NOT SET ❌')"
```

---

## ✅ What Fixed

### Mongoose Duplicate Index Warnings
✅ Removed duplicate indexes from `GeneratedProgram` model:
- Removed `index: true` from `coachId`, `clientId`, `status` (already in compound indexes)
- Removed duplicate `scheduledDeletionDate` index (kept only TTL version)

These warnings should no longer appear on next restart.

---

## 🎯 Next Steps

Once AI features are enabled:

1. **Test with demo script**: `node examples/ai-program-generation-demo.js`
2. **Try REST API**: See `docs/AI_PROGRAM_GENERATION_QUICKSTART.md`
3. **Monitor costs**: Check OpenAI usage dashboard
4. **Integrate frontend**: Use the API endpoints

---

## 📖 Documentation

- **Quick Start**: `docs/AI_PROGRAM_GENERATION_QUICKSTART.md`
- **Complete Guide**: `docs/AI_PROGRAM_GENERATION.md`
- **API Reference**: http://localhost:5001/api/docs (when server running)

---

## 💡 Tips

- **Start with gpt-3.5-turbo** for testing (much cheaper!)
- **Monitor your costs** at https://platform.openai.com/usage
- **Set usage limits** in OpenAI dashboard to avoid surprises
- **Provide detailed requirements** for better AI results
- **Review programs** before applying to clients

---

## ⚠️ Security Reminder

- **Never commit** your `.env` file to git (already in .gitignore)
- **Never share** your API key publicly
- **Rotate keys** if accidentally exposed
- **Set spending limits** in OpenAI dashboard

---

**Need help?** Check the troubleshooting section or review the documentation.

🎉 **Ready to generate your first AI-powered program!**

