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
    type = 'area',
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
            <div className={cn('rounded-xl border border-slate-800/50 bg-slate-900/50 p-6', className)}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32 bg-slate-800" />
                        <Skeleton className="h-8 w-24 bg-slate-800" />
                    </div>
                    <Skeleton className="h-[350px] w-full bg-slate-800" />
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
            <div className={cn('rounded-xl border border-slate-800/50 bg-slate-900/50 p-6', className)}>
                <div className="flex flex-col items-center justify-center text-slate-400" style={{ height }}>
                    <span className="text-4xl mb-4">📈</span>
                    <p className="text-sm font-medium">No data available</p>
                    <p className="mt-1 text-xs text-slate-500">Data will appear here once available</p>
                </div>
            </div>
        );
    }

    const ChartComponent = type === 'area' ? AreaChart : LineChart;
    const DataComponent = type === 'area' ? Area : Line;

    return (
        <div className={cn('rounded-xl border border-slate-800/50 bg-slate-900/50 p-6', className)}>
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Total: {formatCurrency(stats.totalRevenue)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-400">Average</p>
                    <p className="text-lg font-semibold text-white">
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
                        stroke="#334155"
                        opacity={0.3}
                        vertical={false}
                    />

                    {/* X Axis */}
                    <XAxis
                        dataKey="formattedDate"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />

                    {/* Y Axis */}
                    <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCurrency(value, 'INR', 'en-IN').replace('.00', '')}
                    />

                    {/* Tooltip */}
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: CHART_COLORS.primary, strokeWidth: 1, strokeDasharray: '5 5' }}
                    />

                    {/* Legend */}
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                        formatter={(value) => <span className="text-sm text-slate-300">{value}</span>}
                    />

                    {/* Revenue Line/Area */}
                    <DataComponent
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke={CHART_COLORS.primary}
                        fill={`url(#revenueGradient)`}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: CHART_COLORS.primary }}
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
        <div className="rounded-lg border border-slate-700 bg-slate-800/95 p-3 shadow-xl backdrop-blur-sm">
            <p className="mb-2 text-sm font-medium text-white">{label}</p>
            <div className="space-y-1">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs text-slate-400">{entry.name}:</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
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
