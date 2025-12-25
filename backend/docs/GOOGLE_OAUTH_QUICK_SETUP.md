# Google OAuth - 5 Minute Quick Setup

Complete Google Cloud OAuth setup in 5 minutes.

---

## Step 1: Google Cloud Console (2 minutes)

1. **Go to:** https://console.cloud.google.com/
2. **Create project:** Click "NEW PROJECT" → Name: `CoachFlow` → CREATE
3. **Create OAuth credentials:**
   - Go to: **APIs & Services** → **Credentials**
   - Click: **CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
   - First time? Configure consent screen:
     - User Type: **External**
     - App name: `CoachFlow`
     - Support email: [Your email]
     - Scopes: Add `openid`, `email`, `profile`
     - Save & Continue through all steps
   - Back to Create OAuth Client ID:
     - Application type: **Web application**
     - Name: `CoachFlow Web Client`
     - **Authorized JavaScript origins:**
       ```
       http://localhost:3000
       https://yourdomain.com
       ```
     - **Authorized redirect URIs:**
       ```
       http://localhost:3000
       http://localhost:3000/auth/callback
       http://localhost:5000/api/v1/auth/google/callback
       https://yourdomain.com
       https://yourdomain.com/auth/callback
       https://api.yourdomain.com/api/v1/auth/google/callback
       ```
     - Click **CREATE**
4. **Copy credentials:**
   - Client ID: `123...abc.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxx...`

---

## Step 2: Backend Configuration (1 minute)

1. **Create `.env` file** in `backend/` directory
2. **Add these lines:**

```env
# Google OAuth
GOOGLE_CLIENT_ID=paste_your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
ENABLE_GOOGLE_AUTH=true

# Required basics (if not already set)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coachflow
JWT_SECRET=your_jwt_secret_min_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_min_32_characters
SESSION_SECRET=your_session_secret
```

3. **Generate secrets** (if needed):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Step 3: Test (2 minutes)

1. **Start server:**
```bash
cd backend
npm run dev
```

2. **Look for:**
```
✅ Google OAuth enabled
   Client ID: 123456789-abc...
```

3. **Test endpoint:**
```bash
curl http://localhost:5000/api/v1/auth/google
```

Should return: Available endpoints info (not an error)

---

## ✅ Done!

Your Google OAuth is now configured. 

**Next steps:**
- Integrate Google Sign-In button on frontend
- See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for React integration example

---

## Quick Troubleshooting

**"redirect_uri_mismatch"**
- Add the exact redirect URI to Google Console → Credentials → Edit OAuth client
- Must match exactly (including http/https, port, path)

**"Invalid Google token"**
- Ensure `GOOGLE_CLIENT_ID` in `.env` matches the one you created
- Get fresh token (Google tokens expire after 1 hour)

**Server won't start**
- Verify all required environment variables are set
- Check `.env` file location (must be in `backend/` directory)

---

## Reference

**Google Cloud Console:** https://console.cloud.google.com/  
**API Docs:** http://localhost:5000/api-docs  
**Full Documentation:** [GOOGLE_CLOUD_SETUP_GUIDE.md](./GOOGLE_CLOUD_SETUP_GUIDE.md)

---

**Setup time:** ⏱️ ~5 minutes  
**Status:** ✅ Ready to use

