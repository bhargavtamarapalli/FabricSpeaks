/**
 * Admin Analytics Page
 * 
 * Main dashboard for business intelligence and reporting.
 * Features:
 * - Revenue trends
 * - Product performance
 * - Customer growth
 * - Regional analysis
 * - Date range filtering
 * - Export functionality
 * 
 * @route /admin/analytics
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Calendar, TrendingUp, Users, ShoppingBag, CreditCard, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { RevenueChart } from '@/components/admin/analytics/RevenueChart';
import { TopProducts } from '@/components/admin/analytics/TopProducts';
import { CustomerGrowth } from '@/components/admin/analytics/CustomerGrowth';
import { SalesByRegion } from '@/components/admin/analytics/SalesByRegion';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import { formatCurrency } from '@/lib/admin/utils';

export default function AdminAnalytics() {
    const { toast } = useToast();
    const [timeRange, setTimeRange] = useState('30d');

    // Fetch Dashboard Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin', 'dashboard-stats', timeRange],
        queryFn: () => adminApi.dashboard.getStats(),
    });

    // Fetch Revenue Data
    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['admin', 'analytics', 'revenue', timeRange],
        queryFn: () => adminApi.analytics.getRevenue(),
    });

    // Fetch Top Products
    const { data: topProducts, isLoading: productsLoading } = useQuery({
        queryKey: ['admin', 'analytics', 'top-products', timeRange],
        queryFn: () => adminApi.analytics.getTopProducts(),
    });

    // Fetch Customer Growth
    const { data: customerGrowth, isLoading: growthLoading } = useQuery({
        queryKey: ['admin', 'analytics', 'customer-growth', timeRange],
        queryFn: () => adminApi.analytics.getCustomerGrowth(),
    });

    // Fetch Sales by Region
    const { data: regionalData, isLoading: regionLoading } = useQuery({
        queryKey: ['admin', 'analytics', 'sales-by-region', timeRange],
        queryFn: () => adminApi.analytics.getSalesByRegion(),
    });

    const isLoading = statsLoading || revenueLoading || productsLoading || growthLoading || regionLoading;

    const handleExport = async () => {
        try {
            const blob = await adminApi.analytics.exportReport('sales', 'pdf'); // Defaulting to sales/pdf for now
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Export failed",
                description: "Failed to export analytics report.",
            });
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <SEO
                title="Analytics - Admin Panel"
                description="Business intelligence dashboard"
                noIndex
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="admin-page-title">Analytics</h1>
                        <p className="admin-page-subtitle">
                            Overview of your business performance and growth.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[140px] bg-muted/50 border-border">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 3 months</SelectItem>
                                <SelectItem value="1y">Last year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleExport}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="admin-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">Total Revenue</p>
                                <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(stats?.revenue?.total || 0)}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <CreditCard className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
                            <TrendingUp className="mr-1 h-4 w-4" />
                            <span>+{stats?.revenue?.trend || 0}% from last month</span>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">Total Orders</p>
                                <p className="mt-2 text-2xl font-bold text-foreground">{stats?.orders?.total || 0}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                                <ShoppingBag className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
                            <TrendingUp className="mr-1 h-4 w-4" />
                            <span>+{stats?.orders?.trend || 0}% from last month</span>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">Active Products</p>
                                <p className="mt-2 text-2xl font-bold text-foreground">{stats?.products?.active || 0}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
                            <TrendingUp className="mr-1 h-4 w-4" />
                            <span>+15.3% from last month</span>
                        </div>
                    </div>

                    <div className="admin-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">Low Stock Items</p>
                                <p className="mt-2 text-2xl font-bold text-foreground">{stats?.products?.lowStock || 0}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-orange-600 font-medium">
                            <TrendingUp className="mr-1 h-4 w-4" />
                            <span>Needs Attention</span>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Revenue Chart */}
                    <div className="admin-card">
                        <h3 className="mb-6 text-lg font-bold text-foreground">Revenue Overview</h3>
                        <RevenueChart data={revenueData || []} />
                    </div>

                    {/* Customer Growth */}
                    <div className="admin-card">
                        <h3 className="mb-6 text-lg font-bold text-foreground">Customer Growth</h3>
                        <CustomerGrowth data={customerGrowth || []} />
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Top Products */}
                    <div className="lg:col-span-2 admin-card">
                        <h3 className="mb-6 text-lg font-bold text-foreground">Top Performing Products</h3>
                        <TopProducts products={topProducts || []} />
                    </div>

                    {/* Sales by Region */}
                    <div className="admin-card">
                        <h3 className="mb-6 text-lg font-bold text-foreground">Sales by Region</h3>
                        <SalesByRegion data={regionalData || []} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
