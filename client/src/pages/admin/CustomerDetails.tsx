/**
 * Admin Customer Details Page
 * 
 * Page for viewing a specific customer's profile and history.
 * Features:
 * - Customer profile view
 * - Order history view
 * - Tabbed interface
 * 
 * @route /admin/customers/:id
 */

import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { CustomerDetails } from '@/components/admin/customers/CustomerDetails';
import { CustomerOrders } from '@/components/admin/customers/CustomerOrders';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';

export default function AdminCustomerDetailsPage() {
    const [, params] = useRoute('/admin/customers/:id');
    const [, navigate] = useLocation();
    const customerId = params?.id;

    // Fetch customer data
    const {
        data: customer,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['admin', 'customer', customerId],
        queryFn: () => adminApi.customers.getCustomer(customerId!),
        enabled: !!customerId,
    });

    // Loading state
    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            </AdminLayout>
        );
    }

    // Error state
    if (error || !customer) {
        return (
            <AdminLayout>
                <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                    <p className="text-red-400">Failed to load customer details</p>
                    <Button onClick={() => navigate('/admin/customers')}>
                        Go Back to Customers
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <SEO
                title={`${customer.name} - Admin Panel`}
                description="View customer profile"
                noIndex
            />

            <div className="space-y-6">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/customers')}
                    className="pl-0 text-slate-400 hover:text-white"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Customers
                </Button>

                {/* Tabs */}
                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="border-slate-800 bg-slate-900/50">
                        <TabsTrigger
                            value="profile"
                            className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
                        >
                            Profile
                        </TabsTrigger>
                        <TabsTrigger
                            value="orders"
                            className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
                        >
                            Order History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <CustomerDetails customer={customer} />
                    </TabsContent>

                    <TabsContent value="orders">
                        <CustomerOrders customerId={customer.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
