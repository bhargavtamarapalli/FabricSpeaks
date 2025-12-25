/**
 * Admin Idle Monitor Component
 * 
 * Tracks user activity and automatically logs out admin users
 * after 30 minutes of inactivity. Shows a warning at 25 minutes.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    SESSION_CONFIG,
    updateLastActivity,
    isAdminIdleExpired,
    isAdminSessionExpired,
    getAdminIdleTimeRemaining,
} from '@/lib/sessionConfig';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminIdleMonitorProps {
    children: React.ReactNode;
}

export function AdminIdleMonitor({ children }: AdminIdleMonitorProps) {
    const { user, logout } = useAuth();
    const [showWarning, setShowWarning] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const warningShownRef = useRef(false);
    const checkIntervalRef = useRef<NodeJS.Timeout>();

    const isAdmin = user?.role === 'admin';

    // Handle user activity
    const handleActivity = useCallback(() => {
        if (!isAdmin) return;

        updateLastActivity();
        setShowWarning(false);
        warningShownRef.current = false;
    }, [isAdmin]);

    // Handle continue session (dismiss warning)
    const handleContinueSession = () => {
        handleActivity();
        setShowWarning(false);
    };

    // Handle logout
    const handleLogout = useCallback(async () => {
        console.log('[AdminIdleMonitor] Logging out due to inactivity/session expiry');
        setShowWarning(false);
        await logout();
    }, [logout]);

    // Check session status
    const checkSession = useCallback(() => {
        if (!isAdmin) return;

        // Check hard session limit (8 hours)
        if (isAdminSessionExpired()) {
            console.log('[AdminIdleMonitor] Admin session expired (8 hour limit)');
            handleLogout();
            return;
        }

        // Check idle timeout (30 minutes)
        if (isAdminIdleExpired()) {
            console.log('[AdminIdleMonitor] Admin idle timeout (30 minutes)');
            handleLogout();
            return;
        }

        // Check if we should show warning (5 minutes before timeout)
        const remaining = getAdminIdleTimeRemaining();
        setTimeRemaining(Math.ceil(remaining / 1000)); // Convert to seconds

        if (remaining <= SESSION_CONFIG.ADMIN_IDLE_TIMEOUT - SESSION_CONFIG.ADMIN_IDLE_WARNING) {
            if (!warningShownRef.current) {
                console.log('[AdminIdleMonitor] Showing idle warning');
                setShowWarning(true);
                warningShownRef.current = true;
            }
        }
    }, [isAdmin, handleLogout]);

    // Set up activity listeners and check interval
    useEffect(() => {
        if (!isAdmin) return;

        // Initialize activity tracking
        updateLastActivity();

        // Activity events to track
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

        // Throttled activity handler (update at most once per second)
        let lastUpdate = 0;
        const throttledHandler = () => {
            const now = Date.now();
            if (now - lastUpdate >= 1000) {
                lastUpdate = now;
                handleActivity();
            }
        };

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, throttledHandler, { passive: true });
        });

        // Check session status every 10 seconds
        checkIntervalRef.current = setInterval(checkSession, 10000);

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, throttledHandler);
            });
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [isAdmin, handleActivity, checkSession]);

    // Format time remaining for display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {children}

            <AlertDialog open={showWarning && isAdmin} onOpenChange={setShowWarning}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-amber-600 dark:text-amber-400">
                            ⚠️ Session Timeout Warning
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Your admin session will expire due to inactivity in{' '}
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                    {formatTime(timeRemaining)}
                                </span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Click "Stay Logged In" to continue your session, or you will be
                                automatically logged out to protect your account.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleLogout}>
                            Log Out Now
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleContinueSession}>
                            Stay Logged In
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default AdminIdleMonitor;
