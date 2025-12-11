/**
 * Customer Orders Component
 * 
 * Displays order history for a specific customer.
 * Features:
 * - List of past orders
 * - Status indicators
 * - Total amounts
 * - Quick navigation to order details
 * 
 * @example
 * <CustomerOrders customerId={id} />
 */

import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { adminApi } from '@/lib/admin/api';
import { OrderTable } from '@/components/admin/orders/OrderTable';
import { Loader2 } from 'lucide-react';

export interface CustomerOrdersProps {
    /** Customer ID */
    customerId: string;
}

export function CustomerOrders({ customerId }: CustomerOrdersProps) {
    const [, navigate] = useLocation();

    // Fetch customer orders
    const {
        data: ordersData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['admin', 'customer-orders', customerId],
        queryFn: () => adminApi.orders.getOrders({ customerId }),
    });

    const handleViewOrder = (order: any) => {
        navigate(`/admin/orders/${order.id}`);
    };

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-red-400">
                Failed to load order history.
            </div>
        );
    }

    const orders = ordersData?.data || [];

    if (orders.length === 0) {
        return (
            <div className="rounded-lg border border-slate-800/50 bg-slate-900/50 p-8 text-center text-slate-400">
                No orders found for this customer.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Order History</h3>
            <OrderTable
                data={orders}
                onView={handleViewOrder}
                className="border-0"
            />
        </div>
    );
}
