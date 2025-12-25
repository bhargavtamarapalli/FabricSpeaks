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
    const stats = customer.stats || { totalOrders: 0, totalSpent: 0, lastOrderDate: null };
    const aov = stats.totalOrders > 0
        ? stats.totalSpent / stats.totalOrders
        : 0;

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header Card */}
            <div className="flex flex-col gap-6 rounded-xl border border-border/50 bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold uppercase">
                        {(customer.name || customer.username || customer.email || '?').charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">
                            {customer.name || customer.username || customer.email?.split('@')[0] || 'Guest User'}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Customer since {formatDate(customer.createdAt, 'short')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Lifetime Value</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalSpent)}</p>
                    </div>
                    <div className="h-12 w-px bg-border/50" />
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Contact Info */}
                <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                        <User className="h-5 w-5 text-primary" />
                        Contact Information
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-foreground/80">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${customer.email}`} className="hover:text-primary hover:underline">
                                {customer.email}
                            </a>
                        </div>
                        {customer.phone && (
                            <div className="flex items-center gap-3 text-foreground/80">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a href={`tel:${customer.phone}`} className="hover:text-primary hover:underline">
                                    {customer.phone}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Average Order Value</p>
                            <p className="text-lg font-semibold text-foreground">{formatCurrency(aov)}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Last Order</p>
                            <p className="text-lg font-semibold text-foreground">
                                {stats.lastOrderDate
                                    ? formatDate(stats.lastOrderDate, 'short')
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Addresses - Hidden if not provided by type yet */}
                {(customer as any).addresses && (customer as any).addresses.length > 0 && (
                    <div className="md:col-span-2 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                            <MapPin className="h-5 w-5 text-primary" />
                            Address Book
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {(customer as any).addresses.map((address: any, index: number) => (
                                <div key={index} className="rounded-lg border border-border bg-muted/30 p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="font-medium text-foreground">{address.name}</span>
                                        {address.isDefault && (
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
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
