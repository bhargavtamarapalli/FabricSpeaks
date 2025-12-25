/**
 * Sales Chart Component
 * 
 * Displays sales distribution by category using pie/donut chart.
 * Features:
 * - Interactive segments
 * - Percentage labels
 * - Legend with values
 * - Responsive design
 * - Loading and error states
 * - Customizable colors
 * 
 * @example
 * <SalesChart
 *   data={salesData}
 *   type="donut"
 *   loading={false}
 * />
 */

import { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import { formatCurrency, formatPercentage, cn, generateChartColors } from '@/lib/admin/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface SalesDataPoint {
    category: string;
    value: number;
    color?: string;
}

export interface SalesChartProps {
    /** Chart data */
    data: SalesDataPoint[];

    /** Chart type */
    type?: 'pie' | 'donut';

    /** Chart height in pixels */
    height?: number;

    /** Show percentages on chart */
    showPercentages?: boolean;

    /** Show legend */
    showLegend?: boolean;

    /** Loading state */
    loading?: boolean;

    /** Error state */
    error?: Error | null;

    /** Additional CSS classes */
    className?: string;
}

export function SalesChart({
    data,
    type = 'donut',
    height = 350,
    showPercentages = true,
    showLegend = true,
    loading = false,
    error = null,
    className,
}: SalesChartProps) {
    // Process data and calculate percentages
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return [];
        }

        const total = data.reduce((sum, item) => sum + item.value, 0);

        if (total === 0) {
            return [];
        }

        return data.map((item, index) => ({
            ...item,
            percentage: (item.value / total) * 100,
            color: item.color || generateChartColors(data.length)[index],
        }));
    }, [data]);

    // Calculate total
    const total = useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.value, 0);
    }, [chartData]);

    // Loading skeleton
    if (loading) {
        return (
            <div className={cn('admin-card', className)}>
                <div className="space-y-4">
                    <Skeleton className="h-6 w-40 bg-muted" />
                    <div className="flex items-center justify-center">
                        <Skeleton className="h-[300px] w-[300px] rounded-full bg-muted" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={cn('rounded-xl border border-red-900/50 bg-red-950/20 p-6', className)}>
                <div className="flex flex-col items-center justify-center" style={{ height }}>
                    <span className="text-4xl mb-4">📊</span>
                    <p className="text-sm font-medium text-red-400">Failed to load chart data</p>
                    <p className="mt-1 text-xs text-red-300/70">{error.message}</p>
                </div>
            </div>
        );
    }

    // Empty state
    if (!chartData || chartData.length === 0) {
        return (
            <div className={cn('admin-card', className)}>
                <div className="admin-empty-state-container" style={{ height }}>
                    <div className="admin-empty-state-icon">
                        <div className="admin-empty-state-icon-inner">
                            <span className="text-lg">✕</span>
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">No sales data available</p>
                    <p className="mt-1 text-xs text-muted-foreground">Data will appear here once available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('admin-card', className)}>
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">Sales by Category</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Total Sales: {formatCurrency(total)}
                </p>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={showPercentages ? renderCustomLabel : false}
                        outerRadius={type === 'donut' ? 120 : 130}
                        innerRadius={type === 'donut' ? 70 : 0}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="rgba(15, 23, 42, 0.5)"
                                strokeWidth={2}
                            />
                        ))}
                    </Pie>

                    {/* Tooltip */}
                    <Tooltip content={<CustomTooltip />} />

                    {/* Legend */}
                    {showLegend && (
                        <Legend
                            content={<CustomLegend data={chartData} total={total} />}
                            verticalAlign="bottom"
                            height={36}
                        />
                    )}
                </PieChart>
            </ResponsiveContainer>

            {/* Stats Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800/50 pt-6">
                {chartData.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground truncate">{item.category}</p>
                            <p className="text-sm font-bold text-foreground">
                                {formatCurrency(item.value)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-slate-300">
                                {formatPercentage(item.percentage)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Custom label renderer for pie slices
 */
function renderCustomLabel({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
}: any) {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is > 5%
    if (percent < 0.05) {
        return null;
    }

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            className="text-xs font-semibold"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

/**
 * Custom tooltip component
 */
function CustomTooltip({ active, payload }: any) {
    if (!active || !payload || !payload.length) {
        return null;
    }

    const data = payload[0].payload;

    return (
        <div className="rounded-lg border border-border bg-popover/95 p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
                <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: data.color }}
                />
                <p className="text-sm font-bold text-foreground">{data.category}</p>
            </div>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-muted-foreground">Sales:</span>
                    <span className="text-sm font-bold text-foreground">
                        {formatCurrency(data.value)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-muted-foreground">Share:</span>
                    <span className="text-sm font-bold text-foreground">
                        {formatPercentage(data.percentage)}
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * Custom legend component
 */
function CustomLegend({ data, total }: { data: SalesDataPoint[]; total: number }) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-4 px-4">
            {data.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-slate-300">{item.category}</span>
                </div>
            ))}
        </div>
    );
}
