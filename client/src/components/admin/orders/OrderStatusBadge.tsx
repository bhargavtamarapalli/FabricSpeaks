/**
 * Order Status Badge Component
 * 
 * Displays the status of an order with appropriate styling.
 * Features:
 * - Color-coded statuses
 * - Consistent styling
 * - Accessible labels
 * 
 * @example
 * <OrderStatusBadge status="delivered" />
 */

import { cn, getStatusColor, getStatusLabel } from '@/lib/admin/utils';
import type { OrderStatus } from '@/types/admin';

export interface OrderStatusBadgeProps {
    /** Order status */
    status: OrderStatus;

    /** Additional CSS classes */
    className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                getStatusColor(status),
                className
            )}
        >
            {getStatusLabel(status)}
        </span>
    );
}
