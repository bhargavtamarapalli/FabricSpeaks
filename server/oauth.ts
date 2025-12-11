import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { db } from "./db/supabase";
import { profiles } from "../shared/schema";
import { eq } from "drizzle-orm";
import { handleRouteError } from "./utils/errors";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * Helper to find or create a user profile with robust collision handling
 */
async function findOrCreateProfile(user: any) {
  // 1. Try to find existing profile
  let profile = await db.query.profiles.findFirst({
    where: eq(profiles.user_id, user.id)
  });
  
  if (profile) return profile;

  // 2. If not found, try to create one
  let baseUsername = user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`;
  // Remove special chars that might be in email prefix
  baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, ''); 
  if (!baseUsername) baseUsername = `user_${user.id.substring(0, 8)}`;
  
  let username = baseUsername;
  let attempts = 0;
  const MAX_ATTEMPTS = 5;
  
  while (attempts < MAX_ATTEMPTS) {
    try {
      // Check if username likely taken (optional optimization, purely to reduce DB errors)
      // but insert will fail anyway which is the source of truth
      
      const [created] = await (db as any).insert(profiles).values({
        user_id: user.id,
        username,
        role: 'user',
        email: user.email || null,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      }).returning();
      
      console.log('[OAUTH] Profile created:', created.id);
      return created;
    } catch (error: any) {
      // Check for unique violation (error code 23505)
      if (error?.code === '23505') {
        // If the violation was on user_id, someone else created the profile in parallel
        // So we just fetch it
        if (error.constraint === 'profiles_user_id_key' || error.detail?.includes('user_id')) {
           console.log('[OAUTH] Profile created in parallel (user_id collision), fetching...');
           const existing = await db.query.profiles.findFirst({
             where: eq(profiles.user_id, user.id)
           });
           if (existing) return existing;
        }

        // Otherwise assume username collision
        console.warn(`[OAUTH] Username collision for ${username}, retrying...`);
        username = `${baseUsername}_${Math.floor(Math.random() * 1000000)}`;
        attempts++;
      } else {
        // Other error
        console.error('[OAUTH] Profile creation error:', error);
        throw error;
      }
    }
  }
  
  throw new Error("Failed to create user profile after multiple attempts");
}

/**
 * Initiate Google OAuth flow
 * Returns the OAuth URL for the client to redirect to
 */
export async function googleAuthHandler(req: Request, res: Response) {
  console.log('[OAUTH] Google auth initiation requested');
  try {
    const redirectUrl = `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000'}/auth/callback`;
    console.log('[OAUTH] Redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('[OAUTH] Google OAuth initiation error:', error);
      throw error;
    }

    console.log('[OAUTH] Google OAuth URL generated:', data.url);
    return res.status(200).json({ 
      url: data.url,
      provider: 'google' 
    });
  } catch (error: any) {
    console.error('[OAUTH] Google auth handler error:', error);
    return handleRouteError(error, res, 'Google OAuth initiation');
  }
}

/**
 * Handle Google OAuth callback
 * Exchanges the code for a session and creates/updates user profile
 */
export async function googleCallbackHandler(req: Request, res: Response) {
  const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000';
  console.log('[OAUTH] Google callback received');
  
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      console.error('[OAUTH] Missing or invalid authorization code');
      return res.redirect(`${frontendUrl}/auth/callback?error=invalid_request&error_description=Authorization+code+is+missing`);
    }

    console.log('[OAUTH] Exchanging code for session');
    // Exchange code for session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !authData?.user) {
      console.error('[OAUTH] Google OAuth exchange error:', authError);
      return res.redirect(`${frontendUrl}/auth/callback?error=auth_failed&error_description=Failed+to+authenticate+with+Google`);
    }

    console.log('[OAUTH] Session obtained for user:', authData.user.id);

    // Find or create profile
    try {
      const profile = await findOrCreateProfile(authData.user);
      console.log('[OAUTH] Profile ready:', profile.id);
    } catch (profileError) {
      console.error('[OAUTH] Fatal: Could not create profile:', profileError);
      // We still redirect, but user might have issues?
    }

    // Redirect to frontend with session data
    const sessionToken = authData.session?.access_token;
    console.log('[OAUTH] Redirecting to frontend with token');
    
    return res.redirect(`${frontendUrl}/auth/callback?token=${sessionToken}&provider=google`);
  } catch (error: any) {
    console.error('[OAUTH] Google OAuth callback error:', error);
    const message = error.message || 'Unknown error occurred';
    return res.redirect(`${frontendUrl}/auth/callback?error=server_error&error_description=${encodeURIComponent(message)}`);
  }
}

/**
 * Initiate Apple OAuth flow
 * Returns the OAuth URL for the client to redirect to
 */
export async function appleAuthHandler(req: Request, res: Response) {
  try {
    const redirectUrl = `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000'}/auth/callback`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (error) throw error;

    return res.status(200).json({ 
      url: data.url,
      provider: 'apple' 
    });
  } catch (error: any) {
    return handleRouteError(error, res, 'Apple OAuth initiation');
  }
}

/**
 * Handle Apple OAuth callback
 * Exchanges the code for a session and creates/updates user profile
 */
export async function appleCallbackHandler(req: Request, res: Response) {
  const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000';

  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.redirect(`${frontendUrl}/auth/callback?error=invalid_request&error_description=Authorization+code+is+missing`);
    }

    // Exchange code for session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !authData?.user) {
      console.error('Apple OAuth exchange error:', authError);
      return res.redirect(`${frontendUrl}/auth/callback?error=auth_failed&error_description=Failed+to+authenticate+with+Apple`);
    }

    // Find or create profile
    await findOrCreateProfile(authData.user);

    // Redirect to frontend with session data
    const sessionToken = authData.session?.access_token;
    
    return res.redirect(`${frontendUrl}/auth/callback?token=${sessionToken}&provider=apple`);
  } catch (error: any) {
    console.error('Apple OAuth callback error:', error);
    const message = error.message || 'Unknown error occurred';
    return res.redirect(`${frontendUrl}/auth/callback?error=server_error&error_description=${encodeURIComponent(message)}`);
  }
}

/**
 * Verify OAuth token and return user session
 * Used by frontend after OAuth redirect
 */
export async function verifyOAuthTokenHandler(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        code: "INVALID_TOKEN", 
        message: "Token is required" 
      });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(410).json({ 
        code: "INVALID_TOKEN", 
        message: "Invalid or expired token" 
      });
    }

    // Find or create profile
    const profile = await findOrCreateProfile(user);

    if (!profile) {
      throw new Error("Failed to retrieve or create user profile");
    }

    return res.status(200).json({ 
      user: { 
        id: profile.id, 
        username: profile.username, 
        role: profile.role,
        email: profile.email,
        full_name: profile.full_name
      },
      token 
    });
  } catch (error: any) {
    return handleRouteError(error, res, 'OAuth token verification');
  }
}
