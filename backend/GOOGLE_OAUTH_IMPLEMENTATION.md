# Google OAuth Implementation Guide

## Overview

CoachFlow now supports Google OAuth authentication with intelligent account linking. Users can sign in with Google, email/password, or both methods on the same account.

## Key Features

✅ **Identity Provider Only** - Google is treated as an authentication method, not a separate user type  
✅ **Unified User Model** - All users stored in the same collection regardless of login method  
✅ **Automatic Account Linking** - Google accounts automatically link to existing email accounts  
✅ **Flexible Authentication** - Users can have multiple login methods (Google + email/password)  
✅ **Account Management** - Easy linking/unlinking of authentication methods  

## Architecture

### One User = One Account

```
User Model
├── email (unique identifier)
├── password (optional - only required if no OAuth providers)
├── googleId (optional - for Google sign-in)
├── authProviders[] (tracks all authentication methods)
│   ├── local (email/password)
│   └── google (Google OAuth)
└── ... (other user fields)
```

### Authentication Flow

```
Google Sign In Request
    ↓
Verify Google Token
    ↓
Check: User exists with googleId?
    ├─ YES → Login user
    └─ NO → Check: User exists with email?
        ├─ YES → Link Google account + Login
        └─ NO → Create new user + Login
```

## Setup

### 1. Environment Variables

Add to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: Enable/disable Google Auth
ENABLE_GOOGLE_AUTH=true
```

### 2. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URIs:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
6. Copy Client ID and Client Secret to `.env`

## API Endpoints

### 1. Google Sign In / Sign Up

**Endpoint:** `POST /api/v1/auth/google`

**Description:** Sign in with Google. Creates new account if needed, or logs into existing account. Automatically links Google to existing email accounts.

**Request:**
```json
{
  "idToken": "google_id_token_from_client",
  "role": "client",  // Optional: only for new users
  "acceptedTerms": true,
  "acceptedPrivacy": true,
  "marketingConsent": false
}
```

**Response (New User - 201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "client",
      "avatar": "https://lh3.googleusercontent.com/...",
      "isEmailVerified": true,
      "authProviders": [
        {
          "provider": "google",
          "email": "user@example.com",
          "linkedAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "action": "register"
  }
}
```

**Response (Existing User - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "action": "login"
  }
}
```

**Response (Account Linked - 200):**
```json
{
  "success": true,
  "message": "Google account linked and logged in",
  "data": {
    "user": { ... },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "action": "linked"
  }
}
```

### 2. Link Google Account (Authenticated)

**Endpoint:** `POST /api/v1/auth/google/link`

**Description:** Link Google account to currently authenticated user. Requires email to match.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "idToken": "google_id_token_from_client"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Google account linked successfully",
  "data": {
    "user": { ... },
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token",
    "action": "linked"
  }
}
```

**Errors:**
- `400` - Email mismatch or already linked
- `409` - Google account already linked to another user

### 3. Unlink Google Account (Authenticated)

**Endpoint:** `DELETE /api/v1/auth/google/unlink`

**Description:** Remove Google authentication from user account. Requires password to be set first (can't remove only auth method).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Google account unlinked successfully",
  "data": {
    "message": "Google account unlinked successfully"
  }
}
```

**Errors:**
- `400` - No Google account linked or it's the only auth method

### 4. Set Password (Authenticated)

**Endpoint:** `POST /api/v1/auth/set-password`

**Description:** Set a password for OAuth-only accounts. Allows Google users to add email/password login.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password set successfully. You can now login with email and password.",
  "data": {
    "message": "Password set successfully. You can now login with email and password."
  }
}
```

**Errors:**
- `400` - Account already has a password or validation failed

## Client-Side Integration

### React Example with @react-oauth/google

```javascript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function LoginPage() {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('http://localhost:5000/api/v1/auth/google', {
        idToken: credentialResponse.credential,
        role: 'client', // Optional for new users
      });

      const { accessToken, refreshToken, user, action } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Handle different actions
      if (action === 'register') {
        console.log('New account created!');
      } else if (action === 'linked') {
        console.log('Google account linked to existing account!');
      } else {
        console.log('Welcome back!');
      }

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId="your_google_client_id">
      <div>
        <h1>Sign In</h1>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => console.log('Login Failed')}
        />
      </div>
    </GoogleOAuthProvider>
  );
}
```

### Link Google Account (Existing User)

```javascript
const linkGoogleAccount = async (idToken) => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await axios.post(
      'http://localhost:5000/api/v1/auth/google/link',
      { idToken },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    console.log('Google account linked!');
    
    // Update user info
    const { user } = response.data.data;
    // ... update UI
  } catch (error) {
    if (error.response?.status === 400) {
      console.error('Email mismatch or already linked');
    } else if (error.response?.status === 409) {
      console.error('Google account already used by another user');
    }
  }
};
```

## Account Linking Logic

### Scenario 1: New User Signs in with Google
```
1. User clicks "Sign in with Google"
2. Google returns ID token
3. Backend verifies token
4. No user found with googleId or email
5. CREATE new user with Google provider
6. Return new user + tokens
```

### Scenario 2: Existing User (Email/Password) Signs in with Google
```
1. User with email user@example.com exists (local provider only)
2. User clicks "Sign in with Google" using same email
3. Backend verifies token
4. User found by email
5. LINK Google provider to existing user
6. Return user + tokens
```

