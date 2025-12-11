/**
 * Admin Authentication Hook
 * 
 * Custom hook for managing admin authentication and authorization.
 * Features:
 * - Check if user is admin
 * - Get user permissions
 * - Check specific permissions
 * - Handle admin-specific auth logic
 */

import { useAuth } from '@/hooks/useAuth';
import { ROLE_PERMISSIONS } from '@/lib/admin/constants';
import type { Permission } from '@/types/admin';
import { useMemo } from 'react';

export interface AdminAuthState {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  role: string | null;
  isLoading: boolean;
}

/**
 * Hook to manage admin authentication and permissions
 */
export function useAdminAuth(): AdminAuthState {
  const { user, isLoading } = useAuth();

  const adminState = useMemo(() => {
    // If loading or no user, return default state
    if (isLoading || !user) {
      return {
        isAdmin: false,
        isSuperAdmin: false,
        permissions: [] as Permission[],
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        role: null,
        isLoading,
      };
    }

    // Check if user is admin
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isSuperAdmin = user.role === 'super_admin';

    // Get permissions based on role
    const permissions: Permission[] = ROLE_PERMISSIONS[user.role] || [];

    // Helper function to check single permission
    const hasPermission = (permission: Permission): boolean => {
      return permissions.includes(permission);
    };

    // Helper function to check if user has any of the given permissions
    const hasAnyPermission = (perms: Permission[]): boolean => {
      return perms.some(perm => permissions.includes(perm));
    };

    // Helper function to check if user has all of the given permissions
    const hasAllPermissions = (perms: Permission[]): boolean => {
      return perms.every(perm => permissions.includes(perm));
    };

    return {
      isAdmin,
      isSuperAdmin,
      permissions,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      role: user.role,
      isLoading: false,
    };
  }, [user, isLoading]);

  return adminState;
}

/**
 * Hook to require admin access
 * Throws error if user is not admin
 */
export function useRequireAdmin(): AdminAuthState {
  const adminAuth = useAdminAuth();

  if (!adminAuth.isLoading && !adminAuth.isAdmin) {
    throw new Error('Admin access required');
  }

  return adminAuth;
}

/**
 * Hook to require specific permission
 * Throws error if user doesn't have permission
 */
export function useRequirePermission(permission: Permission): AdminAuthState {
  const adminAuth = useAdminAuth();

  if (!adminAuth.isLoading && !adminAuth.hasPermission(permission)) {
    throw new Error(`Permission required: ${permission}`);
  }

  return adminAuth;
}
