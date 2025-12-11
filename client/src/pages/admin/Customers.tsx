/**
 * Admin Customers Page
 * 
 * Main page for managing customers.
 * Features:
 * - Customer list with filtering and sorting
 * - Search functionality
 * - Export functionality
 * 
 * @route /admin/customers
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { CustomerTable } from '@/components/admin/customers/CustomerTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import type { AdminCustomer } from '@/types/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export default function AdminCustomers() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // State
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch customers
  const {
    data: customersData,
    isLoading,
  } = useQuery({
    queryKey: ['admin', 'customers', search],
    queryFn: () => adminApi.customers.getCustomers({ search }),
  });

  const { data: vipCustomers = [] } = useQuery({
    queryKey: ['admin', 'customers', 'vip'],
    queryFn: () => adminApi.customers.getVIPs(),
  });

  // Handlers
  const handleView = (customer: AdminCustomer) => {
    navigate(`/admin/customers/${customer.id}`);
  };

  const handleExport = async () => {
    try {
      const blob = await adminApi.analytics.exportReport('customers', 'csv');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export customers.",
      });
    }
  };

  return (
    <AdminLayout>
      <SEO
        title="Customers - Admin Panel"
        description="Manage your customer base"
        noIndex
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage your customer base and their orders.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Customers
          </Button>
        </div>

        {/* Search Toolbar */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-input bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Table */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted border-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">All Customers</TabsTrigger>
            <TabsTrigger value="vip" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">
              <Crown className="mr-2 h-4 w-4 text-yellow-500" />
              VIPs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <CustomerTable
              data={customersData?.data || []}
              loading={isLoading}
              onView={handleView}
              onSelectionChange={setSelectedIds}
            />
          </TabsContent>

          <TabsContent value="vip">
            <div className="rounded-md border border-border bg-card p-4">
              {/* Reusing CustomerTable or a simplified version for VIPs */}
              <CustomerTable
                data={vipCustomers} // VIP API returns array of customers
                loading={isLoading}
                onView={handleView}
                onSelectionChange={setSelectedIds}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
