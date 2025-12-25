# Google Cloud OAuth Setup Guide for CoachFlow

## ✅ Complete Setup Checklist

Follow this guide to configure Google Cloud Console for CoachFlow authentication.

---

## Step 1: Create Google Cloud Project

### Actions:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "NEW PROJECT"
3. Enter project details:
   - **Project name:** `CoachFlow` (or your preferred name)
   - **Organization:** (optional)
   - **Location:** (optional)
4. Click **"CREATE"**
5. Wait for project creation (15-30 seconds)
6. Select your new project from the dropdown

**Status:** ✅ Google Cloud project created

---

## Step 2: Enable Required APIs

### Enable Google+ API (or Google Identity):
1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on it
4. Click **"ENABLE"**
5. Wait for activation (30 seconds)

**Alternative:** The newer approach uses the Google Identity service which is automatically enabled.

---

## Step 3: Configure OAuth Consent Screen

### 3.1 Initial Configuration
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **User Type:**
   - **Internal:** Only for Google Workspace users (if applicable)
   - **External:** For all Google account users (recommended for CoachFlow)
3. Click **"CREATE"**

### 3.2 App Information
Fill in the following required fields:

**App name:** `CoachFlow`

**User support email:** Your email address (dropdown selection)

**App logo:** (Optional but recommended)
- Upload CoachFlow logo (120x120px PNG/JPG)

**Application home page:** (Optional)
- `https://yourdomain.com`

**Application privacy policy link:** (Required for production)
- `https://yourdomain.com/privacy-policy`

**Application terms of service link:** (Required for production)
- `https://yourdomain.com/terms-of-service`

**Authorized domains:** (Required for production)
```
yourdomain.com
```

**Developer contact information:**
- Email addresses: Your email (required)

4. Click **"SAVE AND CONTINUE"**

### 3.3 Scopes Configuration
1. On the "Scopes" page, click **"ADD OR REMOVE SCOPES"**
2. Select these **3 scopes** (required for CoachFlow):
   - ✅ `openid` - OpenID Connect authentication
   - ✅ `.../auth/userinfo.email` - View user's email address
   - ✅ `.../auth/userinfo.profile` - View user's basic profile info

   These scopes appear as:
   ```
   openid
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```

3. Do NOT add additional sensitive scopes unless required
4. Click **"UPDATE"**
5. Click **"SAVE AND CONTINUE"**

**Status:** ✅ Scopes limited to: openid, email, profile

### 3.4 Test Users (for External apps in development)
If your app is in testing mode:
1. Click **"ADD USERS"**
2. Enter email addresses of test users who can sign in during development
3. Click **"ADD"**
4. Click **"SAVE AND CONTINUE"**

### 3.5 Summary
1. Review all settings
2. Click **"BACK TO DASHBOARD"**

**Status:** ✅ OAuth consent screen configured

---

## Step 4: Create OAuth 2.0 Client ID

### 4.1 Create Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth 2.0 Client ID"**

### 4.2 Configure Application Type
1. **Application type:** Select **"Web application"**
2. **Name:** `CoachFlow Web Client` (or descriptive name)

### 4.3 Set Authorized JavaScript Origins
Add these origins (for frontend):

**Development:**
```
http://localhost:3000
http://localhost:3001
```

**Staging:**
```
https://staging.yourdomain.com
```

**Production:**
```
https://yourdomain.com
https://www.yourdomain.com
```

### 4.4 Set Authorized Redirect URIs
Add these redirect URIs (for OAuth callback):

**Development:**
```
http://localhost:3000
http://localhost:3000/auth/callback
http://localhost:5000/api/v1/auth/google/callback
```

**Staging:**
```
https://staging.yourdomain.com
https://staging.yourdomain.com/auth/callback
https://api-staging.yourdomain.com/api/v1/auth/google/callback
```

**Production:**
```
https://yourdomain.com
https://yourdomain.com/auth/callback
https://api.yourdomain.com/api/v1/auth/google/callback
```

**Important Notes:**
- URIs must match exactly (including http/https, port numbers, paths)
- No trailing slashes
- Localhost is allowed for development
- Add all environments you'll be using

4. Click **"CREATE"**

**Status:** ✅ OAuth Client ID created (Web application)  
**Status:** ✅ Authorized redirect URIs set for dev, staging, production

