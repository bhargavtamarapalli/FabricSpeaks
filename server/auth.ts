import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { db } from "./db/supabase";
import { profiles, loginAttempts, passwordResets, verifications } from "../shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { ERROR_CODES, handleRouteError } from "./utils/errors";
import { whatsappService } from "./services/whatsapp-notifications";
import { formatNotification } from "./services/notification-templates";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Strong password regex: At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8).regex(passwordRegex, "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"),
  full_name: z.string().optional()
});
const loginSchema = z.object({ username: z.string(), password: z.string() });

export async function registerHandler(req: Request, res: Response) {
  console.log('[AUTH] Registration request received');

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMessage = parsed.error.errors[0].message;
    console.log('[AUTH] Validation failed:', errorMessage);
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: errorMessage });
  }
  const { username, password, full_name } = parsed.data;

  try {
    // Enhanced phone number detection for Indian numbers
    const isEmail = username.includes('@');
    // Detect 10-digit (Indian mobile) or 11-digit (with country code prefix)
    const isMobile = /^[6-9][0-9]{9,10}$/.test(username); // Indian mobile: starts with 6-9, total 10-11 digits

    console.log('[AUTH] Username type detection:', { username, isEmail, isMobile });

    // Auto-detect and transform phone numbers
    let finalUsername = username;
    let phoneNumber = null;

    if (isMobile) {
      // If username is a phone number, extract it and generate a proper username
      phoneNumber = username;
      finalUsername = `user_${username}`; // Generate username like "user_7898986671"
      console.log('[AUTH] Phone number detected, auto-generating username:', { phoneNumber, finalUsername });
    }

    // Check if username already exists
    console.log('[AUTH] Checking if user exists:', finalUsername);
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.username, finalUsername)
    });
    if (existingProfile) {
      console.log('[AUTH] User already exists');
      return res.status(409).json({ code: "USER_EXISTS", message: "User already exists" });
    }

    // Create Supabase Auth user
    // For mobile numbers, we create a fake email. For emails, use the actual email.
    const authEmail = isEmail ? username : `${phoneNumber || username}@fabric-speaks.local`;
    console.log('[AUTH] Creating Supabase user with email:', authEmail);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true, // Auto-confirm for mobile numbers, they don't have email
      user_metadata: {
        full_name,
        is_mobile: isMobile,
        original_identifier: username,
        phone: phoneNumber
      }
    });

    if (authError) {
      console.error('[AUTH] Supabase auth error:', authError);
      throw authError;
    }

    console.log('[AUTH] Supabase user created:', authData.user.id);

    // Create profile record with proper phone field
    console.log('[AUTH] Creating profile record');
    const [created] = await (db as any).insert(profiles).values({
      user_id: authData.user.id,
      username: finalUsername,
      full_name,
      role: 'user',
      email: isEmail ? username : null,
      phone: phoneNumber || (isMobile ? username : null)
    }).returning();

    console.log('[AUTH] Profile created:', created.id);

    // Determine success message based on identifier type
    let successMessage;
    if (isMobile) {
      successMessage = "Registration successful! You can now log in with your mobile number.";
    } else if (isEmail) {
      successMessage = "Registration successful! Please check your email to verify your account before logging in.";
    } else {
      successMessage = "Registration successful! You can now log in.";
    }

    console.log('[AUTH] Registration successful for:', username);
    return res.status(201).json({
      id: created.id,
      user_id: authData.user.id,
      username: created.username,
      role: created.role,
      message: successMessage,
      requires_verification: isEmail && !isMobile
    });
  } catch (error: any) {
    console.error('[AUTH] Register handler error:', error);
    return handleRouteError(error, res, 'User registration');
  }
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Invalid payload" });
  const { username, password } = parsed.data;

  console.log(`[AUTH] Login attempt for: ${username}`);

  try {
    // Determine if username is an email or username
    const isEmail = username.includes('@');
    const email = isEmail ? username : `${username}@fabric-speaks.local`;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.user) {
      console.log(`[AUTH] Login failed for ${username}: ${authError?.message}`);
      // 🆕 Log failed login attempt
      try {
        await (db as any).insert(loginAttempts).values({
          username,
          ip_address: ipAddress,
          user_agent: req.headers['user-agent'] || 'unknown',
          success: false,
          failure_reason: authError?.message || 'Invalid credentials',
          created_at: new Date()
        });

        // Check for multiple failed attempts in last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentFailures = await db.query.loginAttempts.findMany({
          where: and(
            eq(loginAttempts.username, username),
            eq(loginAttempts.success, false),
            gte(loginAttempts.created_at, fifteenMinutesAgo)
          )
        });

        // Send security alert if 5+ failed attempts
        if (recentFailures.length >= 5) {
          await whatsappService.send(formatNotification('security_failed_login', {
            username,
            attempt_count: recentFailures.length,
            ip_address: ipAddress,
            location: 'Unknown', // TODO: Add IP geolocation
            time: new Date().toLocaleString()
          }));
        }
      } catch (logError) {
        console.error('Failed to log login attempt:', logError);
      }

      return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
    }

    // Get profile data
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.user_id, authData.user.id)
    });
    if (!profile) {
      return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
    }

    console.log(`[AUTH] Login success for ${username} (ID: ${profile.id})`);

    // 🆕 Log successful login
    try {
      await (db as any).insert(loginAttempts).values({
        username,
        ip_address: ipAddress,
        user_agent: req.headers['user-agent'] || 'unknown',
        success: true,
        created_at: new Date()
      });
    } catch (logError) {
      console.error('Failed to log successful login:', logError);
    }

    // Do not use server session for bearer-token flow. Return session/token to client so it can be used as Bearer token.
    return res.status(200).json({ session: authData.session ?? null, user: { id: profile.id, username: profile.username, role: profile.role } });
  } catch (error: any) {
    return handleRouteError(error, res, 'User login');
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    // For bearer-token flow, client should sign out locally. Server simply acknowledges.
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    // For logout, we still return success even on error to avoid issues
    return res.status(200).json({ ok: true });
  }
}

