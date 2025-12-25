/**
 * Admin Order Details Page
 * 
 * Page for viewing and managing a specific order.
 * Features:
 * - Detailed order view
 * - Status updates
 * - Cancellation and refunds
 * - Invoice printing
 * 
 * @route /admin/orders/:id
 */

import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { OrderDetails } from '@/components/admin/orders/OrderDetails';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import type { OrderStatus } from '@/types/admin';

export default function AdminOrderDetailsPage() {
    const [, params] = useRoute('/admin/orders/:id');
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const orderId = params?.id;

    // Fetch order data
    const {
        data: order,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['admin', 'order', orderId],
        queryFn: () => adminApi.orders.getOrder(orderId!),
        enabled: !!orderId,
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
            adminApi.orders.updateOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
            toast({
                title: "Status updated",
                description: "Order status has been successfully updated.",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update status.",
            });
        },
    });

    // Handlers
    const handleUpdateStatus = (status: OrderStatus) => {
        if (orderId) {
            updateStatusMutation.mutate({ id: orderId, status });
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
            handleUpdateStatus('cancelled');
        }
    };

    const handleRefund = () => {
        if (window.confirm('Are you sure you want to process a refund for this order?')) {
            handleUpdateStatus('refunded');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    // Error state
    if (error || !order) {
        return (
            <AdminLayout>
                <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                    <p className="text-destructive font-medium">Failed to load order details</p>
                    <Button variant="outline" onClick={() => navigate('/admin/orders')}>
                        Go Back to Orders
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <SEO
                title={`Order #${order.orderNumber} - Admin Panel`}
                description="View order details"
                noIndex
            />

            <div className="space-y-6">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/orders')}
                    className="pl-0 text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Orders
                </Button>

                {/* Order Details */}
                <OrderDetails
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onCancel={handleCancel}
                    onRefund={handleRefund}
                    loading={updateStatusMutation.isPending}
                />
            </div>
        </AdminLayout>
    );
}
