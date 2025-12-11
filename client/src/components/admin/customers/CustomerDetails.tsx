/**
 * Customer Details Component
 * 
 * Displays detailed profile information for a customer.
 * Features:
 * - Contact info
 * - Lifetime stats (LTV, AOV)
 * - Address book
 * - Account status
 * 
 * @example
 * <CustomerDetails customer={customer} />
 */

import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ShoppingBag,
    CreditCard
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/admin/utils';
import type { AdminCustomer } from '@/types/admin';

export interface CustomerDetailsProps {
    /** Customer data */
    customer: AdminCustomer;

    /** Additional CSS classes */
    className?: string;
}

export function CustomerDetails({ customer, className }: CustomerDetailsProps) {
    // Calculate Average Order Value (AOV)
    const aov = customer.totalOrders > 0
        ? customer.totalSpent / customer.totalOrders
        : 0;

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header Card */}
            <div className="flex flex-col gap-6 rounded-xl border border-slate-800/50 bg-slate-900/50 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white text-xl font-bold">
                        {(() => {
                            const displayName = customer.name || customer.username || customer.email?.split('@')[0] || 'G';
                            return displayName.charAt(0).toUpperCase();
                        })()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {customer.name || customer.username || customer.email?.split('@')[0] || 'Guest User'}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="h-4 w-4" />
                            <span>Customer since {formatDate(customer.createdAt || customer.created_at, 'short')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-sm text-slate-400">Lifetime Value</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                    <div className="h-12 w-px bg-slate-800" />
                    <div className="text-right">
                        <p className="text-sm text-slate-400">Total Orders</p>
                        <p className="text-2xl font-bold text-white">{customer.totalOrders}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Contact Info */}
                <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <User className="h-5 w-5 text-indigo-400" />
                        Contact Information
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-300">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <a href={`mailto:${customer.email}`} className="hover:text-white hover:underline">
                                {customer.email}
                            </a>
                        </div>
                        {customer.phone && (
                            <div className="flex items-center gap-3 text-slate-300">
                                <Phone className="h-4 w-4 text-slate-500" />
                                <a href={`tel:${customer.phone}`} className="hover:text-white hover:underline">
                                    {customer.phone}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <ShoppingBag className="h-5 w-5 text-pink-400" />
                        Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                            <p className="text-xs text-slate-400">Average Order Value</p>
                            <p className="text-lg font-semibold text-white">{formatCurrency(aov)}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                            <p className="text-xs text-slate-400">Last Order</p>
                            <p className="text-lg font-semibold text-white">
                                {customer.lastOrderDate
                                    ? formatDate(customer.lastOrderDate, 'short')
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Addresses */}
                {customer.addresses && customer.addresses.length > 0 && (
                    <div className="md:col-span-2 rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                            <MapPin className="h-5 w-5 text-green-400" />
                            Address Book
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {customer.addresses.map((address, index) => (
                                <div key={index} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="font-medium text-white">{address.name}</span>
                                        {address.isDefault && (
                                            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        <p>{address.line1}</p>
                                        {address.line2 && <p>{address.line2}</p>}
                                        <p>{address.city}, {address.state} {address.postalCode}</p>
                                        <p>{address.country}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