export async function meHandler(req: Request, res: Response) {
  // Expect requireAuth middleware to populate req.user
  const profile = (req as any).user as any;
  console.log(`[AUTH] /me requested by: ${profile?.username} (ID: ${profile?.id})`);

  if (!profile) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });

  try {
    // Fetch full profile from database
    const [fullProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profile.id))
      .limit(1);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUTH] Profile data returning:', { id: profile.id, role: profile.role, email: profile.email });
    }

    if (!fullProfile) {
      // Return basic profile if full profile not found
      return res.status(200).json({
        id: profile.id,
        username: profile.username,
        role: profile.role
      });
    }

    return res.status(200).json({
      id: fullProfile.id,
      username: fullProfile.username,
      role: fullProfile.role,
      full_name: fullProfile.full_name,
      email: fullProfile.email,
      phone: fullProfile.phone,
      email_verified: fullProfile.email_verified,
      phone_verified: fullProfile.phone_verified,
      avatar_url: fullProfile.avatar_url,
    });
  } catch (error) {
    console.error('[DEBUG] meHandler error:', error);
    // Fallback to basic profile
    return res.status(200).json({
      id: profile.id,
      username: profile.username,
      role: profile.role
    });
  }
}

export async function initiateVerificationHandler(req: Request, res: Response) {
  const { type, identifier } = req.body; // type: 'email' | 'phone'
  const profile = (req as any).user;

  if (!profile) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  if (!identifier || (type !== 'email' && type !== 'phone')) {
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Invalid verification request" });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await (db as any).insert(verifications).values({
      type,
      identifier,
      otp,
      expires_at: expiresAt
    });

    // Send OTP
    if (type === 'phone') {
      await whatsappService.sendToCustomer(
        identifier,
        `Your Fabric Speaks verification code is: ${otp}. Valid for 15 minutes.`
      );
    } else {
      // Send Email (Mock for now or implement email service)
      console.log(`[AUTH] Email OTP for ${identifier}: ${otp}`);
      // TODO: Implement actual email sending
    }

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    return handleRouteError(error, res, "Initiate verification");
  }
}

