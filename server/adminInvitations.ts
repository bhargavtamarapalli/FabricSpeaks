/**
 * Admin Invitation System
 * Allows super admins to invite new admins via secure tokens
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from './db/supabase';
import { loggers } from './utils/logger';
import { AppError } from './utils/AppError';
import { UserRole, isSuperAdmin } from './middleware/rbac';
import { logAuditEvent } from './utils/auditLog';

/**
 * Admin invitation interface
 */
export interface AdminInvitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  invited_by: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

/**
 * Generate secure invitation token
 */
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create admin invitation
 * 
 * @param email - Email of user to invite
 * @param role - Role to assign
 * @param invitedBy - User ID of admin creating invitation
 * @returns Created invitation
 */
export async function createAdminInvitation(
  email: string,
  role: UserRole,
  invitedBy: string
): Promise<AdminInvitation> {
  try {
    // Verify inviter is super admin
    const isSuperAdminUser = await isSuperAdmin(invitedBy);
    if (!isSuperAdminUser) {
      throw AppError.forbidden('Only super admins can invite new admins');
    }

    // Validate role
    if (![UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role)) {
      throw AppError.badRequest('Invalid role for admin invitation');
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id, role')
      .eq('email', email)
      .single();

    if (existingProfile) {
      throw AppError.conflict('User already exists', {
        email,
        currentRole: existingProfile.role,
      });
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('email', email)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      throw AppError.conflict('Pending invitation already exists for this email');
    }

    // Generate token
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const { data, error } = await supabase
      .from('admin_invitations')
      .insert({
        email,
        role,
        token,
        invited_by: invitedBy,
        expires_at: expiresAt.toISOString(),
        used: false,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        'Failed to create invitation',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    loggers.info('Admin invitation created', {
      email,
      role,
      invitedBy,
      expiresAt,
    });

    // Log audit event
    await logAuditEvent({
      userId: invitedBy,
      action: 'CREATE',
      resourceType: 'ADMIN_USER',
      resourceId: data.id,
      changes: { email, role },
    });

    return data as AdminInvitation;
  } catch (error) {
    loggers.error('Failed to create admin invitation', {
      email,
      role,
      invitedBy,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Verify and accept invitation
 * 
 * @param token - Invitation token
 * @param userId - User ID accepting invitation
 * @returns Accepted invitation
 */
export async function acceptAdminInvitation(
  token: string,
  userId: string
): Promise<AdminInvitation> {
  try {
    // Find invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (fetchError || !invitation) {
      throw AppError.notFound('Invalid or expired invitation');
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      throw AppError.badRequest('Invitation has expired');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw AppError.notFound('User profile not found');
    }

    // Verify email matches
    if (profile.email !== invitation.email) {
      throw AppError.forbidden('Invitation email does not match user email');
    }

    // Update user role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: invitation.role,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new AppError(
        'Failed to update user role',
        500,
        'DATABASE_ERROR',
        { originalError: updateError.message }
      );
    }

    // Mark invitation as used
    const { error: markUsedError } = await supabase
      .from('admin_invitations')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_by: userId,
      })
      .eq('id', invitation.id);

    if (markUsedError) {
      loggers.error('Failed to mark invitation as used', {
        invitationId: invitation.id,
        error: markUsedError.message,
      });
    }

    loggers.info('Admin invitation accepted', {
      email: invitation.email,
      role: invitation.role,
      userId,
    });

    // Log audit event
    await logAuditEvent({
      userId: invitation.invited_by,
      action: 'UPDATE',
      resourceType: 'ADMIN_USER',
      resourceId: userId,
      changes: { accepted: true, role: invitation.role },
    });

    return invitation as AdminInvitation;
  } catch (error) {
    loggers.error('Failed to accept admin invitation', {
      token,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * List pending invitations
 * 
 * @param adminUserId - Admin user ID
 * @returns Array of pending invitations
 */
export async function listPendingInvitations(
  adminUserId: string
): Promise<AdminInvitation[]> {
  try {
    // Verify admin
    const isSuperAdminUser = await isSuperAdmin(adminUserId);
    if (!isSuperAdminUser) {
      throw AppError.forbidden('Only super admins can view invitations');
    }

    const { data, error } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(
        'Failed to fetch invitations',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    return (data || []) as AdminInvitation[];
  } catch (error) {
    loggers.error('Failed to list pending invitations', {
      adminUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Revoke invitation
 * 
 * @param invitationId - Invitation ID
 * @param adminUserId - Admin user ID
 */
export async function revokeInvitation(
  invitationId: string,
  adminUserId: string
): Promise<void> {
  try {
    // Verify admin
    const isSuperAdminUser = await isSuperAdmin(adminUserId);
    if (!isSuperAdminUser) {
      throw AppError.forbidden('Only super admins can revoke invitations');
    }

    const { error } = await supabase
      .from('admin_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      throw new AppError(
        'Failed to revoke invitation',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    loggers.info('Admin invitation revoked', {
      invitationId,
      revokedBy: adminUserId,
    });

    // Log audit event
    await logAuditEvent({
      userId: adminUserId,
      action: 'DELETE',
      resourceType: 'ADMIN_USER',
      resourceId: invitationId,
    });
  } catch (error) {
    loggers.error('Failed to revoke invitation', {
      invitationId,
      adminUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Route handlers
 */

export async function inviteAdminHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      throw AppError.unauthorized();
    }

    const { email, role } = req.body;

    if (!email || !role) {
      throw AppError.badRequest('Email and role are required');
    }

    const invitation = await createAdminInvitation(email, role, userId);

    // In production, send email with invitation link
    const invitationLink = `${process.env.APP_URL}/admin/accept-invitation?token=${invitation.token}`;

    res.status(201).json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        invitationLink, // Remove in production, send via email
      },
      message: 'Invitation created successfully',
    });
  } catch (error) {
    throw error;
  }
}

export async function acceptInvitationHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      throw AppError.unauthorized();
    }

    const { token } = req.body;

    if (!token) {
      throw AppError.badRequest('Token is required');
    }

    const invitation = await acceptAdminInvitation(token, userId);

    res.json({
      message: 'Invitation accepted successfully',
      role: invitation.role,
    });
  } catch (error) {
    throw error;
  }
}

export async function listInvitationsHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      throw AppError.unauthorized();
    }

    const invitations = await listPendingInvitations(userId);

    res.json({
      invitations,
      count: invitations.length,
    });
  } catch (error) {
    throw error;
  }
}

export async function revokeInvitationHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      throw AppError.unauthorized();
    }

    const { id } = req.params;

    if (!id) {
      throw AppError.badRequest('Invitation ID is required');
    }

    await revokeInvitation(id, userId);

    res.json({
      message: 'Invitation revoked successfully',
    });
  } catch (error) {
    throw error;
  }
}
