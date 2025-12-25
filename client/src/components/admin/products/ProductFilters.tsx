/**
 * Product Filters Component
 * 
 * Filter sidebar/toolbar for product list.
 * Features:
 * - Search by name/SKU
 * - Filter by category
 * - Filter by status
 * - Filter by stock level
 * - Sort options
 * - Reset filters
 * 
 * @example
 * <ProductFilters
 *   filters={filters}
 *   onChange={handleFilterChange}
 * />
 */

import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/admin/utils';
import { PRODUCT_STATUSES, STOCK_STATUSES } from '@/lib/admin/constants';
import type { ProductFilters as FilterType } from '@/types/admin';

export interface ProductFiltersProps {
    /** Current filters */
    filters: FilterType;

    /** Change handler */
    onChange: (filters: FilterType) => void;

    /** Reset handler */
    onReset: () => void;

    /** Categories list */
    categories?: { id: string; name: string }[];

    /** Additional CSS classes */
    className?: string;
}

export function ProductFilters({
    filters,
    onChange,
    onReset,
    categories = [],
    className,
}: ProductFiltersProps) {
    // Handle input change
    const handleChange = (key: keyof FilterType, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    // Check if any filter is active
    const hasActiveFilters =
        filters.search ||
        filters.categoryId ||
        filters.status ||
        filters.stockStatus;

    return (
        <div className={cn('admin-card !p-4', className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Filter className="h-4 w-4 text-primary" />
                    Filters
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
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
                            placeholder="Name, SKU, Description..."
                            value={filters.search || ''}
                            onChange={(e) => handleChange('search', e.target.value)}
                            className="pl-9 bg-muted/50 border-border"
                        />
                    </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Category</Label>
                    <Select
                        value={filters.categoryId || 'all'}
                        onValueChange={(val) => handleChange('categoryId', val === 'all' ? undefined : val)}
                    >
                        <SelectTrigger className="bg-muted/50 border-border">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</Label>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(val) => handleChange('status', val === 'all' ? undefined : val)}
                    >
                        <SelectTrigger className="bg-muted/50 border-border">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {PRODUCT_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Stock Status */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Stock Level</Label>
                    <Select
                        value={filters.stockStatus || 'all'}
                        onValueChange={(val) => handleChange('stockStatus', val === 'all' ? undefined : val)}
                    >
                        <SelectTrigger className="bg-muted/50 border-border">
                            <SelectValue placeholder="All Stock Levels" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stock Levels</SelectItem>
                            {STOCK_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
