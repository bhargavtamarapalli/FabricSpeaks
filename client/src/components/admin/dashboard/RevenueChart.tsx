/**
 * Revenue Chart Component
 * 
 * Displays revenue trends over time using a line/area chart.
 * Features:
 * - Responsive design
 * - Interactive tooltips
 * - Smooth animations
 * - Multiple data series support
 * - Loading and error states
 * - Customizable time periods
 * 
 * @example
 * <RevenueChart
 *   data={revenueData}
 *   period="month"
 *   loading={false}
 * />
 */

import { useMemo } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { formatCurrency, formatDate, cn } from '@/lib/admin/utils';
import { CHART_COLORS } from '@/lib/admin/constants';
import { Skeleton } from '@/components/ui/skeleton';

export interface RevenueDataPoint {
    date: string;
    revenue: number;
    orders?: number;
    customers?: number;
}

export interface RevenueChartProps {
    /** Chart data */
    data: RevenueDataPoint[];

    /** Chart type */
    type?: 'line' | 'area';

    /** Time period for x-axis formatting */
    period?: 'day' | 'week' | 'month' | 'year';

    /** Show orders line */
    showOrders?: boolean;

    /** Show customers line */
    showCustomers?: boolean;

    /** Chart height in pixels */
    height?: number;

    /** Loading state */
    loading?: boolean;

    /** Error state */
    error?: Error | null;

    /** Additional CSS classes */
    className?: string;
}

export function RevenueChart({
    data,
    type = 'line',
    period = 'month',
    showOrders = false,
    showCustomers = false,
    height = 350,
    loading = false,
    error = null,
    className,
}: RevenueChartProps) {
    // Format data for chart
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return [];
        }

        return data.map(item => ({
            ...item,
            // Format date based on period
            formattedDate: formatDateForPeriod(item.date, period),
        }));
    }, [data, period]);

    // Calculate summary statistics
    const stats = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                totalRevenue: 0,
                avgRevenue: 0,
                maxRevenue: 0,
                minRevenue: 0,
            };
        }

        const revenues = data.map(d => d.revenue);
        return {
            totalRevenue: revenues.reduce((sum, val) => sum + val, 0),
            avgRevenue: revenues.reduce((sum, val) => sum + val, 0) / revenues.length,
            maxRevenue: Math.max(...revenues),
            minRevenue: Math.min(...revenues),
        };
    }, [data]);

    // Loading skeleton
    if (loading) {
        return (
            <div className={cn('admin-card', className)}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32 bg-muted" />
                        <Skeleton className="h-8 w-24 bg-muted" />
                    </div>
                    <Skeleton className="h-[350px] w-full bg-muted" />
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
                    <p className="text-sm font-semibold text-foreground">No revenue data available</p>
                    <p className="mt-1 text-xs text-muted-foreground">Data will appear here once available</p>
                </div>
            </div>
        );
    }

    const ChartComponent = (type === 'area' ? AreaChart : LineChart) as any;
    const DataComponent = (type === 'area' ? Area : Line) as any;

    return (
        <div className={cn('admin-card', className)}>
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Revenue Trend</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Total: {formatCurrency(stats.totalRevenue)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Average</p>
                    <p className="text-xl font-bold text-foreground">
                        {formatCurrency(stats.avgRevenue)}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <ChartComponent
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    {/* Grid */}
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.5}
                        vertical={false}
                    />

                    {/* X Axis */}
                    <XAxis
                        dataKey="formattedDate"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        fontWeight={500}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />

                    {/* Y Axis */}
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        fontWeight={500}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                    />

                    {/* Tooltip */}
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#1e293b', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    />

                    {/* Legend */}
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ paddingTop: '30px' }}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs font-medium text-muted-foreground ml-1">{value}</span>}
                    />

                    {/* Revenue Line */}
                    <DataComponent
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#1e293b" // Deep Navy color from image
                        fill="transparent"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, fill: '#1e293b', strokeWidth: 2, stroke: '#fff' }}
                        animationDuration={1500}
                    />

                    {/* Orders Line (optional) */}
                    {showOrders && (
                        <DataComponent
                            type="monotone"
                            dataKey="orders"
                            name="Orders"
                            stroke={CHART_COLORS.success}
                            fill={`url(#ordersGradient)`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, fill: CHART_COLORS.success }}
                        />
                    )}

                    {/* Customers Line (optional) */}
                    {showCustomers && (
                        <DataComponent
                            type="monotone"
                            dataKey="customers"
                            name="Customers"
                            stroke={CHART_COLORS.secondary}
                            fill={`url(#customersGradient)`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, fill: CHART_COLORS.secondary }}
                        />
                    )}

                    {/* Gradients */}
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="customersGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * Custom tooltip component
 */
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) {
        return null;
    }

    return (
        <div className="rounded-lg border border-border bg-popover/95 p-3 shadow-xl backdrop-blur-md">
            <p className="mb-2 text-sm font-bold text-foreground">{label}</p>
            <div className="space-y-1.5">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs font-medium text-muted-foreground">{entry.name}:</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                            {entry.name === 'Revenue'
                                ? formatCurrency(entry.value)
                                : entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Format date based on period
 */
function formatDateForPeriod(dateStr: string, period: 'day' | 'week' | 'month' | 'year'): string {
    try {
        const date = new Date(dateStr);

        if (isNaN(date.getTime())) {
            console.warn('[RevenueChart] Invalid date:', dateStr);
            return dateStr;
        }

        switch (period) {
            case 'day':
                return new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit'
                }).format(date);
            case 'week':
            case 'month':
                return new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric'
                }).format(date);
            case 'year':
                return new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    year: 'numeric'
                }).format(date);
            default:
                return formatDate(date, 'short');
        }
    } catch (error) {
        console.error('[RevenueChart] Error formatting date:', error);
        return dateStr;
    }
}
