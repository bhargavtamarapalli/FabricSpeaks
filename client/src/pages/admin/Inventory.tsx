/**
 * Admin Inventory Page
 * 
 * Main page for managing inventory.
 * Features:
 * - Inventory table with stock levels
 * - Stock adjustment dialog
 * - Low stock alerts
 * - Export functionality
 * 
 * @route /admin/inventory
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, RefreshCw, Search, Filter } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { InventoryTable } from '@/components/admin/inventory/InventoryTable';
import { StockAdjustment } from '@/components/admin/inventory/StockAdjustment';
import { LowStockAlert } from '@/components/admin/inventory/LowStockAlert';
import { InventoryIntelligence } from '@/components/admin/inventory/InventoryIntelligence';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import type { InventoryItem } from '@/types/admin';

export default function AdminInventory() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch products (inventory)
    const {
        data: inventoryResponse,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['admin', 'inventory', debouncedSearch, statusFilter],
        queryFn: () => adminApi.inventory.getInventory({
            search: debouncedSearch,
            status: statusFilter !== 'all' ? statusFilter : undefined
        }),
        refetchInterval: 120000, // Poll every 2 minutes
        refetchIntervalInBackground: false,
    });

    const inventoryItems = inventoryResponse?.data || [];

    // Calculate stats
    const totalItems = inventoryItems.length;
    const totalValue = inventoryItems.reduce((acc, item) => acc + item.value, 0);
    const lowStockCount = inventoryItems.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock').length;

    // Stock adjustment mutation
    const adjustStockMutation = useMutation({
        mutationFn: async (data: any) => {
            if (!selectedItem) return;

            // Determine if we're updating a variant or main product
            const isVariant = !!selectedItem.variantId;
            const targetId = isVariant ? selectedItem.variantId! : selectedItem.productId;

            if (!isVariant) {
                throw new Error("Cannot adjust stock for product without variant");
            }

            // Calculate change
            const change = data.type === 'add' ? data.quantity : -data.quantity;

            // Call API to update stock
            await adminApi.inventory.adjustStock({
                productId: selectedItem.productId, // Required by type but ignored by server
                variantId: targetId,
                quantityChange: change,
                reason: data.reason,
                notes: data.note,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
            toast({
                title: "Stock updated",
                description: "Inventory level has been successfully updated.",
            });
            setIsAdjustmentOpen(false);
            setSelectedItem(null);
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update stock.",
            });
        },
    });

    // Handlers
    const handleAdjustStock = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsAdjustmentOpen(true);
    };

    const handleViewProduct = (productId: string) => {
        navigate(`/admin/products/${productId}`);
    };

    const handleExport = async () => {
        try {
            const blob = await adminApi.analytics.exportReport('inventory', 'csv');
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Export failed",
                description: "Failed to export inventory.",
            });
        }
    };

    return (
        <AdminLayout>
            <SEO
                title="Inventory - Admin Panel"
                description="Manage stock levels"
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Inventory</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Track stock levels and manage adjustments.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Button
                            onClick={handleExport}
                            className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Header End */}

                <Tabs defaultValue="stock" className="space-y-6">
                    <TabsList className="bg-slate-800 border-slate-700">
                        <TabsTrigger value="stock" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-400">Stock Levels</TabsTrigger>
                        <TabsTrigger value="intelligence" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-400">Intelligence & Predictions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="stock" className="space-y-6">
                        {/* Filters */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Search by name or SKU..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px] border-slate-700 bg-slate-800 text-white">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent className="border-slate-700 bg-slate-800 text-white">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="in-stock">In Stock</SelectItem>
                                    <SelectItem value="low-stock">Low Stock</SelectItem>
                                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Main Table */}
                            <div className="lg:col-span-2">
                                <InventoryTable
                                    data={inventoryItems}
                                    loading={isLoading}
                                    onAdjust={handleAdjustStock}
                                />
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Low Stock Alerts */}
                                <LowStockAlert
                                    items={inventoryItems}
                                    onViewItem={handleViewProduct}
                                />

                                {/* Quick Stats */}
                                <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
                                    <h3 className="mb-4 text-lg font-semibold text-white">Inventory Summary</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                            <span className="text-slate-400">Total Items</span>
                                            <span className="font-medium text-white">
                                                {totalItems}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                            <span className="text-slate-400">Total Value</span>
                                            <span className="font-medium text-white">
                                                ₹{totalValue.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Low Stock Items</span>
                                            <span className="font-medium text-yellow-400">
                                                {lowStockCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="intelligence">
                        <InventoryIntelligence />
                    </TabsContent>
                </Tabs>

                {/* Adjustment Dialog */}
                {selectedItem && (
                    <StockAdjustment
                        item={selectedItem}
                        isOpen={isAdjustmentOpen}
                        onClose={() => {
                            setIsAdjustmentOpen(false);
                            setSelectedItem(null);
                        }}
                        onSave={adjustStockMutation.mutateAsync}
                        loading={adjustStockMutation.isPending}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