export async function confirmVerificationHandler(req: Request, res: Response) {
  const { type, identifier, otp } = req.body;
  const profile = (req as any).user;

  if (!profile) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });

  try {
    const validOtp = await db.query.verifications.findFirst({
      where: and(
        eq(verifications.type, type),
        eq(verifications.identifier, identifier),
        eq(verifications.otp, otp),
        eq(verifications.verified, false),
        gte(verifications.expires_at, new Date())
      ),
      orderBy: (verifications, { desc }) => [desc(verifications.created_at)]
    });

    if (!validOtp) {
      return res.status(400).json({ code: "INVALID_OTP", message: "Invalid or expired OTP" });
    }

    // Mark verified in verifications table
    await (db as any).update(verifications)
      .set({ verified: true })
      .where(eq(verifications.id, validOtp.id));

    // Update Profile
    const updateData: any = {};
    if (type === 'email') updateData.email_verified = true;
    if (type === 'phone') updateData.phone_verified = true;

    // Use full profile update logic or just partial?
    // Safety check: ensure we are updating the correct user
    await (db as any).update(profiles)
      .set(updateData)
      .where(eq(profiles.user_id, profile.user_id));

    return res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    return handleRouteError(error, res, "Confirm verification");
  }
}

export async function updateMeHandler(req: Request, res: Response) {
  const profile = (req as any).user as any;
  console.log(`[AUTH] Update profile request for: ${profile?.id}`);

  if (!profile) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });

  const { full_name, email, phone, avatar_url } = req.body;

  try {
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    updateData.updated_at = new Date();

    console.log('[AUTH] Updating profile data:', updateData);

    const [updated] = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.id, profile.id))
      .returning();

    if (!updated) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Profile not found" });
    }

    return res.status(200).json({
      id: updated.id,
      username: updated.username,
      role: updated.role,
      full_name: updated.full_name,
      email: updated.email,
      phone: updated.phone,
      avatar_url: updated.avatar_url,
    });
  } catch (error) {
    console.error('[AUTH] Update profile error:', error);
    return handleRouteError(error, res, 'Update profile');
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Email or Phone is required" });

  try {
    const isMobile = /^[6-9][0-9]{9,10}$/.test(email);

    if (isMobile) {
      // Phone Reset Flow
      const phone = email;
      console.log('[AUTH] OTP Reset requested for phone:', phone);

      // Find user by phone
      const profile = await db.query.profiles.findFirst({
        where: sql`${profiles.phone} = ${phone} OR ${profiles.username} = ${phone} OR ${profiles.username} = ${`user_${phone}`}`
      });

      if (profile) {
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Store OTP
        await (db as any).insert(passwordResets).values({
          phone: profile.phone || phone, // Use profile specific phone if available
          otp,
          expires_at: expiresAt
        });

        // Send WhatsApp
        await whatsappService.sendToCustomer(
          profile.phone || phone,
          `Your Fabric Speaks password reset code is: ${otp}. Valid for 15 minutes.`
        );
        console.log(`[AUTH] OTP sent to ${phone}`);
      } else {
        console.log(`[AUTH] Phone user not found: ${phone}`);
      }

      return res.status(200).json({
        message: "If an account exists, an OTP has been sent to your phone.",
        isPhone: true
      });

    } else {
      // Email Reset Flow (Existing)
      const redirectUrl = `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000'}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      return res.status(200).json({ message: "Password reset email sent", isPhone: false });
    }
  } catch (error: any) {
    console.error('Password reset error:', error);
    return res.status(200).json({ message: "If an account exists, instructions have been sent." });
  }
}

export async function confirmResetPasswordHandler(req: Request, res: Response) {
  const { identifier, otp, newPassword } = req.body;

  if (!identifier || !otp || !newPassword) {
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Missing required fields" });
  }

  // Validate password strength
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      code: "WEAK_PASSWORD",
      message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    });
  }

  try {
    // 1. Verify OTP
    const validOtp = await db.query.passwordResets.findFirst({
      where: and(
        eq(passwordResets.phone, identifier),
        eq(passwordResets.otp, otp),
        eq(passwordResets.used, false),
        gte(passwordResets.expires_at, new Date())
      ),
      orderBy: (passwordResets, { desc }) => [desc(passwordResets.created_at)]
    });

    if (!validOtp) {
      return res.status(400).json({ code: "INVALID_OTP", message: "Invalid or expired OTP" });
    }

    // 2. Find User
    const profile = await db.query.profiles.findFirst({
      where: sql`${profiles.phone} = ${identifier} OR ${profiles.username} = ${identifier} OR ${profiles.username} = ${`user_${identifier}`}`
    });

    if (!profile) {
      return res.status(404).json({ code: "USER_NOT_FOUND", message: "User not found" });
    }

    // 3. Update Password in Supabase
    const { error } = await supabase.auth.admin.updateUserById(profile.user_id, {
      password: newPassword
    });

    if (error) throw error;

    // 4. Mark OTP as used
    await (db as any).update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.id, validOtp.id));

    return res.status(200).json({ message: "Password updated successfully. You can now login." });

  } catch (error: any) {
    return handleRouteError(error, res, 'Confirm password reset');
  }
}

export async function updatePasswordHandler(req: Request, res: Response) {
  const { password } = req.body;
  // req.user is populated by requireAuth middleware
  const user = (req as any).user;

  if (!password) return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Password is required" });
  if (!user || !user.user_id) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });

  // Validate strong password
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ code: "WEAK_PASSWORD", message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character" });
  }

  try {
    // Use Admin API to update user by ID since we are using Service Role Key
    const { error } = await supabase.auth.admin.updateUserById(user.user_id, { password });
    if (error) throw error;

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error: any) {
    return handleRouteError(error, res, 'Update password');
  }
}

export async function deleteUserHandler(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });

  try {
    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(user.user_id);
    if (authError) throw authError;

    // Delete from profiles (optional, depending on cascade settings, but good to be explicit)
    // Note: If you have ON DELETE CASCADE in your DB, this might be redundant or fail if already deleted.
    // We'll attempt it safely.
    await (db as any).delete(profiles).where(eq(profiles.user_id, user.user_id));

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error: any) {
    return handleRouteError(error, res, 'Delete account');
  }
}

// Admin only: Delete any user
export async function adminDeleteUserHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ code: "INVALID_PAYLOAD", message: "User ID is required" });

  try {
    // Get profile to find Supabase user_id
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, id)
    });

    if (!profile) {
      return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });
    }

    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(profile.user_id);
    if (authError) throw authError;

    // Delete from profiles
    await (db as any).delete(profiles).where(eq(profiles.id, id));

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    return handleRouteError(error, res, 'Admin delete user');
  }
}

// Admin only: Update user role
export async function adminUpdateRoleHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.body;

  if (!id || !role) return res.status(400).json({ code: "INVALID_PAYLOAD", message: "ID and role are required" });
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ code: "INVALID_ROLE", message: "Invalid role" });

  try {
    const [updated] = await (db as any).update(profiles)
      .set({ role })
      .where(eq(profiles.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });
    }

    return res.status(200).json({ message: "Role updated successfully", user: updated });
  } catch (error: any) {
    return handleRouteError(error, res, 'Admin update role');
  }
}

// Admin only: List all users
export async function listUsersHandler(req: Request, res: Response) {
  try {
    const allProfiles = await db.query.profiles.findMany({
      orderBy: (profiles, { desc }) => [desc(profiles.created_at)]
    });
    return res.status(200).json(allProfiles);
  } catch (error: any) {
    return handleRouteError(error, res, 'List users');
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
  next();
}
