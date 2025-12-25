# Google OAuth Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Add Authorized redirect URIs:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**

### Step 2: Add Environment Variables

Add these to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Step 3: Restart Server

```bash
npm run dev
```

That's it! Google OAuth is now enabled.

## Testing

### Test Google Sign-In Flow

1. Get a Google ID token from your frontend
2. Send to backend:

```bash
curl -X POST http://localhost:5000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "your_google_id_token_here"
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isEmailVerified": true,
      "authProviders": [
        {
          "provider": "google",
          "email": "user@example.com"
        }
      ]
    },
    "accessToken": "...",
    "refreshToken": "...",
    "action": "register"
  }
}
```

## Frontend Integration

### Install Google OAuth Library

```bash
npm install @react-oauth/google
```

### Add to Your App

```javascript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="your_client_id.apps.googleusercontent.com">
      <YourApp />
    </GoogleOAuthProvider>
  );
}
```

### Login Component

```javascript
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function LoginPage() {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await axios.post('http://localhost:5000/api/v1/auth/google', {
        idToken: credentialResponse.credential,
      });

      // Store tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Google sign-in failed:', error.response?.data);
    }
  };

  return (
    <div>
      <h1>Sign In</h1>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => console.log('Login Failed')}
      />
    </div>
  );
}
```

## Available Endpoints

### 1. Sign In / Sign Up with Google
```
POST /api/v1/auth/google
Body: { idToken: string, role?: 'client' | 'coach' }
```

### 2. Link Google to Existing Account
```
POST /api/v1/auth/google/link
Headers: { Authorization: Bearer <token> }
Body: { idToken: string }
```

### 3. Unlink Google Account
```
DELETE /api/v1/auth/google/unlink
Headers: { Authorization: Bearer <token> }
```

### 4. Set Password (for Google-only accounts)
```
POST /api/v1/auth/set-password
Headers: { Authorization: Bearer <token> }
Body: { password: string }
```

## Features

✅ **Automatic Account Creation** - New users are created automatically  
✅ **Account Linking** - Google accounts link to existing email accounts  
✅ **Email Verification** - Google emails are pre-verified  
✅ **Multiple Auth Methods** - Users can have both Google and password  
✅ **Secure** - All tokens verified server-side  
✅ **Audit Logging** - All actions logged for security  

## Account Scenarios

### Scenario 1: New User
```
User → Sign in with Google → New account created → Logged in
```

### Scenario 2: Existing User (Same Email)
```
User (email/password) → Sign in with Google (same email) 
→ Google linked to account → Logged in
```

### Scenario 3: Add Password to Google Account
```
Google user → Call /auth/set-password → Password set 
→ Can now login with email/password OR Google
```

### Scenario 4: Link Google to Existing Account
```
Logged in user → Call /auth/google/link → Google linked 
→ Can now login with email/password OR Google
```

## Security

- ✅ Google ID tokens verified using official Google library
- ✅ Email must match when linking accounts
- ✅ Cannot unlink only authentication method
- ✅ All actions audit logged
- ✅ Rate limiting on all endpoints

## Troubleshooting

### "Invalid Google token"
- Token expired (tokens last 1 hour)
- Wrong Client ID
- Token from different project

**Solution:** Get fresh token from Google

### "Email mismatch"
- Google email doesn't match account email

**Solution:** Use Google account with same email

### "Cannot unlink Google account"
- Google is the only authentication method

**Solution:** Set password first: `POST /auth/set-password`

## Support

For full documentation, see:
- [GOOGLE_OAUTH_IMPLEMENTATION.md](./GOOGLE_OAUTH_IMPLEMENTATION.md)
- [API Documentation](./README.md)

## Environment Variables Reference

```env
# Required
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Optional
ENABLE_GOOGLE_AUTH=true
```

## Next Steps

1. ✅ Set up Google OAuth credentials
2. ✅ Add environment variables
3. ✅ Restart server
4. ✅ Integrate frontend
5. ✅ Test authentication flow
6. 🚀 Deploy to production

For production deployment, remember to:
- Update authorized origins/redirect URIs in Google Console
- Use production Client ID and Secret
- Enable HTTPS
- Update CORS settings

