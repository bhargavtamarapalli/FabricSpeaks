/**
 * Admin Header Component
 * 
 * Top header bar for admin panel.
 * Features:
 * - Breadcrumbs navigation
 * - Search functionality
 * - Notifications bell
 * - User dropdown menu
 * - Theme toggle
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
    Menu,
    Search,
    Bell,
    User,
    Settings,
    LogOut,
    Sun,
    Moon,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { adminApi } from '@/lib/admin/api';
import { formatRelativeTime } from '@/lib/admin/utils';
import { useTheme } from '@/hooks/use-theme';

interface AdminHeaderProps {
    onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    const [location, setLocation] = useLocation();
    const [searchOpen, setSearchOpen] = useState(false);
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();

    // Generate breadcrumbs
    const breadcrumbs = getBreadcrumbs(location);

    const navigate = (path: string) => setLocation(path);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/auth/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Notifications Query
    const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
        queryKey: ['notifications', 'recent'],
        queryFn: async () => {
            const response = await adminApi.notifications.getHistory({
                status: 'sent',
                limit: 5
            });
            // Handle pagination response structure if needed, or assume array
            return Array.isArray(response) ? response : (response as any).data || [];
        },
        refetchInterval: 120000,
        enabled: !!user
    });

    const unreadCount = notifications?.filter((n: any) => !n.read_at).length || 0;

    return (
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
                {/* Left section */}
                <div className="flex items-center gap-4">
                    {/* Mobile menu button */}
                    <button
                        onClick={onMenuClick}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Breadcrumbs */}
                    <nav className="hidden items-center gap-2 text-sm md:flex">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.href} className="flex items-center gap-2">
                                {index > 0 && (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                {index === breadcrumbs.length - 1 ? (
                                    <span className="font-medium text-foreground">{crumb.label}</span>
                                ) : (
                                    <button
                                        onClick={() => navigate(crumb.href)}
                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {crumb.label}
                                    </button>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </button>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute right-1 top-1 flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500"></span>
                                    </span>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-80"
                        >
                            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-96 overflow-y-auto">
                                {isLoadingNotifications ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                                ) : notifications?.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
                                ) : (
                                    notifications?.map((notification: any) => (
                                        <NotificationItem
                                            key={notification.id}
                                            title={notification.title}
                                            description={notification.message}
                                            time={formatRelativeTime(notification.created_at)}
                                            unread={!notification.read_at}
                                        />
                                    ))
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer justify-center text-primary font-medium hover:text-primary/80"
                                onClick={() => navigate('/admin/notifications')}
                            >
                                View all notifications
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm transition-all hover:bg-muted">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-xs font-semibold text-white">
                                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <span className="hidden font-medium text-foreground md:block">
                                    {user?.username || 'Admin'}
                                </span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56"
                        >
                            <DropdownMenuLabel>
                                <div>
                                    <p className="font-medium text-foreground">{user?.username || 'Admin'}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => navigate('/admin/profile')}
                            >
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => navigate('/admin/settings')}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-500 focus:text-red-500 hover:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}

interface NotificationItemProps {
    title: string;
    description: string;
    time: string;
    unread?: boolean;
}

function NotificationItem({
    title,
    description,
    time,
    unread,
}: NotificationItemProps) {
    return (
        <div
            className={cn(
                'flex gap-3 border-b border-border/50 px-4 py-3 transition-colors hover:bg-muted/30',
                unread && 'bg-primary/5'
            )}
        >
            {unread && (
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
            )}
            <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
                <p className="text-xs text-muted-foreground">{time}</p>
            </div>
        </div>
    );
}

/**
 * Generate breadcrumbs from current path
 */
function getBreadcrumbs(path: string): { label: string; href: string }[] {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];

    let currentPath = '';
    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;

        // Capitalize and format label
        const label = segment
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        breadcrumbs.push({
            label,
            href: currentPath,
        });
    });

    return breadcrumbs;
}