### Scenario 3: Google User Adds Password
```
1. User signed up with Google (no password)
2. User wants to add email/password login
3. User calls POST /auth/set-password
4. Backend adds 'local' provider
5. User can now login with email/password OR Google
```

### Scenario 4: User Links Google to Existing Account
```
1. User logged in with email/password
2. User calls POST /auth/google/link with Google token
3. Backend verifies email matches
4. LINK Google provider to account
5. User can now login with email/password OR Google
```

### Scenario 5: User Unlinks Google
```
1. User has both local and Google providers
2. User calls DELETE /auth/google/unlink
3. Backend removes Google provider
4. User can only login with email/password
```

## Security Features

### 1. Email Verification
- Google emails are automatically verified
- Users created via Google have `isEmailVerified: true`

### 2. Token Security
- Google ID tokens are verified using Google's OAuth2Client
- Invalid tokens are rejected with 401 Unauthorized

### 3. Account Protection
- Cannot unlink Google if it's the only auth method
- Email must match when linking Google to existing account
- Google account cannot be linked to multiple users

### 4. Audit Logging
All OAuth actions are logged:
- `ACCOUNT_LINKED` - When Google is linked
- `ACCOUNT_UNLINKED` - When Google is unlinked
- `LOGIN_SUCCESS` / `LOGIN_FAILURE` - OAuth login attempts

## Database Schema

### User Model Changes

```javascript
{
  email: String,           // Primary identifier (unique)
  password: String,        // Optional (required only if no OAuth)
  googleId: String,        // Optional (unique, sparse index)
  
  authProviders: [
    {
      provider: String,    // 'local' | 'google'
      providerId: String,  // Google sub ID
      email: String,       // Provider email
      linkedAt: Date       // When linked
    }
  ],
  
  // ... other fields
}
```

### Indexes
```javascript
email: 1                            // Primary lookup
googleId: 1                         // Google user lookup
authProviders.provider: 1           // Filter by provider
authProviders.providerId: 1         // Provider ID lookup
```

## Testing

### Manual Testing

1. **New Google User:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "your_google_id_token",
    "role": "client"
  }'
```

2. **Link Google to Existing User:**
```bash
# First, get access token by logging in normally
# Then:
curl -X POST http://localhost:5000/api/v1/auth/google/link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "idToken": "your_google_id_token"
  }'
```

3. **Unlink Google:**
```bash
curl -X DELETE http://localhost:5000/api/v1/auth/google/unlink \
  -H "Authorization: Bearer your_access_token"
```

4. **Set Password (OAuth-only account):**
```bash
curl -X POST http://localhost:5000/api/v1/auth/set-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "password": "SecurePassword123!"
  }'
```

## Migration Guide

### For Existing Users

If you have existing users in your database, they will automatically work with the new system:

1. **Email/Password Users:** Existing users will have their `authProviders` array populated with `'local'` provider when they next login
2. **No Breaking Changes:** All existing authentication continues to work
3. **Optional Migration Script:** You can run a migration to populate `authProviders` for all existing users:

```javascript
// migration-script.js
const User = require('./src/modules/auth/models/user.model');

async function migrateExistingUsers() {
  const users = await User.find({ authProviders: { $exists: false } });
  
  for (const user of users) {
    user.authProviders = [{
      provider: 'local',
      email: user.email,
      linkedAt: user.createdAt || new Date(),
    }];
    await user.save();
  }
  
  console.log(`Migrated ${users.length} users`);
}

migrateExistingUsers();
```

## Troubleshooting

### Issue: "Invalid Google token"
**Solution:** Ensure the Google token is fresh and not expired. Tokens expire after 1 hour.

### Issue: "Email mismatch when linking"
**Solution:** The Google account email must match the user's account email exactly.

### Issue: "Cannot unlink Google account"
**Solution:** Set a password first using `/auth/set-password` before unlinking Google.

### Issue: "Google account already linked to another user"
**Solution:** This Google account is already in use. User must sign in with that account or use a different Google account.

## Best Practices

1. **Always validate tokens on the backend** - Never trust client-side validation alone
2. **Handle the `action` field** - Different UX for register vs login vs linked
3. **Support account recovery** - Allow users to set passwords for OAuth-only accounts
4. **Clear messaging** - Tell users when accounts are automatically linked
5. **Allow multiple auth methods** - Users appreciate flexibility
6. **Audit everything** - Log all authentication events for security

## Support for Additional OAuth Providers

The system is designed to easily support additional OAuth providers (Facebook, Apple, etc.):

1. Add provider to `authProviders.provider` enum in User model
2. Create new service (e.g., `facebookAuth.service.js`)
3. Add routes and controllers
4. Update configuration

Example for Facebook:
```javascript
// In user.model.js
provider: {
  enum: ['local', 'google', 'facebook', 'apple']
}

// In config/index.js
auth: {
  google: { ... },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
  }
}
```

## Summary

Google OAuth is now fully integrated into CoachFlow with:
- ✅ Seamless account creation and login
- ✅ Automatic account linking by email
- ✅ Flexible authentication options
- ✅ Complete account management
- ✅ Full audit trail
- ✅ Enterprise-grade security

Users can now sign up with Google, link/unlink accounts, and enjoy a unified authentication experience across all login methods.




