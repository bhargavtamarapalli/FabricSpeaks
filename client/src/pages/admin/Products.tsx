/**
 * Admin Products Page
 * 
 * Main page for managing products.
 * Features:
 * - Product list with filtering and sorting
 * - Create new product
 * - Edit/Delete product
 * - Bulk actions
 * - Responsive layout
 * 
 * @route /admin/products
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, Upload, LayoutGrid, List } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { ProductTable } from '@/components/admin/products/ProductTable';
import { ProductGrid } from '@/components/admin/products/ProductGrid';
import { ProductDetailsDialog } from '@/components/admin/products/ProductDetailsDialog';
import { ProductFilters } from '@/components/admin/products/ProductFilters';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';
import type { ProductFilters as FilterType, AdminProduct } from '@/types/admin';

export default function AdminProducts() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [filters, setFilters] = useState<FilterType>({});
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid'); // Default to grid view
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);

    // Fetch products
    const {
        data: productsData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['admin', 'products', filters],
        queryFn: () => {
            console.log('[DEBUG] Fetching products with filters:', filters);
            return adminApi.products.getProducts(filters);
        },
    });

    // Fetch categories for filter dropdown
    const { data: categories } = useQuery({
        queryKey: ['admin', 'categories'],
        queryFn: () => adminApi.products.getCategories(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: adminApi.products.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            toast({
                title: "Product deleted",
                description: "The product has been successfully deleted.",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to delete product.",
            });
        },
    });

    // Handlers
    const handleEdit = (product: AdminProduct) => {
        navigate(`/admin/products/${product.id}`);
    };

    const handleView = (product: AdminProduct) => {
        setSelectedProduct(product);
        setDetailsOpen(true);
    };

    const handleDelete = async (product: AdminProduct) => {
        if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
            deleteMutation.mutate(product.id);
        }
    };

    const handleCreate = () => {
        navigate('/admin/products/new');
    };

    const handleExport = async () => {
        try {
            const blob = await adminApi.analytics.exportReport('products', 'csv', filters);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Export failed",
                description: "Failed to export products.",
            });
        }
    };

    return (
        <AdminLayout>
            <SEO
                title="Products - Admin Panel"
                description="Manage your product catalog"
                noIndex
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Products</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage your product catalog, inventory, and pricing.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center border border-border rounded-lg p-1 bg-muted/50 mr-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('table')}
                                className={cn("h-8 w-8 p-0 hover:bg-background shadow-sm", viewMode === 'table' && "bg-background text-foreground shadow")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className={cn("h-8 w-8 p-0 hover:bg-background shadow-sm", viewMode === 'grid' && "bg-background text-foreground shadow")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <ProductFilters
                    filters={filters}
                    onChange={(newFilters) => {
                        console.log('[DEBUG] Filters changed:', newFilters);
                        setFilters(newFilters);
                    }}
                    onReset={() => setFilters({})}
                    categories={categories || []}
                />

                {/* Table */}
                {/* Table or Grid */}
                {viewMode === 'table' ? (
                    <ProductTable
                        data={productsData?.data || []}
                        loading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                        onSelectionChange={setSelectedIds}
                    />
                ) : (
                    <ProductGrid
                        data={productsData?.data || []}
                        loading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                    />
                )}

                <ProductDetailsDialog
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    product={selectedProduct}
                />
            </div>
        </AdminLayout>
    );
}
