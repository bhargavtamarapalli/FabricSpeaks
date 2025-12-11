/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role-based permissions for admin routes
 */

import { Request, Response, NextFunction } from 'express';
import { supabase as db } from '../db/supabase';
import { loggers } from '../utils/logger';
import { AppError } from '../utils/AppError';

/**
 * User roles in the system
 */
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * Role hierarchy (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.MODERATOR]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
};

/**
 * Get user role from database
 * 
 * @param userId - User ID
 * @returns User role
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await db
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      loggers.warn('Failed to fetch user role', {
        userId,
        error: error?.message,
      });
      return UserRole.USER; // Default to user role
    }

    return (data.role as UserRole) || UserRole.USER;
  } catch (error) {
    loggers.error('Error fetching user role', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return UserRole.USER;
  }
}

/**
 * Check if user has required role
 * 
 * @param userRole - User's current role
 * @param requiredRole - Required role
 * @returns true if user has required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * RBAC middleware factory
 * Creates middleware that checks if user has required role
 * 
 * @param requiredRole - Minimum required role
 * @returns Express middleware
 * 
 * @example
 * app.get('/api/admin/users', requireRole(UserRole.ADMIN), getUsersHandler);
 */
export function requireRole(requiredRole: UserRole) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user ID from session
      const userId = (req.session as any)?.userId;

      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      // Get user role
      const userRole = await getUserRole(userId);

      // Check if user has required role
      if (!hasRole(userRole, requiredRole)) {
        loggers.warn('Access denied - insufficient permissions', {
          userId,
          userRole,
          requiredRole,
          path: req.path,
          method: req.method,
        });

        throw AppError.forbidden('Insufficient permissions', {
          userRole,
          requiredRole,
        });
      }

      // Attach role to request for later use
      (req as any).userRole = userRole;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require admin role (admin or super_admin)
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Require super admin role
 */
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);

/**
 * Require moderator role or higher
 */
export const requireModerator = requireRole(UserRole.MODERATOR);

/**
 * Check if user is admin
 * 
 * @param userId - User ID
 * @returns true if user is admin or super_admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return hasRole(role, UserRole.ADMIN);
}

/**
 * Check if user is super admin
 * 
 * @param userId - User ID
 * @returns true if user is super_admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === UserRole.SUPER_ADMIN;
}

/**
 * Get all users with a specific role
 * 
 * @param role - Role to filter by
 * @returns Array of user profiles
 */
export async function getUsersByRole(role: UserRole): Promise<any[]> {
  try {
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('role', role);

    if (error) {
      throw new AppError(
        'Failed to fetch users by role',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    return data || [];
  } catch (error) {
    loggers.error('Error fetching users by role', {
      role,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Update user role
 * Only super admins can change roles
 * 
 * @param userId - User ID to update
 * @param newRole - New role
 * @param adminUserId - Admin performing the action
 * @returns Updated profile
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  adminUserId: string
): Promise<any> {
  try {
    // Check if admin has permission
    const adminRole = await getUserRole(adminUserId);
    if (!hasRole(adminRole, UserRole.SUPER_ADMIN)) {
      throw AppError.forbidden('Only super admins can change user roles');
    }

    // Prevent demoting the last super admin
    if (newRole !== UserRole.SUPER_ADMIN) {
      const superAdmins = await getUsersByRole(UserRole.SUPER_ADMIN);
      if (superAdmins.length === 1 && superAdmins[0].user_id === userId) {
        throw AppError.badRequest('Cannot demote the last super admin');
      }
    }

    // Update role
    const { data, error } = await db
      .from('profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        'Failed to update user role',
        500,
        'DATABASE_ERROR',
        { originalError: error.message }
      );
    }

    loggers.info('User role updated', {
      userId,
      newRole,
      adminUserId,
    });

    return data;
  } catch (error) {
    loggers.error('Error updating user role', {
      userId,
      newRole,
      adminUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
