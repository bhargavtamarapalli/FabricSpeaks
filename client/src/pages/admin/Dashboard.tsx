/**
 * Admin Dashboard Page
 * 
 * Main dashboard for admin panel with key metrics, charts, and recent activity.
 * Features:
 * - Real-time statistics
 * - Revenue trends
 * - Sales breakdown
 * - Recent orders
 * - Quick actions
 * - Responsive layout
 * - Error handling
 * - Loading states
 * 
 * @route /admin
 */

import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { MetricCard, MetricCardGrid } from '@/components/admin/dashboard/MetricCard';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { SalesChart } from '@/components/admin/dashboard/SalesChart';
import { RecentOrders } from '@/components/admin/dashboard/RecentOrders';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin/api';
import { cn } from '@/lib/admin/utils';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function AdminDashboard() {
    const [, navigate] = useLocation();
    const [period, setPeriod] = useState<TimePeriod>('month');

    // Fetch dashboard stats
    const {
        data: stats,
        isLoading: statsLoading,
        error: statsError,
        refetch: refetchStats,
    } = useAdminStats({
        period,
        refetchInterval: 120000, // Poll every 2 minutes
    });

    // Fetch recent orders
    const {
        data: recentOrdersData,
        isLoading: ordersLoading,
        error: ordersError,
    } = useQuery({
        queryKey: ['admin', 'recent-orders'],
        queryFn: () => adminApi.orders.getOrders({ limit: 5 }),
        staleTime: 60000, // 1 minute stale time
        refetchInterval: 120000, // Poll every 2 minutes
        refetchIntervalInBackground: false,
    });

    // Prepare recent orders with customer data fallback
    const recentOrders = useMemo(() => {
        if (!recentOrdersData?.data) return [];

        return recentOrdersData.data.map((order: any) => ({
            ...order,
            customer: order.customer || {
                name: order.user?.username || 'Guest',
                email: order.user?.email || 'No email',
                avatar: null
            }
        }));
    }, [recentOrdersData]);

    // Fetch revenue analytics
    const { data: revenueAnalytics } = useQuery({
        queryKey: ['admin', 'analytics', 'revenue'],
        queryFn: () => adminApi.analytics.getRevenue(),
    });

    // Fetch sales by category
    const { data: salesByCategory } = useQuery({
        queryKey: ['admin', 'analytics', 'sales-by-category'],
        queryFn: () => adminApi.analytics.getSalesByCategory(),
    });

    // Handle period change
    const handlePeriodChange = (newPeriod: TimePeriod) => {
        setPeriod(newPeriod);
    };

    // Handle quick action
    const handleQuickAction = (actionId: string) => {
        console.log('[Dashboard] Quick action:', actionId);
        // Navigation is handled by QuickActions component
    };

    // Handle view order
    const handleViewOrder = (orderId: string) => {
        navigate(`/admin/orders/${orderId}`);
    };

    // Handle view all orders
    const handleViewAllOrders = () => {
        navigate('/admin/orders');
    };

    // Prepare chart data
    const revenueData = revenueAnalytics || [];
    const salesData = salesByCategory || [];

    return (
        <AdminLayout>
            <SEO
                title="Dashboard - Admin Panel"
                description="Admin dashboard for Fabric Speaks e-commerce platform"
            />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Welcome back! Here's what's happening with your store.
                        </p>
                    </div>

                    {/* Period Selector */}
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-1">
                        {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePeriodChange(p)}
                                className={cn(
                                    'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                                    period === p
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                )}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Alert */}
                {statsError && (
                    <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-400">
                                    Failed to load dashboard statistics
                                </p>
                                <p className="mt-1 text-xs text-red-300/70">
                                    {statsError.message}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetchStats()}
                                className="border-red-700 text-red-400 hover:bg-red-900/20"
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

                {/* Key Metrics */}
                <MetricCardGrid>
                    <MetricCard
                        title="Total Revenue"
                        value={stats?.revenue?.total || 0}
                        trend={stats?.revenue?.trend}
                        previousValue={stats?.revenue?.previousPeriod}
                        format="currency"
                        icon={DollarSign}
                        iconColor="text-green-400"
                        loading={statsLoading}
                        error={statsError}
                    />
                    <MetricCard
                        title="Total Orders"
                        value={stats?.orders?.total || 0}
                        trend={stats?.orders?.trend}
                        format="number"
                        icon={ShoppingCart}
                        iconColor="text-blue-400"
                        loading={statsLoading}
                        error={statsError}
                    />
                    <MetricCard
                        title="Total Customers"
                        value={stats?.customers?.total || 0}
                        trend={stats?.customers?.trend}
                        format="number"
                        icon={Users}
                        iconColor="text-purple-400"
                        loading={statsLoading}
                        error={statsError}
                    />
                    <MetricCard
                        title="Active Products"
                        value={stats?.products?.active || 0}
                        format="number"
                        icon={Package}
                        iconColor="text-indigo-400"
                        loading={statsLoading}
                        error={statsError}
                    />
                </MetricCardGrid>

                {/* Secondary Metrics */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <MetricCard
                        title="Average Order Value"
                        value={stats?.averageOrderValue?.value || 0}
                        trend={stats?.averageOrderValue?.trend}
                        format="currency"
                        icon={TrendingUp}
                        iconColor="text-emerald-400"
                        loading={statsLoading}
                        className="lg:col-span-1"
                    />
                    <MetricCard
                        title="Conversion Rate"
                        value={stats?.conversionRate?.value || 0}
                        trend={stats?.conversionRate?.trend}
                        format="percentage"
                        icon={TrendingUp}
                        iconColor="text-cyan-400"
                        loading={statsLoading}
                        className="lg:col-span-1"
                    />
                    <MetricCard
                        title="Low Stock Items"
                        value={stats?.products?.lowStock || 0}
                        format="number"
                        icon={AlertTriangle}
                        iconColor="text-yellow-400"
                        loading={statsLoading}
                        className="lg:col-span-1"
                        onClick={() => navigate('/admin/inventory?filter=low-stock')}
                    />
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <RevenueChart
                        data={revenueData}
                        period={period}
                        loading={statsLoading}
                        error={statsError}
                    />
                    <SalesChart
                        data={salesData}
                        loading={statsLoading}
                        error={statsError}
                    />
                </div>

                {/* Recent Activity and Quick Actions */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <RecentOrders
                            orders={recentOrders || []}
                            loading={ordersLoading}
                            error={ordersError}
                            onViewOrder={handleViewOrder}
                            onViewAll={handleViewAllOrders}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <QuickActions onAction={handleQuickAction} />
                    </div>
                </div>

                {/* Additional Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Pending Orders"
                        value={stats?.orders?.pending || 0}
                        color="yellow"
                        loading={statsLoading}
                    />
                    <StatCard
                        label="Processing"
                        value={stats?.orders?.processing || 0}
                        color="blue"
                        loading={statsLoading}
                    />
                    <StatCard
                        label="Completed"
                        value={stats?.orders?.completed || 0}
                        color="green"
                        loading={statsLoading}
                    />
                    <StatCard
                        label="Out of Stock"
                        value={stats?.products?.outOfStock || 0}
                        color="red"
                        loading={statsLoading}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}

/**
 * Small stat card component
 */
interface StatCardProps {
    label: string;
    value: number;
    color: 'yellow' | 'blue' | 'green' | 'red';
    loading?: boolean;
}

function StatCard({ label, value, color, loading }: StatCardProps) {
    const colorClasses = {
        yellow: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20 text-yellow-400',
        blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-400',
        green: 'from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-400',
        red: 'from-red-500/10 to-rose-500/10 border-red-500/20 text-red-400',
    };

    if (loading) {
        return (
            <div className="rounded-lg border border-slate-800/50 bg-slate-900/50 p-4">
                <div className="h-16 animate-pulse bg-slate-800 rounded" />
            </div>
        );
    }

    return (
        <div className={cn(
            'rounded-lg border bg-gradient-to-br p-4',
            colorClasses[color]
        )}>
            <p className="text-sm font-medium opacity-80">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
    );
}

// Mock data generators removed

