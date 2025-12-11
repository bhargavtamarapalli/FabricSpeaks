/**
 * Top Products Component
 * 
 * Widget to display best-selling products.
 * Features:
 * - List of top products
 * - Sales volume and revenue
 * - Growth indicators
 * - Product images
 * 
 * @example
 * <TopProducts products={data} />
 */

import { Package, TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/admin/utils';

export interface TopProduct {
    id: string;
    name: string;
    category: string;
    sales: number;
    revenue: number;
    growth: number;
    imageUrl?: string;
}

export interface TopProductsProps {
    /** List of top products */
    products: TopProduct[];

    /** Additional CSS classes */
    className?: string;
}

export function TopProducts({ products, className }: TopProductsProps) {
    return (
        <div className={cn('space-y-4', className)}>
            {products.map((product, index) => (
                <div
                    key={product.id}
                    className="flex items-center gap-4 rounded-lg border border-slate-800/50 bg-slate-900/50 p-4 transition-colors hover:bg-slate-800/80"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-400">
                        #{index + 1}
                    </div>

                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-6 w-6 text-slate-500" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-white">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.category}</p>
                    </div>

                    <div className="text-right">
                        <p className="font-medium text-white">{formatCurrency(product.revenue)}</p>
                        <p className="text-xs text-slate-400">{product.sales} sold</p>
                    </div>

                    <div className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        product.growth >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                        {product.growth >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(product.growth)}%
                    </div>
                </div>
            ))}
        </div>
    );
}
