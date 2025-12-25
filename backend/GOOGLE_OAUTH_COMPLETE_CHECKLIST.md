# Google OAuth Setup - Complete Checklist for CoachFlow

## Overview
This checklist ensures all Google Cloud OAuth requirements are properly configured for CoachFlow.

---

## ✅ Setup Checklist

### 1. Google Cloud Project Created
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Click "Select a project" → "NEW PROJECT"
- [ ] Name: `CoachFlow` (or your preferred name)
- [ ] Click "CREATE"
- [ ] Wait for project creation (~30 seconds)
- [ ] **Status:** ✅ Google Cloud project created

---

### 2. OAuth Consent Screen Configured

#### 2.1 Basic Configuration
- [ ] Go to **"APIs & Services"** → **"OAuth consent screen"**
- [ ] Select **User Type**: External (for all Google users) or Internal (for Workspace only)
- [ ] Click "CREATE"

#### 2.2 App Information
- [ ] **App name:** `CoachFlow`
- [ ] **User support email:** [Your email address]
- [ ] **App logo:** (Optional but recommended - 120x120px)
- [ ] **Application home page:** `https://yourdomain.com` (optional)
- [ ] **Privacy policy link:** `https://yourdomain.com/privacy-policy` (required for production)
- [ ] **Terms of service link:** `https://yourdomain.com/terms-of-service` (required for production)
- [ ] **Developer contact email:** [Your email address]
- [ ] Click "SAVE AND CONTINUE"
- [ ] **Status:** ✅ App name set
- [ ] **Status:** ✅ Support email set

#### 2.3 Scopes Configuration
- [ ] Click "ADD OR REMOVE SCOPES"
- [ ] Select these 3 scopes ONLY:
  - [ ] ✅ `openid` - OpenID Connect
  - [ ] ✅ `.../auth/userinfo.email` - Email address
  - [ ] ✅ `.../auth/userinfo.profile` - Basic profile
- [ ] Click "UPDATE"
- [ ] Click "SAVE AND CONTINUE"
- [ ] **Status:** ✅ Scopes limited to: openid, email, profile

**Full scope URLs:**
```
openid
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

#### 2.4 Test Users (if in development/testing mode)
- [ ] Add test user emails who can sign in during development
- [ ] Click "SAVE AND CONTINUE"

#### 2.5 Review Summary
- [ ] Review all settings
- [ ] Click "BACK TO DASHBOARD"
- [ ] **Status:** ✅ OAuth consent screen configured

---

### 3. OAuth Client ID Created

#### 3.1 Create Credentials
- [ ] Go to **"APIs & Services"** → **"Credentials"**
- [ ] Click **"+ CREATE CREDENTIALS"**
- [ ] Select **"OAuth 2.0 Client ID"**

#### 3.2 Configure Client
- [ ] **Application type:** Web application
- [ ] **Name:** `CoachFlow Web Client` (or descriptive name)
- [ ] **Status:** ✅ OAuth Client ID created (Web application)

---

### 4. Authorized Redirect URIs Set

#### 4.1 Authorized JavaScript Origins
Add these for your frontend:

**Development:**
- [ ] `http://localhost:3000`
- [ ] `http://localhost:3001` (if needed)

**Staging:**
- [ ] `https://staging.yourdomain.com`

**Production:**
- [ ] `https://yourdomain.com`
- [ ] `https://www.yourdomain.com`

#### 4.2 Authorized Redirect URIs
Add these for OAuth callbacks:

**Development:**
- [ ] `http://localhost:3000`
- [ ] `http://localhost:3000/auth/callback`
- [ ] `http://localhost:5000/api/v1/auth/google/callback`

**Staging:**
- [ ] `https://staging.yourdomain.com`
- [ ] `https://staging.yourdomain.com/auth/callback`
- [ ] `https://api-staging.yourdomain.com/api/v1/auth/google/callback`

**Production:**
- [ ] `https://yourdomain.com`
- [ ] `https://yourdomain.com/auth/callback`
- [ ] `https://api.yourdomain.com/api/v1/auth/google/callback`

- [ ] Click "CREATE"
- [ ] **Status:** ✅ Authorized redirect URIs set for dev, staging, production

**Important Notes:**
- URIs must match exactly (including http/https, ports, paths)
- No trailing slashes
- Localhost allowed for development only

---

### 5. Client ID + Client Secret Stored

#### 5.1 Copy Credentials
- [ ] Copy **Client ID** (format: `xxx...xxx.apps.googleusercontent.com`)
- [ ] Copy **Client Secret** (format: `GOCSPX-xxx...xxx`)
- [ ] Store securely in password manager

#### 5.2 Add to Environment Variables

