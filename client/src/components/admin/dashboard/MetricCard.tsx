/**
 * Metric Card Component
 * 
 * Displays a single metric with value, trend, and icon.
 * Features:
 * - Loading skeleton
 * - Trend indicator with color coding
 * - Animated value changes
 * - Responsive design
 * - Error handling
 * 
 * @example
 * <MetricCard
 *   title="Total Revenue"
 *   value={125000}
 *   trend={12.5}
 *   format="currency"
 *   icon={DollarSign}
 *   loading={false}
 * />
 */

import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatCurrency, formatNumber, formatPercentage } from '@/lib/admin/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface MetricCardProps {
    /** Card title */
    title: string;

    /** Metric value */
    value: number;

    /** Trend percentage (positive = up, negative = down) */
    trend?: number;

    /** Previous period value for comparison */
    previousValue?: number;

    /** Value format type */
    format?: 'number' | 'currency' | 'percentage';

    /** Icon component */
    icon?: LucideIcon;

    /** Icon color class */
    iconColor?: string;

    /** Loading state */
    loading?: boolean;

    /** Error state */
    error?: Error | null;

    /** Additional CSS classes */
    className?: string;

    /** Click handler */
    onClick?: () => void;
}

export function MetricCard({
    title,
    value,
    trend,
    previousValue,
    format = 'number',
    icon: Icon,
    iconColor = 'text-indigo-400',
    loading = false,
    error = null,
    className,
    onClick,
}: MetricCardProps) {
    // Format value based on type
    const formattedValue = formatValue(value, format);
    const formattedPrevious = previousValue !== undefined
        ? formatValue(previousValue, format)
        : null;

    // Determine trend direction and color
    const trendDirection = trend !== undefined && trend !== 0
        ? trend > 0 ? 'up' : 'down'
        : null;

    const trendColor = trendDirection === 'up'
        ? 'text-green-400'
        : trendDirection === 'down'
            ? 'text-red-400'
            : 'text-slate-400';

    // Loading skeleton
    if (loading) {
        return (
            <div className={cn(
                'rounded-xl border border-border bg-card p-6 shadow-sm',
                className
            )}>
                <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                        <Skeleton className="h-4 w-24 bg-muted" />
                        <Skeleton className="h-8 w-32 bg-muted" />
                        <Skeleton className="h-3 w-20 bg-muted" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg bg-muted" />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={cn(
                'rounded-xl border border-red-900/50 bg-red-950/20 p-6 backdrop-blur-sm',
                className
            )}>
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-400">{title}</p>
                        <p className="mt-1 text-xs text-red-300/70">
                            Failed to load data
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg',
                onClick && 'cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-pink-500/0 opacity-0 transition-opacity group-hover:opacity-5" />

            <div className="relative flex items-start justify-between">
                {/* Left section - Value and trend */}
                <div className="flex-1 space-y-2">
                    {/* Title */}
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>

                    {/* Value */}
                    <p className="text-3xl font-bold text-foreground transition-all group-hover:text-primary">
                        {formattedValue}
                    </p>

                    {/* Trend indicator */}
                    {trend !== undefined && (
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                trendDirection === 'up' && 'bg-green-500/10 text-green-400',
                                trendDirection === 'down' && 'bg-red-500/10 text-red-400',
                                !trendDirection && 'bg-slate-500/10 text-slate-400'
                            )}>
                                {trendDirection === 'up' && <TrendingUp className="h-3 w-3" />}
                                {trendDirection === 'down' && <TrendingDown className="h-3 w-3" />}
                                <span>{formatPercentage(Math.abs(trend))}</span>
                            </div>

                            {formattedPrevious && (
                                <span className="text-xs text-muted-foreground">
                                    vs {formattedPrevious}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Right section - Icon */}
                {Icon && (
                    <div className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-foreground transition-all group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary',
                        /* iconColor prop is overridden by stronger functional styling above for consistency */
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Format value based on type
 */
function formatValue(value: number, format: 'number' | 'currency' | 'percentage'): string {
    if (typeof value !== 'number' || isNaN(value)) {
        console.warn('[MetricCard] Invalid value:', value);
        return '—';
    }

    switch (format) {
        case 'currency':
            return formatCurrency(value);
        case 'percentage':
            return formatPercentage(value);
        case 'number':
        default:
            return formatNumber(value);
    }
}

/**
 * Metric Card Grid - Container for multiple metric cards
 */
export interface MetricCardGridProps {
    children: React.ReactNode;
    className?: string;
}

export function MetricCardGrid({ children, className }: MetricCardGridProps) {
    return (
        <div className={cn(
            'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
            className
        )}>
            {children}
        </div>
    );
}
