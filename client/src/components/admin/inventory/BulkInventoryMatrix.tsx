/**
 * Bulk Inventory Matrix Component
 * 
 * A grid-based interface for efficient bulk updating of product variant stock.
 * Features:
 * - Visual matrix (Rows: Colors, Columns: Sizes)
 * - Keyboard navigation support
 * - Batch saving
 * - Undo/Reset capability
 * 
 * @example
 * <BulkInventoryMatrix productId="123" onSave={handleSave} />
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { cn } from '@/lib/admin/utils';

interface Variant {
    id: string;
    size: string;
    colour: string;
    stock_quantity: number;
}

interface BulkInventoryMatrixProps {
    productId: string;
    productName: string;
    onClose?: () => void;
}

export function BulkInventoryMatrix({ productId, productName, onClose }: BulkInventoryMatrixProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [updates, setUpdates] = useState<Record<string, number>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch variants
    const { data: variantsData, isLoading } = useQuery({
        queryKey: ['admin', 'product-variants', productId],
        queryFn: () => adminApi.products.getVariants(productId),
    });

    const variants = (variantsData as any)?.items || [];

    // Compute unique sizes and colors for the matrix
    const { sizes, colors, matrix } = useMemo(() => {
        const uniqueSizes = Array.from(new Set(variants.map((v: Variant) => v.size))).sort();
        const uniqueColors = Array.from(new Set(variants.map((v: Variant) => v.colour))).sort();

        const variantMap: Record<string, Variant> = {};
        variants.forEach((v: Variant) => {
            variantMap[`${v.colour}-${v.size}`] = v;
        });

        return { sizes: uniqueSizes, colors: uniqueColors, matrix: variantMap };
    }, [variants]);

    // Bulk update mutation
    const updateMutation = useMutation({
        mutationFn: async (payload: { productId: string; updates: any[] }) => {
            return adminApi.products.bulkUpdateVariants(payload.productId, payload.updates);
        },
        onSuccess: () => {
            toast({
                title: "Inventory Updated",
                description: "Stock quantities have been successfully updated.",
            });
            setUpdates({});
            setHasChanges(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'product-variants', productId] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
            if (onClose) onClose();
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Failed to update inventory. Please try again.",
            });
            console.error(error);
        },
    });

    const handleStockChange = (variantId: string, newValue: string) => {
        const value = parseInt(newValue);
        if (isNaN(value) || value < 0) return;

        setUpdates(prev => ({
            ...prev,
            [variantId]: value
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        const payload = Object.entries(updates).map(([id, quantity]) => ({
            id,
            stock_quantity: quantity,
        }));

        if (payload.length === 0) return;

        updateMutation.mutate({
            productId,
            updates: payload,
        });
    };

    const handleReset = () => {
        setUpdates({});
        setHasChanges(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (variants.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400">
                <AlertCircle className="mb-2 h-8 w-8" />
                <p>No variants found for this product.</p>
                <p className="text-sm">Create variants first to manage stock.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-white">Bulk Stock Update</h3>
                    <p className="text-sm text-slate-400">Editing inventory for <span className="text-indigo-400">{productName}</span></p>
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="text-slate-400 hover:text-white"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || updateMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900">
                                <th className="p-4 font-medium text-slate-400">Color \ Size</th>
                                {sizes.map((size: any) => (
                                    <th key={size} className="p-4 font-medium text-white text-center min-w-[100px]">
                                        {size}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {colors.map((color: any) => (
                                <tr key={color} className="hover:bg-slate-800/50">
                                    <td className="p-4 font-medium text-white bg-slate-900/30">
                                        {color}
                                    </td>
                                    {sizes.map((size: any) => {
                                        const variant = matrix[`${color}-${size}`];
                                        const currentStock = variant ? variant.stock_quantity : 0;
                                        const updatedStock = variant && updates[variant.id] !== undefined ? updates[variant.id] : currentStock;
                                        const isModified = variant && updates[variant.id] !== undefined;

                                        return (
                                            <td key={`${color}-${size}`} className="p-2 text-center">
                                                {variant ? (
                                                    <div className="relative mx-auto max-w-[80px]">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={updatedStock}
                                                            onChange={(e) => handleStockChange(variant.id, e.target.value)}
                                                            className={cn(
                                                                "h-9 text-center transition-colors",
                                                                isModified
                                                                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold"
                                                                    : "border-slate-700 bg-slate-800 text-white"
                                                            )}
                                                        />
                                                        {isModified && (
                                                            <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-indigo-500" />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded border border-indigo-500 bg-indigo-500/10" />
                    <span>Modified</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded border border-slate-700 bg-slate-800" />
                    <span>Unchanged</span>
                </div>
            </div>
        </div>
    );
}