---

## Step 5: Save Client Credentials

### 5.1 Copy Credentials
After creation, a modal appears with:
- **Your Client ID:** `123456789-abc...xyz.apps.googleusercontent.com`
- **Your Client Secret:** `GOCSPX-...`

**⚠️ IMPORTANT:**
1. **Copy both values immediately**
2. Store them securely (password manager recommended)
3. You can always view them later in the Credentials page

### 5.2 Add to Environment Variables

Create or update your `.env` file:

```env
# ================================
# Google OAuth Configuration
# ================================
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here

# Optional: Explicitly enable Google auth
ENABLE_GOOGLE_AUTH=true
```

**Security Best Practices:**
- ✅ Never commit `.env` file to Git
- ✅ Use different credentials for dev/staging/production
- ✅ Rotate secrets periodically
- ✅ Restrict access to production credentials
- ✅ Store backups in secure password manager

**Status:** ✅ Client ID + Client Secret stored in environment variables

---

## Step 6: Review for Production Readiness

### 6.1 OAuth Consent Screen Verification

Before publishing your app, ensure:

**Required Information:**
- ✅ App name is clear and matches your brand
- ✅ User support email is monitored
- ✅ Privacy policy URL is live and accurate
- ✅ Terms of service URL is live and accurate
- ✅ Authorized domains are correct

**Scopes:**
- ✅ Only requesting necessary scopes (openid, email, profile)
- ✅ No sensitive scopes unless absolutely required
- ✅ Scope justifications provided (if required)

**Branding:**
- ✅ App logo uploaded (recommended)
- ✅ App domain verified

### 6.2 Publishing Status

**Testing Mode (Default):**
- Limited to 100 test users
- No Google review required
- Shows "unverified app" warning to users
- Good for development/staging

**Production Mode:**
- To publish for all users:
  1. Go to **"OAuth consent screen"**
  2. Click **"PUBLISH APP"**
  3. Submit for verification if using sensitive scopes
  4. Verification takes 1-7 days for sensitive scopes
  5. Basic scopes (openid, email, profile) typically don't require verification

**Status:** ✅ Consent screen reviewed for production readiness

---

## Step 7: Test the Integration

### 7.1 Verify Environment Setup

```bash
# Check that environment variables are loaded
cd backend
node -e "require('dotenv').config(); console.log('Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...'); console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌');"
```

### 7.2 Start Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
✅ Google OAuth enabled
   Client ID: 123456789-abc...
```

### 7.3 Test Authentication Flow

#### Option A: Using Frontend
1. Integrate Google Sign-In button on your frontend
2. Click "Sign in with Google"
3. Complete Google authentication
4. Verify user is logged into CoachFlow

#### Option B: Using curl (for backend testing)
1. Get a test ID token from [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. Test the endpoint:

```bash
curl -X POST http://localhost:5000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_GOOGLE_ID_TOKEN_HERE"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isEmailVerified": true
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## Environment-Specific Setup

### Development Environment

**Credentials:**
- Use separate OAuth client for development
- Name: "CoachFlow Dev"

**.env:**
```env
NODE_ENV=development
GOOGLE_CLIENT_ID=dev_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=dev_client_secret
CORS_ORIGIN=http://localhost:3000
```

**Authorized URIs:**
- `http://localhost:3000`
- `http://localhost:5000/api/v1/auth/google/callback`

### Staging Environment

**Credentials:**
- Use separate OAuth client for staging
- Name: "CoachFlow Staging"

**.env:**
```env
NODE_ENV=staging
GOOGLE_CLIENT_ID=staging_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=staging_client_secret
CORS_ORIGIN=https://staging.yourdomain.com
```

**Authorized URIs:**
- `https://staging.yourdomain.com`
- `https://api-staging.yourdomain.com/api/v1/auth/google/callback`

### Production Environment

**Credentials:**
- Use separate OAuth client for production
- Name: "CoachFlow Production"

**.env:**
```env
NODE_ENV=production
GOOGLE_CLIENT_ID=prod_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod_client_secret
CORS_ORIGIN=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Authorized URIs:**
- `https://yourdomain.com`
- `https://www.yourdomain.com`
- `https://api.yourdomain.com/api/v1/auth/google/callback`

