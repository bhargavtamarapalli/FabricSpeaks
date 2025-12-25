/**
 * Protected Admin Route Component
 * 
 * Route wrapper that ensures only admin users can access admin pages.
 * Features:
 * - Role-based access control
 * - Automatic redirection for unauthorized users
 * - Loading states
 * - Permission checking
 * - Error handling
 * 
 * @example
 * <ProtectedAdminRoute>
 *   <AdminDashboard />
 * </ProtectedAdminRoute>
 */

import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminIdleMonitor } from '@/components/admin/AdminIdleMonitor';
import type { Permission } from '@/types/admin';

export interface ProtectedAdminRouteProps {
    /** Child components to render if authorized */
    children: ReactNode;

    /** Required permission (optional - defaults to checking admin role) */
    permission?: Permission;

    /** Redirect path for unauthorized users */
    redirectTo?: string;

    /** Show unauthorized message instead of redirecting */
    showUnauthorized?: boolean;
}

export function ProtectedAdminRoute({
    children,
    permission,
    redirectTo = '/admin/login', // Redirect to proper admin login
    showUnauthorized = false,
}: ProtectedAdminRouteProps) {
    const [, navigate] = useLocation();
    const { user, isLoading: authLoading } = useAuth();
    const { isAdmin, hasPermission, isLoading: adminLoading } = useAdminAuth();

    // Combined loading state
    const isLoading = authLoading || adminLoading;

    // Check authorization
    const isAuthorized = user && isAdmin && (!permission || hasPermission(permission));

    // DEBUG: Log authorization check
    console.log('[ProtectedAdminRoute] Authorization check:', {
        user: !!user,
        userRole: user?.role,
        isAdmin,
        permission,
        hasPermission: permission ? hasPermission(permission) : 'N/A',
        isAuthorized,
        isLoading,
        authLoading,
        adminLoading
    });

    useEffect(() => {
        // Don't redirect while loading
        if (isLoading) {
            return;
        }

        // Redirect if not authorized and showUnauthorized is false
        if (!isAuthorized && !showUnauthorized) {
            console.warn('[ProtectedAdminRoute] Unauthorized access attempt, redirecting to:', redirectTo);
            navigate(redirectTo);
        }
    }, [isLoading, isAuthorized, showUnauthorized, redirectTo, navigate]);

    // Loading state
    if (isLoading) {
        return <LoadingScreen />;
    }

    // Unauthorized state
    if (!isAuthorized) {
        if (showUnauthorized) {
            return <UnauthorizedScreen onGoHome={() => navigate(redirectTo)} />;
        }
        // Will redirect via useEffect
        return null;
    }

    // Authorized - render children wrapped with idle monitor
    return <AdminIdleMonitor>{children}</AdminIdleMonitor>;
}

/**
 * Loading Screen Component
 */
function LoadingScreen() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="text-center">
                {/* Animated logo */}
                <div className="mb-6 flex justify-center">
                    <div className="relative">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500" />
                        </div>
                    </div>
                </div>

                {/* Loading text */}
                <h2 className="text-xl font-semibold text-white">Loading Admin Panel</h2>
                <p className="mt-2 text-sm text-slate-400">Verifying your credentials...</p>

                {/* Loading dots */}
                <div className="mt-4 flex justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-2 w-2 animate-bounce rounded-full bg-indigo-500"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Unauthorized Screen Component
 */
interface UnauthorizedScreenProps {
    onGoHome: () => void;
}

function UnauthorizedScreen({ onGoHome }: UnauthorizedScreenProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
            <div className="w-full max-w-md text-center">
                {/* Error icon */}
                <div className="mb-6 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-8 ring-red-500/20">
                        <ShieldAlert className="h-10 w-10 text-red-400" />
                    </div>
                </div>

                {/* Error message */}
                <h1 className="text-3xl font-bold text-white">Access Denied</h1>
                <p className="mt-4 text-slate-400">
                    You don't have permission to access the admin panel.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                    If you believe this is an error, please contact your administrator.
                </p>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button
                        onClick={onGoHome}
                        className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600"
                    >
                        Go to Home
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                        Try Again
                    </Button>
                </div>

                {/* Help text */}
                <div className="mt-8 rounded-lg border border-slate-800/50 bg-slate-900/50 p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-400" />
                        <div className="text-left">
                            <p className="text-sm font-medium text-white">Need Admin Access?</p>
                            <p className="mt-1 text-xs text-slate-400">
                                Contact your system administrator to request admin privileges.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to require admin access
 * Throws error if user is not admin (for use in components)
 */
export function useRequireAdmin(permission?: Permission) {
    const { user, isLoading: authLoading } = useAuth();
    const { isAdmin, hasPermission, isLoading: adminLoading } = useAdminAuth();
    const [, navigate] = useLocation();

    const isLoading = authLoading || adminLoading;
    const isAuthorized = user && isAdmin && (!permission || hasPermission(permission));

    useEffect(() => {
        if (!isLoading && !isAuthorized) {
            console.warn('[useRequireAdmin] Unauthorized access, redirecting to login');
            navigate('/admin/login');
        }
    }, [isLoading, isAuthorized, navigate]);

    return {
        isLoading,
        isAuthorized,
        user,
        isAdmin,
        hasPermission,
    };
}
