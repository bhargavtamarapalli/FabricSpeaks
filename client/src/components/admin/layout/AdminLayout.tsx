/**
 * Admin Layout Component
 * 
 * Main layout wrapper for all admin pages.
 * Features:
 * - Responsive sidebar navigation
 * - Top header with breadcrumbs
 * - Content area with proper spacing
 * - Mobile-friendly design
 * - Dark mode support
 * - Global Error Boundary
 * - Command Palette
 */

import { useState, type ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { CommandPalette } from '@/components/admin/CommandPalette';
import { cn } from '@/lib/admin/utils';

export interface AdminLayoutProps {
    children: ReactNode;
    className?: string;
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Mobile sidebar overlay */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <AdminSidebar
                isOpen={sidebarOpen}
                isMobileOpen={mobileSidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />

            {/* Main content area */}
            <div
                className={cn(
                    'transition-all duration-300 ease-in-out',
                    sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
                )}
            >
                {/* Header */}
                <AdminHeader
                    onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                    sidebarOpen={sidebarOpen}
                />

                {/* Page content */}
                <main className={cn('p-4 lg:p-6', className)}>
                    <div className="mx-auto max-w-7xl">
                        <AdminErrorBoundary>
                            {children}
                        </AdminErrorBoundary>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-border/50 bg-muted/30 px-4 py-6 lg:px-6">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <p className="text-sm text-muted-foreground">
                                © {new Date().getFullYear()} Fabric Speaks. All rights reserved.
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <a
                                    href="/help"
                                    className="transition-colors hover:text-foreground"
                                >
                                    Help
                                </a>
                                <span>•</span>
                                <a
                                    href="/privacy"
                                    className="transition-colors hover:text-foreground"
                                >
                                    Privacy
                                </a>
                                <span>•</span>
                                <a
                                    href="/terms"
                                    className="transition-colors hover:text-foreground"
                                >
                                    Terms
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Global Command Palette */}
            <CommandPalette />
        </div>
    );
}
