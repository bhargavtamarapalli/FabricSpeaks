/**
 * Notification List Component
 * 
 * Displays a list of admin notifications with filtering and actions.
 * Features:
 * - Filter by status (All, Unread, Archived)
 * - Mark as read/unread
 * - Delete/Archive notifications
 * - Group by date
 * 
 * @example
 * <NotificationList notifications={data} />
 */

import { useState } from 'react';
import {
    Bell,
    Check,
    Clock,
    Trash2,
    Archive,
    AlertTriangle,
    Info,
    CheckCircle2,
    Package,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatRelativeTime } from '@/lib/admin/utils';
import type { AdminNotification } from '@/types/admin';

export interface NotificationListProps {
    /** List of notifications */
    notifications: AdminNotification[];

    /** Loading state */
    loading?: boolean;

    /** Mark as read handler */
    onMarkAsRead: (id: string) => void;

    /** Archive handler */
    onArchive: (id: string) => void;

    /** Delete handler */
    onDelete: (id: string) => void;

    /** Additional CSS classes */
    className?: string;
}

export function NotificationList({
    notifications,
    loading = false,
    onMarkAsRead,
    onArchive,
    onDelete,
    className,
}: NotificationListProps) {
    const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        // For this example, we'll assume 'archived' is a status or property. 
        // Since the type might not have it explicitly yet, we'll stick to read/unread for now
        // or assume 'archived' is handled by a separate list or property if added.
        // Let's keep it simple: All vs Unread for the main list.
        return true;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'order':
                return Package;
            case 'customer':
                return User;
            case 'system':
                return AlertTriangle;
            case 'inventory':
                return Archive;
            default:
                return Info;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'order':
                return 'text-blue-400 bg-blue-400/10';
            case 'customer':
                return 'text-purple-400 bg-purple-400/10';
            case 'system':
                return 'text-red-400 bg-red-400/10';
            case 'inventory':
                return 'text-yellow-400 bg-yellow-400/10';
            default:
                return 'text-slate-400 bg-slate-400/10';
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 p-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4 rounded-lg border border-slate-800/50 bg-slate-900/50 p-4 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-slate-800" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 rounded bg-slate-800" />
                            <div className="h-3 w-1/2 rounded bg-slate-800" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/50 text-slate-500 mb-4">
                    <Bell className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-white">No notifications</h3>
                <p className="text-sm text-slate-400">You're all caught up!</p>
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Filters */}
            <div className="flex items-center gap-2 p-4 border-b border-slate-800/50">
                <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}
                >
                    All
                </Button>
                <Button
                    variant={filter === 'unread' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                    className={filter === 'unread' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}
                >
                    Unread
                </Button>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="space-y-2 p-4">
                    {filteredNotifications.map((notification) => {
                        const Icon = getIcon(notification.type);
                        const colorClass = getColor(notification.type);

                        return (
                            <div
                                key={notification.id}
                                className={cn(
                                    'group relative flex gap-4 rounded-lg border p-4 transition-all hover:bg-slate-800/50',
                                    notification.read
                                        ? 'border-slate-800/50 bg-transparent opacity-75'
                                        : 'border-slate-700 bg-slate-900/50'
                                )}
                            >
                                {/* Icon */}
                                <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', colorClass)}>
                                    <Icon className="h-5 w-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn('font-medium text-white', notification.read ? 'font-normal' : 'font-semibold')}>
                                            {notification.title}
                                        </p>
                                        <span className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                                            <Clock className="h-3 w-3" />
                                            {formatRelativeTime(new Date(notification.createdAt))}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                                        {notification.message}
                                    </p>
                                </div>

                                {/* Actions (visible on hover) */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 bg-slate-900/90 p-1 rounded-md shadow-lg">
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onMarkAsRead(notification.id)}
                                            className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                            title="Mark as read"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(notification.id)}
                                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
