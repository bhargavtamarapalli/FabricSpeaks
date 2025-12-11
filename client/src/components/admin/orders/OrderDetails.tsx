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
                        <h1 className="text-2xl font-bold text-white">Order #{order.orderNumber}</h1>
                        <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
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
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">Order Items</h3>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
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
                                        <p className="font-medium text-white truncate">{item.name}</p>
                                        <p className="text-sm text-slate-400">
                                            {item.variant ? `${item.variant.size} / ${item.variant.color}` : 'Standard'}
                                        </p>
                                        <p className="text-sm text-slate-500">SKU: {item.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-white">
                                            {formatCurrency(item.price)}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            Qty: {item.quantity}
                                        </p>
                                        <p className="text-sm font-semibold text-white">
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-6 border-t border-slate-800/50 pt-4 space-y-2">
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>Subtotal</span>
                                <span>{formatCurrency(parseFloat(order.total) * 0.9)}</span> {/* Mock subtotal */}
                            </div>
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>Shipping</span>
                                <span>{formatCurrency(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>Tax</span>
                                <span>{formatCurrency(parseFloat(order.total) * 0.1)}</span> {/* Mock tax */}
                            </div>
                            <div className="flex justify-between border-t border-slate-800/50 pt-2 text-lg font-bold text-white">
                                <span>Total</span>
                                <span>{formatCurrency(parseFloat(order.total))}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
                        <h3 className="mb-6 text-lg font-semibold text-white">Order History</h3>
                        <OrderTimeline events={order.timeline || []} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer Details */}
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">Customer</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">{order.customer.name}</p>
                                    <p className="text-xs text-slate-400">Customer since 2023</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Mail className="h-4 w-4" />
                                    <a href={`mailto:${order.customer.email}`} className="hover:text-white">
                                        {order.customer.email}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Phone className="h-4 w-4" />
                                    <span>{order.customer.phone || 'No phone number'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">Shipping Address</h3>
                        <div className="flex items-start gap-3">
                            <MapPin className="mt-1 h-5 w-5 text-slate-400" />
                            <div className="text-sm text-slate-300">
                                <p className="font-medium text-white">{order.shippingAddress.name}</p>
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
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">Payment</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Status</span>
                                <span className={cn(
                                    'rounded-full px-2 py-0.5 text-xs font-medium',
                                    order.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-400' :
                                        order.paymentStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-red-500/10 text-red-400'
                                )}>
                                    {order.paymentStatus.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Method</span>
                                <div className="flex items-center gap-2 text-sm text-white">
                                    <CreditCard className="h-4 w-4" />
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