**Additional Requirements:**
- ✅ SSL/TLS certificate installed (HTTPS required)
- ✅ Domain verified in Google Console
- ✅ Privacy policy and terms published
- ✅ OAuth consent screen published

---

## Security Best Practices

### Credential Management
- ✅ Use different OAuth clients for each environment
- ✅ Never share credentials between environments
- ✅ Rotate secrets every 90 days
- ✅ Use secret management service in production (AWS Secrets Manager, etc.)
- ✅ Restrict access to production credentials

### Application Security
- ✅ Only request minimum required scopes
- ✅ Validate all ID tokens on the backend
- ✅ Use HTTPS in production (required by Google)
- ✅ Implement rate limiting on auth endpoints
- ✅ Log all authentication attempts
- ✅ Monitor for suspicious activity

### Compliance
- ✅ Privacy policy explains data collection
- ✅ Terms of service cover OAuth usage
- ✅ User consent obtained for data processing
- ✅ Data retention policy defined
- ✅ GDPR/CCPA compliance (if applicable)

---

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
**Cause:** Redirect URI in request doesn't match authorized URIs

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Check "Authorized redirect URIs"
3. Add the exact URI being used (including protocol, port, path)
4. Wait 5 minutes for changes to propagate

### "Access blocked: This app's request is invalid"
**Cause:** OAuth consent screen not configured properly

**Solution:**
1. Complete all required fields in OAuth consent screen
2. Add support email
3. Add privacy policy URL
4. Verify authorized domains

### "invalid_client"
**Cause:** Wrong Client ID or Client Secret

**Solution:**
1. Verify credentials in `.env` match Google Console
2. Check for extra spaces or quotes
3. Ensure using correct environment's credentials

### "Access blocked: CoachFlow has not completed the Google verification process"
**Cause:** App not verified for sensitive scopes

**Solution:**
- For openid, email, profile scopes: No verification needed
- For sensitive scopes: Submit app for verification
- Use testing mode with test users until verified

### "idtoken_expired"
**Cause:** Google ID token expired (expires after 1 hour)

**Solution:**
- Implement token refresh on frontend
- Get new ID token from Google
- Tokens are short-lived by design

---

## Monitoring & Maintenance

### Monitor Usage
1. Go to **"APIs & Services"** → **"Dashboard"**
2. View authentication requests and errors
3. Set up alerts for unusual activity

### Review Audit Logs
1. Go to **"IAM & Admin"** → **"Audit Logs"**
2. Monitor OAuth token issuance
3. Review failed authentication attempts

### Regular Maintenance
- [ ] Review authorized URIs quarterly
- [ ] Rotate secrets every 90 days
- [ ] Remove unused OAuth clients
- [ ] Update app information as needed
- [ ] Monitor Google Cloud Console for security alerts

---

## Quick Reference

### Key URLs
- **Google Cloud Console:** https://console.cloud.google.com/
- **OAuth Playground:** https://developers.google.com/oauthplayground/
- **Google Identity Docs:** https://developers.google.com/identity/

### CoachFlow OAuth Endpoints
```
POST   /api/v1/auth/google              # Sign in/up with Google
POST   /api/v1/auth/google/link         # Link Google to existing account
DELETE /api/v1/auth/google/unlink       # Unlink Google account
POST   /api/v1/auth/set-password        # Add password to OAuth account
```

### Environment Variables Required
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## ✅ Setup Complete Checklist

- [x] Google Cloud project created
- [x] OAuth consent screen configured:
  - [x] App name set
  - [x] Support email set
  - [x] Scopes limited to: openid, email, profile
- [x] OAuth Client ID created (Web application)
- [x] Authorized redirect URIs set:
  - [x] Development environment
  - [x] Staging environment
  - [x] Production environment
- [x] Client ID + Client Secret stored in environment variables
- [x] Consent screen reviewed for production readiness

---

## Next Steps

1. **Frontend Integration:** See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for React integration
2. **Testing:** Test authentication flow end-to-end
3. **Deployment:** Deploy to staging and test before production
4. **Monitoring:** Set up logging and monitoring for OAuth events
5. **Documentation:** Update user documentation with Google sign-in option

---

**Setup Status:** ✅ Complete  
**Last Updated:** December 2025  
**Contact:** Support team for questions

