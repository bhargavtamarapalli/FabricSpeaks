/**
 * Order Actions Component
 * 
 * Actions available for managing an order.
 * Features:
 * - Status update dropdown
 * - Cancel order button
 * - Refund button
 * - Print invoice button
 * - Permission-based visibility
 * 
 * @example
 * <OrderActions
 *   order={order}
 *   onUpdateStatus={handleUpdateStatus}
 * />
 */

import { useState } from 'react';
import {
    Printer,
    Ban,
    RefreshCcw,
    CheckCircle2,
    Truck,
    Package,
    MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { ORDER_STATUSES } from '@/lib/admin/constants';
import { cn } from '@/lib/admin/utils';
import type { AdminOrder, OrderStatus } from '@/types/admin';

export interface OrderActionsProps {
    /** The order to manage */
    order: AdminOrder;

    /** Status update handler */
    onUpdateStatus: (status: OrderStatus) => void;

    /** Cancel handler */
    onCancel?: () => void;

    /** Refund handler */
    onRefund?: () => void;

    /** Print invoice handler */
    onPrintInvoice?: () => void;

    /** Loading state */
    loading?: boolean;

    /** Additional CSS classes */
    className?: string;
}

export function OrderActions({
    order,
    onUpdateStatus,
    onCancel,
    onRefund,
    onPrintInvoice,
    loading = false,
    className,
}: OrderActionsProps) {
    const { hasPermission } = useAdminAuth();
    const [isUpdating, setIsUpdating] = useState(false);

    // Check permissions
    const canManageOrders = hasPermission('manage_orders');

    // Determine available next statuses based on current status
    const getAvailableStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
        switch (currentStatus) {
            case 'pending':
                return ['processing', 'cancelled'];
            case 'processing':
                return ['shipped', 'cancelled'];
            case 'shipped':
                return ['delivered', 'returned'];
            case 'delivered':
                return ['returned'];
            case 'cancelled':
            case 'refunded':
            case 'returned':
                return [];
            default:
                return [];
        }
    };

    const availableStatuses = getAvailableStatuses(order.status);
    const isTerminalState = ['cancelled', 'refunded', 'returned', 'delivered'].includes(order.status);

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {/* Status Update (Quick Action) */}
            {canManageOrders && !isTerminalState && (
                <Select
                    value={order.status}
                    onValueChange={(val) => onUpdateStatus(val as OrderStatus)}
                    disabled={loading || isUpdating}
                >
                    <SelectTrigger className="w-[140px] border-slate-700 bg-slate-800 text-white">
                        <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800 text-white">
                        {ORDER_STATUSES.map((status) => (
                            <SelectItem
                                key={status.value}
                                value={status.value}
                                disabled={status.value !== order.status && !availableStatuses.includes(status.value as OrderStatus)}
                            >
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* Print Invoice */}
            <Button
                variant="outline"
                size="icon"
                onClick={onPrintInvoice}
                disabled={loading}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                title="Print Invoice"
            >
                <Printer className="h-4 w-4" />
            </Button>

            {/* More Actions */}
            {canManageOrders && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={loading}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-slate-700 bg-slate-800 text-white">
                        <DropdownMenuLabel>Order Actions</DropdownMenuLabel>

                        {/* Status Shortcuts */}
                        {order.status === 'pending' && (
                            <DropdownMenuItem onClick={() => onUpdateStatus('processing')}>
                                <Package className="mr-2 h-4 w-4 text-blue-400" />
                                Mark as Processing
                            </DropdownMenuItem>
                        )}
                        {order.status === 'processing' && (
                            <DropdownMenuItem onClick={() => onUpdateStatus('shipped')}>
                                <Truck className="mr-2 h-4 w-4 text-purple-400" />
                                Mark as Shipped
                            </DropdownMenuItem>
                        )}
                        {order.status === 'shipped' && (
                            <DropdownMenuItem onClick={() => onUpdateStatus('delivered')}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
                                Mark as Delivered
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-slate-700" />

                        {/* Destructive Actions */}
                        {!isTerminalState && (
                            <DropdownMenuItem
                                onClick={onCancel}
                                className="text-red-400 focus:text-red-400 focus:bg-red-900/20"
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel Order
                            </DropdownMenuItem>
                        )}

                        {['delivered', 'returned'].includes(order.status) && (
                            <DropdownMenuItem
                                onClick={onRefund}
                                className="text-orange-400 focus:text-orange-400 focus:bg-orange-900/20"
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Process Refund
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
