/**
 * Low Stock Alert Component
 * 
 * Widget to display items that are running low on stock.
 * Features:
 * - List of low stock items
 * - Visual urgency indicators
 * - Quick navigation
 * 
 * @example
 * <LowStockAlert products={products} />
 */

import { AlertTriangle, ArrowRight, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/admin/utils';
import type { InventoryItem } from '@/types/admin';

export interface LowStockAlertProps {
    /** List of inventory items */
    items: InventoryItem[];

    /** On view item handler */
    onViewItem?: (productId: string) => void;

    /** Additional CSS classes */
    className?: string;
}

export function LowStockAlert({
    items,
    onViewItem,
    className,
}: LowStockAlertProps) {
    // Find low stock items
    const lowStockItems = items
        .filter(item => item.stockQuantity <= item.lowStockThreshold)
        .map(item => ({
            id: item.productId, // Link to product
            name: item.variant
                ? `${item.product.name} (${item.variant.size}/${item.variant.color})`
                : item.product.name,
            stock: item.stockQuantity,
            threshold: item.lowStockThreshold,
            imageUrl: item.product.imageUrl,
        }))
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5); // Show top 5 most critical

    if (lowStockItems.length === 0) {
        return null;
    }

    return (
        <div className={cn('rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6', className)}>
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Low Stock Alerts</h3>
            </div>

            <div className="space-y-3">
                {lowStockItems.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 rounded-lg border border-slate-800/50 bg-slate-900/50 p-3"
                    >
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <PackageX className="h-4 w-4 text-slate-500" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-white">{item.name}</p>
                            <p className="text-xs text-slate-400">
                                Threshold: {item.threshold}
                            </p>
                        </div>

                        <div className="text-right">
                            <span className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold',
                                item.stock === 0
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-yellow-500/10 text-yellow-400'
                            )}>
                                {item.stock} left
                            </span>
                        </div>

                        {onViewItem && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onViewItem(item.id)}
                                className="h-8 w-8 text-slate-400 hover:text-white"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
