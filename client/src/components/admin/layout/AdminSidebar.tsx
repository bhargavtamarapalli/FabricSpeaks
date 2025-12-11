/**
 * Admin Sidebar Component
 * 
 * Navigation sidebar for admin panel.
 * Features:
 * - Collapsible design
 * - Active route highlighting
 * - Permission-based navigation
 * - Mobile responsive
 * - Smooth animations
 */

import { Link, useLocation } from 'wouter';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { ADMIN_NAV_ITEMS } from '@/lib/admin/constants';
import { cn } from '@/lib/admin/utils';

export interface AdminSidebarProps {
    isOpen: boolean;
    isMobileOpen: boolean;
    onToggle: () => void;
    onMobileClose: () => void;
}

export function AdminSidebar({
    isOpen,
    isMobileOpen,
    onToggle,
    onMobileClose,
}: AdminSidebarProps) {
    const [location] = useLocation();
    const { hasPermission } = useAdminAuth();

    // Filter nav items based on permissions
    const visibleNavItems = ADMIN_NAV_ITEMS.filter(
        (item) => !item.permission || hasPermission(item.permission)
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-border bg-card/95 backdrop-blur-xl transition-all duration-300 ease-in-out lg:flex',
                    isOpen ? 'w-64' : 'w-20'
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-border px-4">
                    {isOpen ? (
                        <Link href="/admin">
                            <a className="flex items-center gap-2 text-xl font-bold text-foreground">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500">
                                    FS
                                </span>
                                <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                                    Admin
                                </span>
                            </a>
                        </Link>
                    ) : (
                        <Link href="/admin">
                            <a className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 text-sm font-bold text-white">
                                FS
                            </a>
                        </Link>
                    )}

                    {/* Toggle button */}
                    <button
                        onClick={onToggle}
                        className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
                            !isOpen && 'hidden'
                        )}
                    >
                        {isOpen ? (
                            <ChevronLeft className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    {visibleNavItems.map((item) => (
                        <NavItem
                            key={item.href}
                            item={item}
                            isActive={location === item.href || location.startsWith(item.href + '/')}
                            isCollapsed={!isOpen}
                        />
                    ))}
                </nav>

                {/* User section */}
                <div className="border-t border-slate-800/50 p-4">
                    {isOpen ? (
                        <Link href="/">
                            <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-xs font-semibold text-white">
                                    AD
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate font-medium text-foreground">Admin User</p>
                                    <p className="truncate text-xs">View Store</p>
                                </div>
                            </a>
                        </Link>
                    ) : (
                        <Link href="/">
                            <a className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-xs font-semibold text-white">
                                AD
                            </a>
                        </Link>
                    )}
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 h-screen w-64 flex-col border-r border-border bg-card/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:hidden',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-slate-800/50 px-4">
                    <Link href="/admin">
                        <a
                            className="flex items-center gap-2 text-xl font-bold text-foreground"
                            onClick={onMobileClose}
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500">
                                FS
                            </span>
                            <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                                Admin
                            </span>
                        </a>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    {visibleNavItems.map((item) => (
                        <NavItem
                            key={item.href}
                            item={item}
                            isActive={location === item.href || location.startsWith(item.href + '/')}
                            isCollapsed={false}
                            onClick={onMobileClose}
                        />
                    ))}
                </nav>

                {/* User section */}
                <div className="border-t border-slate-800/50 p-4">
                    <Link href="/">
                        <a
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-white"
                            onClick={onMobileClose}
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-xs font-semibold text-white">
                                AD
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate font-medium text-white">Admin User</p>
                                <p className="truncate text-xs">View Store</p>
                            </div>
                        </a>
                    </Link>
                </div>
            </aside>
        </>
    );
}

interface NavItemProps {
    item: {
        label: string;
        href: string;
        icon: LucideIcon;
        badge?: string;
    };
    isActive: boolean;
    isCollapsed: boolean;
    onClick?: () => void;
}

function NavItem({ item, isActive, isCollapsed, onClick }: NavItemProps) {
    const Icon = item.icon;

    return (
        <Link href={item.href}>
            <a
                onClick={onClick}
                className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                        ? 'bg-gradient-to-r from-indigo-500/20 to-pink-500/20 text-white shadow-lg shadow-indigo-500/10'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    isCollapsed && 'justify-center'
                )}
            >
                {/* Active indicator */}
                {isActive && (
                    <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-pink-500" />
                )}

                {/* Icon */}
                <Icon
                    className={cn(
                        'h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110',
                        isActive && 'text-indigo-400'
                    )}
                />

                {/* Label */}
                {!isCollapsed && (
                    <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-500 px-1.5 text-xs font-semibold text-white">
                                {item.badge}
                            </span>
                        )}
                    </>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                    <div className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-lg bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-xl group-hover:block">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-popover" />
                    </div>
                )}
            </a>
        </Link>
    );
}
