/**
 * Order Details Component
 * 
 * Comprehensive view of a single order.
 * Features:
 * - Order summary
 * - Customer details
 * - Shipping address
 * - Order items list
 * - Timeline integration
 * - Actions integration
 * 
 * @example
 * <OrderDetails
 *   order={order}
 *   onUpdateStatus={handleUpdateStatus}
 * />
 */

import {
    User,
    MapPin,
    CreditCard,
    Package,
    Mail,
    Phone,
    Calendar
} from 'lucide-react';
import { OrderTimeline } from './OrderTimeline';
import { OrderActions } from './OrderActions';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
    cn,
    formatCurrency,
    formatDate
} from '@/lib/admin/utils';
import type { AdminOrder, OrderStatus } from '@/types/admin';

export interface OrderDetailsProps {
    /** The order to display */
    order: AdminOrder;

    /** Status update handler */
    onUpdateStatus: (status: OrderStatus) => void;

    /** Cancel handler */
    onCancel?: () => void;

    /** Refund handler */
    onRefund?: () => void;

    /** Loading state */
    loading?: boolean;

    /** Additional CSS classes */
    className?: string;
}

export function OrderDetails({
    order,
    onUpdateStatus,
    onCancel,
    onRefund,
    loading = false,
    className,
}: OrderDetailsProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground">Order #{order.orderNumber}</h1>
                        <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Placed on {formatDate(order.createdAt, 'medium')}</span>
                    </div>
                </div>

                <OrderActions
                    order={order}
                    onUpdateStatus={onUpdateStatus}
                    onCancel={onCancel}
                    onRefund={onRefund}
                    loading={loading}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="admin-card">
                        <h3 className="mb-4 text-lg font-bold text-foreground">Order Items</h3>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Package className="h-6 w-6 text-slate-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-foreground truncate">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.variant ? `${item.variant.size} / ${item.variant.color}` : 'Standard'}
                                        </p>
                                        <p className="text-sm text-muted-foreground/70 font-mono">SKU: {item.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-foreground">
                                            {formatCurrency(item.price)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Qty: {item.quantity}
                                        </p>
                                        <p className="text-sm font-bold text-primary">
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-6 border-t border-border pt-4 space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatCurrency(parseFloat(order.total) * 0.9)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Shipping</span>
                                <span>{formatCurrency(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Tax</span>
                                <span>{formatCurrency(parseFloat(order.total) * 0.1)}</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-foreground">
                                <span>Total</span>
                                <span>{formatCurrency(parseFloat(order.total))}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="admin-card">
                        <h3 className="mb-6 text-lg font-bold text-foreground">Order History</h3>
                        <OrderTimeline events={order.timeline || []} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer Details */}
                    <div className="admin-card">
                        <h3 className="mb-4 text-lg font-bold text-foreground">Customer</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{order.customer.name}</p>
                                    <p className="text-xs text-muted-foreground font-medium">Customer since 2023</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                    <Mail className="h-4 w-4" />
                                    <a href={`mailto:${order.customer.email}`} className="hover:text-primary transition-colors">
                                        {order.customer.email}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                    <Phone className="h-4 w-4" />
                                    <span>{order.customer.phone || 'No phone number'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="admin-card">
                        <h3 className="mb-4 text-lg font-bold text-foreground">Shipping Address</h3>
                        <div className="flex items-start gap-3">
                            <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
                            <div className="text-sm text-muted-foreground">
                                <p className="font-bold text-foreground">{order.shippingAddress.name}</p>
                                <p>{order.shippingAddress.line1}</p>
                                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                                <p>
                                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                </p>
                                <p>{order.shippingAddress.country}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="admin-card">
                        <h3 className="mb-4 text-lg font-bold text-foreground">Payment</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground font-medium">Status</span>
                                <span className={cn(
                                    'rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider',
                                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                        order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                )}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground font-medium">Method</span>
                                <div className="flex items-center gap-2 text-sm text-foreground font-bold">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <span>{order.paymentMethod || 'Credit Card'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
