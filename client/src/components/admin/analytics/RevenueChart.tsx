/**
 * Revenue Chart Component
 * 
 * Advanced chart for visualizing revenue and order trends.
 * Features:
 * - Revenue vs Orders comparison
 * - Custom tooltips
 * - Responsive container
 * - Gradient areas
 * 
 * @example
 * <RevenueChart data={data} />
 */

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend
} from 'recharts';
import { formatCurrency } from '@/lib/admin/utils';

export interface RevenueChartProps {
    /** Chart data */
    data: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;

    /** Additional CSS classes */
    className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
    return (
        <div className={className}>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #1e293b',
                                borderRadius: '8px',
                            }}
                            itemStyle={{ color: '#e2e8f0' }}
                            formatter={(value: number, name: string) => [
                                name === 'revenue' ? formatCurrency(value) : value,
                                name === 'revenue' ? 'Revenue' : 'Orders'
                            ]}
                        />
                        <Legend />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            name="revenue"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            name="orders"
                            stroke="#ec4899"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorOrders)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
