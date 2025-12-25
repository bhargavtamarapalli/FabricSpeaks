/**
 * Quick Actions Component
 * 
 * Displays quick action buttons for common admin tasks.
 * Features:
 * - Icon-based actions
 * - Permission-based visibility
 * - Hover effects
 * - Responsive grid
 * - Customizable actions
 * 
 * @example
 * <QuickActions
 *   onAction={(action) => handleAction(action)}
 * />
 */

import { type LucideIcon, Plus, Eye, Send, BarChart3, Package, ShoppingCart, Users, Settings } from 'lucide-react';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { cn } from '@/lib/admin/utils';
import type { Permission } from '@/types/admin';

export interface QuickAction {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
    color: string;
    href?: string;
    permission?: Permission;
    onClick?: () => void;
}

export interface QuickActionsProps {
    /** Custom actions (overrides default) */
    actions?: QuickAction[];

    /** Action click handler */
    onAction?: (actionId: string) => void;

    /** Additional CSS classes */
    className?: string;
}

/**
 * Default quick actions
 */
const DEFAULT_ACTIONS: QuickAction[] = [
    {
        id: 'add-product',
        label: 'Add Product',
        description: 'Create a new product',
        icon: Plus,
        color: 'from-indigo-500 to-purple-500',
        href: '/admin/products/new',
        permission: 'manage_products',
    },
    {
        id: 'view-orders',
        label: 'View Orders',
        description: 'Manage orders',
        icon: ShoppingCart,
        color: 'from-pink-500 to-rose-500',
        href: '/admin/orders',
        permission: 'manage_orders',
    },
    {
        id: 'send-notification',
        label: 'Send Notification',
        description: 'Notify customers',
        icon: Send,
        color: 'from-green-500 to-emerald-500',
        href: '/admin/notifications',
        permission: 'manage_notifications',
    },
    {
        id: 'view-analytics',
        label: 'View Analytics',
        description: 'Check reports',
        icon: BarChart3,
        color: 'from-blue-500 to-cyan-500',
        href: '/admin/analytics',
        permission: 'view_analytics',
    },
    {
        id: 'manage-inventory',
        label: 'Manage Inventory',
        description: 'Update stock levels',
        icon: Package,
        color: 'from-orange-500 to-amber-500',
        href: '/admin/inventory',
        permission: 'manage_inventory',
    },
    {
        id: 'view-customers',
        label: 'View Customers',
        description: 'Customer management',
        icon: Users,
        color: 'from-purple-500 to-pink-500',
        href: '/admin/customers',
        permission: 'manage_customers',
    },
];

export function QuickActions({
    actions = DEFAULT_ACTIONS,
    onAction,
    className,
}: QuickActionsProps) {
    const { hasPermission } = useAdminAuth();

    // Filter actions based on permissions
    const visibleActions = actions.filter(
        (action) => !action.permission || hasPermission(action.permission)
    );

    const handleActionClick = (action: QuickAction) => {
        if (action.onClick) {
            action.onClick();
        } else if (onAction) {
            onAction(action.id);
        } else if (action.href) {
            window.location.href = action.href;
        }
    };

    return (
        <div className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}>
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">Quick Actions</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Common tasks and shortcuts
                </p>
            </div>

            {/* Actions Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleActions.map((action) => (
                    <QuickActionButton
                        key={action.id}
                        action={action}
                        onClick={() => handleActionClick(action)}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Individual Quick Action Button
 */
interface QuickActionButtonProps {
    action: QuickAction;
    onClick: () => void;
}

function QuickActionButton({ action, onClick }: QuickActionButtonProps) {
    const Icon = action.icon;

    return (
        <button
            onClick={onClick}
            className="group relative overflow-hidden rounded-lg border border-border bg-muted/30 p-4 text-left transition-all hover:border-primary/20 hover:bg-muted/50 hover:shadow-sm"
        >
            {/* Gradient overlay on hover */}
            <div className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-10',
                action.color
            )} />

            <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white transition-transform group-hover:scale-110',
                    action.color
                )}>
                    <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {action.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {action.description}
                    </p>
                </div>
            </div>
        </button>
    );
}

/**
 * Compact Quick Actions (for smaller spaces)
 */
export function QuickActionsCompact({
    actions = DEFAULT_ACTIONS.slice(0, 4),
    onAction,
    className,
}: QuickActionsProps) {
    const { hasPermission } = useAdminAuth();

    // Filter actions based on permissions
    const visibleActions = actions.filter(
        (action) => !action.permission || hasPermission(action.permission)
    );

    const handleActionClick = (action: QuickAction) => {
        if (action.onClick) {
            action.onClick();
        } else if (onAction) {
            onAction(action.id);
        } else if (action.href) {
            window.location.href = action.href;
        }
    };

    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            {visibleActions.map((action) => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className={cn(
                            'group flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition-all hover:scale-105 hover:shadow-md',
                            'hover:border-primary/50'
                        )}
                        title={action.description}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{action.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
