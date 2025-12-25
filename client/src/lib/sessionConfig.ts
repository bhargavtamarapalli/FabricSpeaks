/**
 * Session Configuration
 * 
 * Tiered session management:
 * - Regular Users: 30-day sessions with auto-refresh
 * - Admin Users: 8-hour sessions with 30-minute idle timeout
 */

// Session durations in milliseconds
export const SESSION_CONFIG = {
    // Regular user: 30 days
    USER_SESSION_DURATION: 30 * 24 * 60 * 60 * 1000,
    USER_REFRESH_THRESHOLD: 7 * 24 * 60 * 60 * 1000, // Refresh when < 7 days remaining

    // Admin user: 8 hours
    ADMIN_SESSION_DURATION: 8 * 60 * 60 * 1000,
    ADMIN_IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    ADMIN_IDLE_WARNING: 25 * 60 * 1000, // Warning at 25 minutes

    // Storage keys
    LAST_ACTIVITY_KEY: 'fs_last_activity',
    SESSION_START_KEY: 'fs_session_start',
    USER_ROLE_KEY: 'fs_user_role',
} as const;

/**
 * Check if a session token is about to expire
 */
export function shouldRefreshToken(expiresAt: number, isAdmin: boolean): boolean {
    const now = Date.now();
    const timeUntilExpiry = expiresAt * 1000 - now; // expiresAt is in seconds

    if (isAdmin) {
        // Admins don't get auto-refresh, they must re-authenticate
        return false;
    }

    // Regular users: refresh if less than 7 days remaining
    return timeUntilExpiry < SESSION_CONFIG.USER_REFRESH_THRESHOLD;
}

/**
 * Check if admin session has exceeded idle timeout
 */
export function isAdminIdleExpired(): boolean {
    const lastActivity = localStorage.getItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
    if (!lastActivity) return false;

    const idleTime = Date.now() - parseInt(lastActivity, 10);
    return idleTime >= SESSION_CONFIG.ADMIN_IDLE_TIMEOUT;
}

/**
 * Check if admin session has exceeded hard limit (8 hours)
 */
export function isAdminSessionExpired(): boolean {
    const sessionStart = localStorage.getItem(SESSION_CONFIG.SESSION_START_KEY);
    if (!sessionStart) return false;

    const sessionDuration = Date.now() - parseInt(sessionStart, 10);
    return sessionDuration >= SESSION_CONFIG.ADMIN_SESSION_DURATION;
}

/**
 * Get idle time remaining for admin (in ms)
 */
export function getAdminIdleTimeRemaining(): number {
    const lastActivity = localStorage.getItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
    if (!lastActivity) return SESSION_CONFIG.ADMIN_IDLE_TIMEOUT;

    const idleTime = Date.now() - parseInt(lastActivity, 10);
    return Math.max(0, SESSION_CONFIG.ADMIN_IDLE_TIMEOUT - idleTime);
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
    localStorage.setItem(SESSION_CONFIG.LAST_ACTIVITY_KEY, Date.now().toString());
}

/**
 * Initialize session tracking
 */
export function initializeSessionTracking(userRole: string): void {
    const now = Date.now().toString();
    localStorage.setItem(SESSION_CONFIG.LAST_ACTIVITY_KEY, now);
    localStorage.setItem(SESSION_CONFIG.SESSION_START_KEY, now);
    localStorage.setItem(SESSION_CONFIG.USER_ROLE_KEY, userRole);
}

/**
 * Clear session tracking
 */
export function clearSessionTracking(): void {
    localStorage.removeItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
    localStorage.removeItem(SESSION_CONFIG.SESSION_START_KEY);
    localStorage.removeItem(SESSION_CONFIG.USER_ROLE_KEY);
}

/**
 * Check if current user is admin based on stored role
 */
export function isStoredRoleAdmin(): boolean {
    const role = localStorage.getItem(SESSION_CONFIG.USER_ROLE_KEY);
    return role === 'admin';
}