**For Development:**
- [ ] Navigate to backend directory
- [ ] Create `.env` file (if it doesn't exist)
- [ ] Add these lines:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here
ENABLE_GOOGLE_AUTH=true
```

**For Staging:**
- [ ] Create `.env.staging` or configure in hosting platform
- [ ] Use separate Google OAuth client credentials
- [ ] Update redirect URIs to staging domains

**For Production:**
- [ ] Configure environment variables in hosting platform
- [ ] Use separate Google OAuth client credentials (IMPORTANT!)
- [ ] Update redirect URIs to production domains
- [ ] Ensure HTTPS is enabled

- [ ] **Status:** ✅ Client ID + Client Secret stored in environment variables

#### 5.3 Verify Environment Variables
```bash
# Run this in backend directory
node -e "require('dotenv').config(); console.log('Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...'); console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌');"
```

Expected output:
```
Client ID: 123456789-abcdefgh...
Client Secret: Set ✅
```

---

### 6. Consent Screen Reviewed for Production

#### 6.1 Pre-Production Checklist
- [ ] App name is professional and matches brand
- [ ] User support email is monitored and responsive
- [ ] Privacy policy URL is live and accessible
- [ ] Privacy policy explains:
  - [ ] What data is collected from Google (email, name, profile)
  - [ ] How data is used
  - [ ] How data is stored
  - [ ] User rights (access, deletion, etc.)
- [ ] Terms of service URL is live and accessible
- [ ] App logo uploaded (120x120px recommended)
- [ ] Authorized domains verified
- [ ] Only necessary scopes requested (openid, email, profile)
- [ ] Test users added (if still in testing mode)

#### 6.2 Verify All Settings
- [ ] Go to **"APIs & Services"** → **"OAuth consent screen"**
- [ ] Review all information
- [ ] Verify scopes are minimal (openid, email, profile only)
- [ ] Ensure all URLs work and are HTTPS (for production)

#### 6.3 Publishing Status

**If staying in Testing Mode:**
- [ ] Limited to 100 test users
- [ ] No Google review required
- [ ] Users see "unverified app" warning
- [ ] Good for development/staging

**If Publishing to Production:**
- [ ] Click "PUBLISH APP" on OAuth consent screen
- [ ] Submit for verification (if using sensitive scopes)
- [ ] For basic scopes (openid, email, profile): Usually no verification needed
- [ ] Verification timeline: 1-7 days (if required)

- [ ] **Status:** ✅ Consent screen reviewed for production readiness

---

## 🎯 Final Verification

### Backend Setup
- [ ] `.env` file created with Google credentials
- [ ] Environment variables loaded correctly
- [ ] Server starts without errors

```bash
cd backend
npm run dev
```

Look for:
```
✅ Google OAuth enabled
   Client ID: 123456789-abc...
```

### Test Authentication
- [ ] Test endpoint is accessible:

```bash
curl http://localhost:5000/api/v1/auth/google
```

- [ ] Get test Google ID token from [OAuth Playground](https://developers.google.com/oauthplayground/)
- [ ] Test authentication:

```bash
curl -X POST http://localhost:5000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## 📋 Environment-Specific Summary

### Development
- **Google Client:** CoachFlow Dev
- **Authorized Origins:** `http://localhost:3000`
- **Redirect URIs:** `http://localhost:3000`, `http://localhost:5000/api/v1/auth/google/callback`
- **Status:** Testing mode OK

### Staging
- **Google Client:** CoachFlow Staging (separate client!)
- **Authorized Origins:** `https://staging.yourdomain.com`
- **Redirect URIs:** `https://staging.yourdomain.com`, staging API callback
- **Status:** Testing mode OK

### Production
- **Google Client:** CoachFlow Production (separate client!)
- **Authorized Origins:** `https://yourdomain.com`
- **Redirect URIs:** `https://yourdomain.com`, production API callback
- **Status:** Must be published (if serving public users)
- **Requirements:**
  - [ ] HTTPS enabled (required)
  - [ ] Privacy policy published
  - [ ] Terms of service published
  - [ ] Domain verified
  - [ ] Separate Google OAuth client credentials

---

## 🔒 Security Best Practices

- [ ] Different OAuth client for each environment (dev/staging/prod)
- [ ] Never commit `.env` file to Git
- [ ] Store production secrets in secure location (AWS Secrets Manager, etc.)
- [ ] Rotate secrets every 90 days
- [ ] Monitor authentication logs
- [ ] Set up alerts for failed authentication attempts
- [ ] Only request minimum required scopes
- [ ] Use HTTPS in production (required by Google)

---

## 📚 Additional Resources

### Documentation
- [GOOGLE_CLOUD_SETUP_GUIDE.md](./GOOGLE_CLOUD_SETUP_GUIDE.md) - Detailed setup instructions
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - Quick setup guide
- [GOOGLE_OAUTH_IMPLEMENTATION.md](./GOOGLE_OAUTH_IMPLEMENTATION.md) - Full implementation details
- [ENV_TEMPLATE.md](./ENV_TEMPLATE.md) - Environment variables template

### External Links
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth Playground](https://developers.google.com/oauthplayground/)
- [Google Identity Documentation](https://developers.google.com/identity)

---

## ✅ Completion Status

**All Steps Complete:**
- ✅ Google Cloud project created
- ✅ OAuth consent screen configured
  - ✅ App name
  - ✅ Support email
  - ✅ Scopes (openid, email, profile)
- ✅ OAuth Client ID created (Web application)
- ✅ Authorized redirect URIs set
  - ✅ Development
  - ✅ Staging
  - ✅ Production
- ✅ Client ID + Client Secret stored
- ✅ Consent screen production-ready

**Ready for:**
- ✅ Development testing
- ✅ Staging deployment
- ✅ Production deployment (after publishing consent screen)

---

## 🚀 Next Steps

1. **Test locally:** Verify Google sign-in works in development
2. **Integrate frontend:** Add Google Sign-In button to your React app
3. **Deploy to staging:** Test with staging Google OAuth client
4. **Publish consent screen:** When ready for production users
5. **Deploy to production:** With production Google OAuth client

---

**Setup Complete!** 🎉

All Google Cloud OAuth requirements are configured. Your application is ready to authenticate users with Google.

**Questions?** See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for troubleshooting.




