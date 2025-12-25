/**
 * Recent Orders Component
 * 
 * Displays a list of recent orders with status and quick actions.
 * Features:
 * - Real-time order updates
 * - Status badges
 * - Quick view/edit actions
 * - Loading states
 * - Empty state
 * - Responsive design
 * 
 * @example
 * <RecentOrders
 *   orders={recentOrders}
 *   loading={false}
 *   onViewOrder={(id) => navigate(`/admin/orders/${id}`)}
 * />
 */

import { Eye, Package, Clock } from 'lucide-react';
import { formatCurrency, formatRelativeTime, getStatusColor, getStatusLabel, cn } from '@/lib/admin/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { RecentOrder } from '@/types/admin';

export interface RecentOrdersProps {
    /** List of recent orders */
    orders: RecentOrder[];

    /** Maximum number of orders to display */
    maxOrders?: number;

    /** Loading state */
    loading?: boolean;

    /** Error state */
    error?: Error | null;

    /** View order handler */
    onViewOrder?: (orderId: string) => void;

    /** View all orders handler */
    onViewAll?: () => void;

    /** Additional CSS classes */
    className?: string;
}

export function RecentOrders({
    orders,
    maxOrders = 5,
    loading = false,
    error = null,
    onViewOrder,
    onViewAll,
    className,
}: RecentOrdersProps) {
    // Limit orders to maxOrders
    const displayOrders = orders?.slice(0, maxOrders) || [];

    // Loading skeleton
    if (loading) {
        return (
            <div className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32 bg-muted" />
                        <Skeleton className="h-8 w-20 bg-muted" />
                    </div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
                                <Skeleton className="h-12 w-12 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32 bg-muted" />
                                    <Skeleton className="h-3 w-48 bg-muted" />
                                </div>
                                <Skeleton className="h-6 w-20 bg-muted" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={cn('rounded-xl border border-destructive/20 bg-destructive/5 p-6 backdrop-blur-sm', className)}>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="text-4xl mb-4">📦</span>
                    <p className="text-sm font-medium text-red-400">Failed to load recent orders</p>
                    <p className="mt-1 text-xs text-red-300/70">{error.message}</p>
                </div>
            </div>
        );
    }

    // Empty state
    if (!displayOrders || displayOrders.length === 0) {
        return (
            <div className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}>
                <h3 className="mb-6 text-lg font-bold text-foreground">Recent Orders</h3>
                <div className="flex flex-col items-center justify-center py-12 text-center" style={{ height: 300 }}>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/10">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-indigo-400 opacity-80 shadow-sm">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">No recent orders</p>
                    <p className="mt-1 text-xs text-muted-foreground">Orders will appear here once placed</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Recent Orders</h3>
                {onViewAll && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onViewAll}
                        className="text-primary hover:text-primary/80"
                    >
                        View All
                    </Button>
                )}
            </div>

            {/* Orders List */}
            <div className="space-y-3">
                {displayOrders.map((order) => (
                    <OrderItem
                        key={order.id}
                        order={order}
                        onView={onViewOrder}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Individual Order Item Component
 */
interface OrderItemProps {
    order: RecentOrder;
    onView?: (orderId: string) => void;
}

function OrderItem({ order, onView }: OrderItemProps) {
    const handleView = () => {
        if (onView) {
            onView(order.id);
        }
    };

    return (
        <div className="group relative overflow-hidden rounded-lg border border-border/50 bg-muted/30 p-4 transition-all hover:border-primary/20 hover:bg-muted/50">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-pink-500/0 opacity-0 transition-opacity group-hover:opacity-5" />

            <div className="relative flex items-center gap-4">
                {/* Customer Avatar */}
                <div className="flex-shrink-0">
                    {order.customer.avatar ? (
                        <img
                            src={order.customer.avatar}
                            alt={order.customer.name}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
                        />
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-500 text-sm font-bold text-primary-foreground ring-2 ring-border">
                            {order.customer?.name?.charAt(0)?.toUpperCase() || 'G'}
                        </div>
                    )}
                </div>

                {/* Order Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-foreground truncate">
                            {order.orderNumber}
                        </p>
                        <span className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                            getStatusColor(order.status)
                        )}>
                            {getStatusLabel(order.status)}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                        {order.customer?.name || 'Guest'} • {order.customer?.email || 'No email'}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(new Date(order.createdAt))}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <p className="text-sm font-bold text-foreground">
                        {formatCurrency(order.total)}
                    </p>
                    {onView && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleView}
                            className="h-7 gap-1 text-xs text-primary hover:text-primary/80"
                        >
                            <Eye className="h-3 w-3" />
                            View
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Recent Orders Skeleton Loader
 */
export function RecentOrdersSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
                    <Skeleton className="h-12 w-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32 bg-muted" />
                        <Skeleton className="h-3 w-48 bg-muted" />
                        <Skeleton className="h-3 w-24 bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20 bg-muted" />
                        <Skeleton className="h-6 w-16 bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}
