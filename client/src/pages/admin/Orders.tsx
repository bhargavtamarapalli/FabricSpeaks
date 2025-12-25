/**
 * Admin Orders Page
 * 
 * Main page for managing orders.
 * Features:
 * - Order list with filtering and sorting
 * - Order details view
 * - Status updates
 * - Bulk actions
 * - Export functionality
 * 
 * @route /admin/orders
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Filter, Search, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { OrderTable } from '@/components/admin/orders/OrderTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ORDER_STATUSES } from '@/lib/admin/constants';
import type { OrderFilters, AdminOrder } from '@/types/admin';

export default function AdminOrders() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [filters, setFilters] = useState<OrderFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch orders
  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'orders', filters],
    queryFn: () => adminApi.orders.getOrders(filters),
    refetchInterval: 120000, // Poll every 2 minutes
    refetchIntervalInBackground: false,
  });

  // Handlers
  const handleView = (order: AdminOrder) => {
    navigate(`/admin/orders/${order.id}`);
  };

  const handleExport = async () => {
    try {
      const blob = await adminApi.analytics.exportReport('orders', 'csv', filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export orders.",
      });
    }
  };

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <AdminLayout>
      <SEO
        title="Orders - Admin Panel"
        description="Manage customer orders"
        noIndex
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="admin-page-title">Orders</h1>
            <p className="admin-page-subtitle">
              View and manage customer orders and shipments.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            className="text-foreground hover:bg-muted"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Orders
          </Button>
        </div>

        {/* Filters Toolbar */}
        <div className="admin-card !p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Filter className="h-4 w-4 text-primary" />
              Filters
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
                <X className="ml-2 h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Order #, Customer, Email..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9 bg-muted/50 border-border"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(val) => handleFilterChange('status', val)}
              >
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Payment</Label>
              <Select
                value={filters.paymentStatus || 'all'}
                onValueChange={(val) => handleFilterChange('paymentStatus', val)}
              >
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range (Simplified for now) */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Time Period</Label>
              <Select
                value={filters.startDate ? 'custom' : 'all'}
                onValueChange={(val) => {
                  // TODO: Implement proper date range picker
                  if (val === 'all') {
                    handleFilterChange('startDate', undefined);
                    handleFilterChange('endDate', undefined);
                  }
                }}
              >
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <OrderTable
          data={ordersData?.data || []}
          loading={isLoading}
          onView={handleView}
          onSelectionChange={setSelectedIds}
        />
      </div>
    </AdminLayout>
  );
}
