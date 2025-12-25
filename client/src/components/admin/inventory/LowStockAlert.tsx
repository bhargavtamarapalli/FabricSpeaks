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
        <div className={cn('admin-card !bg-yellow-50/50 dark:!bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/50', className)}>
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-bold text-foreground">Low Stock Alerts</h3>
            </div>

            <div className="space-y-3">
                {lowStockItems.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 shadow-sm"
                    >
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <PackageX className="h-4 w-4 text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground font-medium">
                                Threshold: {item.threshold}
                            </p>
                        </div>

                        <div className="text-right">
                            <span className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                                item.stock === 0
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                            )}>
                                {item.stock} LEFT
                            </span>
                        </div>

                        {onViewItem && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onViewItem(item.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
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
