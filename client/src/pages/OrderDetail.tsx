import { useRoute, useLocation } from "wouter";
import PageLayout from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Truck, CheckCircle, Clock, ArrowLeft, MapPin, CreditCard, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: string;
    size?: string;
    total_price: string;
}

interface Order {
    id: string;
    status: string;
    total_amount: string;
    created_at: string;
    payment_status?: string;
    payment_method?: string;
    tracking_number?: string;
    courier?: string;
    estimated_delivery?: string;
    shipping_address_snapshot?: any;
    delivery_option?: string;
    gift_message?: string;
    discount_amount?: string;
}

export default function OrderDetail() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute('/orders/:id');
    const orderId = params?.id;

    // Fetch order details
    const orderQuery = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            if (!orderId) throw new Error('No order ID');
            return api.get<Order>(`/api/orders/${orderId}`);
        },
        enabled: !!orderId,
    });

    const order = orderQuery.data;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'delivered':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
            case 'shipped':
            case 'in_transit':
                return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-none"><Truck className="h-3 w-3 mr-1" />In Transit</Badge>;
            case 'processing':
                return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none"><Package className="h-3 w-3 mr-1" />Processing</Badge>;
            default:
                return <Badge variant="secondary" className="bg-stone-100 text-stone-800 dark:bg-neutral-800 dark:text-neutral-400 border-none"><Clock className="h-3 w-3 mr-1" />{status}</Badge>;
        }
    };

    if (orderQuery.isLoading) {
        return (
            <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black">
                <main className="flex-1 py-16 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 w-64 bg-stone-200 dark:bg-neutral-800 rounded" />
                            <div className="h-64 bg-stone-100 dark:bg-neutral-900 rounded-lg" />
                        </div>
                    </div>
                </main>
            </PageLayout>
        );
    }

    if (orderQuery.error || !order) {
        return (
            <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black">
                <main className="flex-1 py-16 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <Package className="h-16 w-16 mx-auto text-stone-300 dark:text-neutral-700 mb-4" />
                        <h1 className="text-2xl font-display mb-2 dark:text-white">Order Not Found</h1>
                        <p className="text-stone-500 dark:text-neutral-500 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
                        <Button onClick={() => setLocation('/orders')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Button>
                    </div>
                </main>
            </PageLayout>
        );
    }

    const shippingAddress = order.shipping_address_snapshot;

    return (
        <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
            <main className="flex-1 py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Button variant="ghost" className="mb-6 -ml-2" onClick={() => setLocation('/orders')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Button>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Order Header */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                            <div>
                                <h1 className="font-display text-3xl md:text-4xl mb-2 dark:text-white">
                                    Order #{order.id.slice(0, 8)}
                                </h1>
                                <p className="text-stone-500 dark:text-neutral-400">
                                    Placed on {new Date(order.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                {getStatusBadge(order.status)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Main Content */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Tracking Info */}
                                {order.tracking_number && (
                                    <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-3">
                                            <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <p className="font-medium dark:text-white">Tracking Number</p>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    {order.courier && `${order.courier}: `}{order.tracking_number}
                                                </p>
                                                {order.estimated_delivery && (
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                        Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Shipping Address */}
                                {shippingAddress && (
                                    <Card className="p-6 bg-stone-50 dark:bg-neutral-900 border-none">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-stone-500 dark:text-neutral-400 mt-0.5" />
                                            <div>
                                                <p className="font-medium dark:text-white mb-1">Shipping Address</p>
                                                <p className="text-sm text-stone-600 dark:text-neutral-400">
                                                    {shippingAddress.name}<br />
                                                    {shippingAddress.street}<br />
                                                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}<br />
                                                    {shippingAddress.phone}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Gift Message */}
                                {order.gift_message && (
                                    <Card className="p-6 bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800">
                                        <div className="flex items-start gap-3">
                                            <Gift className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                            <div>
                                                <p className="font-medium dark:text-white mb-1">Gift Message</p>
                                                <p className="text-sm text-pink-700 dark:text-pink-300 italic">
                                                    "{order.gift_message}"
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Payment Info */}
                                <Card className="p-6 bg-stone-50 dark:bg-neutral-900 border-none">
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="h-5 w-5 text-stone-500 dark:text-neutral-400 mt-0.5" />
                                        <div>
                                            <p className="font-medium dark:text-white mb-1">Payment</p>
                                            <p className="text-sm text-stone-600 dark:text-neutral-400">
                                                {order.payment_method || 'Razorpay'} • {order.payment_status === 'paid' ? 'Paid' : order.payment_status || 'Pending'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Order Summary Sidebar */}
                            <div className="md:col-span-1">
                                <Card className="p-6 bg-stone-50 dark:bg-neutral-900 border-none sticky top-6">
                                    <h3 className="font-display text-lg mb-4 dark:text-white">Order Summary</h3>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between text-stone-600 dark:text-neutral-400">
                                            <span>Subtotal</span>
                                            <span>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                                        </div>

                                        {order.delivery_option === 'express' && (
                                            <div className="flex justify-between text-stone-600 dark:text-neutral-400">
                                                <span>Express Delivery</span>
                                                <span>₹99</span>
                                            </div>
                                        )}

                                        {Number(order.discount_amount) > 0 && (
                                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                                <span>Discount</span>
                                                <span>-₹{Number(order.discount_amount).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}

                                        <Separator className="my-3" />

                                        <div className="flex justify-between font-medium text-lg dark:text-white">
                                            <span>Total</span>
                                            <span>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>

                                    {order.status === 'pending' && (
                                        <Button
                                            variant="destructive"
                                            className="w-full mt-6"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to cancel this order?')) {
                                                    // TODO: Implement cancel order
                                                    console.log('Cancel order:', order.id);
                                                }
                                            }}
                                        >
                                            Cancel Order
                                        </Button>
                                    )}
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </PageLayout>
    );
}
