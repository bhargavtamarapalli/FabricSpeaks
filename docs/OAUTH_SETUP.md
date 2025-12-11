# OAuth Setup Guide - Google & Apple Sign-In

## Overview
This guide explains how to set up Google and Apple OAuth authentication for Fabric Speaks.

## Architecture
- **Backend**: Supabase Auth handles OAuth flows
- **Frontend**: React components initiate OAuth and handle callbacks
- **Flow**: User clicks → Backend redirects to provider → Provider redirects back → Token verification

---

## 1. Supabase Configuration

### Enable OAuth Providers in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Google** and **Apple** providers

### Configure Redirect URLs

Add these redirect URLs in Supabase:
```
http://localhost:5000/auth/callback
https://your-production-domain.com/auth/callback
```

---

## 2. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**

### Step 2: Create OAuth 2.0 Client ID

1. Click **Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `Fabric Speaks`
4. Authorized JavaScript origins:
   ```
   http://localhost:5000
   https://your-production-domain.com
   ```
5. Authorized redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. Click **Create**
7. Copy **Client ID** and **Client Secret**

### Step 3: Configure Supabase

1. In Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Paste **Client ID** and **Client Secret**
4. Click **Save**

### Step 4: Add to Environment Variables

Add to your `.env` file:
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 3. Apple Sign-In Setup

### Step 1: Apple Developer Account

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**

### Step 2: Create App ID

1. Click **Identifiers** → **+** button
2. Select **App IDs** → **Continue**
3. Select **App** → **Continue**
4. Fill in:
   - Description: `Fabric Speaks`
   - Bundle ID: `com.fabricspeaks.app` (or your domain)
5. Enable **Sign in with Apple**
6. Click **Continue** → **Register**

### Step 3: Create Service ID

1. Click **Identifiers** → **+** button
2. Select **Services IDs** → **Continue**
3. Fill in:
   - Description: `Fabric Speaks Web`
   - Identifier: `com.fabricspeaks.web`
4. Enable **Sign in with Apple**
5. Click **Configure**
6. Add domains and return URLs:
   - Domains: `your-project.supabase.co`
   - Return URLs: `https://your-project.supabase.co/auth/v1/callback`
7. Click **Continue** → **Register**

### Step 4: Create Private Key

1. Click **Keys** → **+** button
2. Key Name: `Fabric Speaks Sign in with Apple Key`
3. Enable **Sign in with Apple**
4. Click **Configure** → Select your App ID
5. Click **Continue** → **Register**
6. **Download the .p8 file** (you can only download once!)
7. Note the **Key ID**

### Step 5: Get Team ID

1. Go to **Membership** in Apple Developer Portal
2. Copy your **Team ID**

### Step 6: Configure Supabase

1. In Supabase Dashboard → **Authentication** → **Providers** → **Apple**
2. Enable Apple provider
3. Fill in:
   - **Services ID**: `com.fabricspeaks.web`
   - **Team ID**: Your team ID
   - **Key ID**: Your key ID
   - **Private Key**: Paste contents of the .p8 file
4. Click **Save**

### Step 7: Add to Environment Variables

Add to your `.env` file:
```bash
APPLE_CLIENT_ID=com.fabricspeaks.web
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...your private key content...
-----END PRIVATE KEY-----"
```

---

## 4. Database Migration

Run the migration to add OAuth fields to profiles table:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Dashboard → SQL Editor:
```

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS full_name TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
```

---

## 5. Environment Variables

Complete `.env` configuration:

```bash
# App URLs
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple OAuth
APPLE_CLIENT_ID=com.fabricspeaks.web
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"
```

---

## 6. Testing OAuth Flow

### Test Google Sign-In

1. Start your development server
2. Click "Sign In" → "Login with Google"
3. You should be redirected to Google's consent screen
4. After approval, you'll be redirected back to `/auth/callback`
5. The app will verify the token and log you in

### Test Apple Sign-In

1. Click "Sign In" → "Login with Apple"
2. You should be redirected to Apple's sign-in page
3. After approval, you'll be redirected back to `/auth/callback`
4. The app will verify the token and log you in

---

## 7. API Endpoints

### Initiate OAuth
```
GET /api/auth/google
GET /api/auth/apple
```

Returns:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "provider": "google"
}
```

### OAuth Callbacks
```
GET /api/auth/google/callback?code=...
GET /api/auth/apple/callback?code=...
```

Redirects to: `${FRONTEND_URL}/auth/callback?token=...&provider=google`

### Verify Token
```
POST /api/auth/oauth/verify
Body: { "token": "..." }
```

Returns:
```json
{
  "user": {
    "id": "...",
    "username": "...",
    "email": "...",
    "role": "user"
  },
  "token": "..."
}
```

---

## 8. Frontend Integration

The OAuth buttons in `AuthModal.tsx` automatically:
1. Call `/api/auth/google` or `/api/auth/apple`
2. Redirect user to provider's OAuth page
3. Handle callback at `/auth/callback`
4. Verify token and store user session
5. Redirect to home page

---

## 9. Security Considerations

1. **HTTPS Required**: OAuth requires HTTPS in production
2. **Redirect URI Validation**: Ensure redirect URIs match exactly
3. **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)
4. **CORS**: Configure CORS to allow your frontend domain
5. **Rate Limiting**: Implement rate limiting on OAuth endpoints

---

## 10. Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure redirect URIs in Google/Apple console match Supabase callback URL exactly
- Check for trailing slashes

### "Invalid Client" Error
- Verify Client ID and Client Secret are correct
- Ensure OAuth provider is enabled in Supabase

### User Not Created
- Check database logs
- Verify migration ran successfully
- Ensure email/full_name fields exist in profiles table

### Token Verification Fails
- Check SUPABASE_SERVICE_ROLE_KEY is correct
- Verify token hasn't expired
- Check network requests in browser DevTools

---

## 11. Production Deployment

1. Update redirect URLs to production domain
2. Set `APP_URL` and `FRONTEND_URL` to production URLs
3. Ensure HTTPS is enabled
4. Test OAuth flow in production environment
5. Monitor error logs for OAuth failures

---

## Support

For issues:
1. Check Supabase Auth logs in dashboard
2. Review browser console for errors
3. Verify all environment variables are set
4. Test with Supabase Auth debug mode enabled
