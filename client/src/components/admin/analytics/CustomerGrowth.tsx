/**
 * Customer Growth Component
 * 
 * Chart for visualizing customer acquisition trends.
 * Features:
 * - Bar chart for new customers
 * - Line chart for cumulative growth
 * - Custom tooltips
 * 
 * @example
 * <CustomerGrowth data={data} />
 */

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend
} from 'recharts';

export interface CustomerGrowthProps {
    /** Chart data */
    data: Array<{
        date: string;
        newCustomers: number;
        activeCustomers: number;
    }>;

    /** Additional CSS classes */
    className?: string;
}

export function CustomerGrowth({ data, className }: CustomerGrowthProps) {
    return (
        <div className={className}>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
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
                            cursor={{ fill: '#1e293b', opacity: 0.5 }}
                        />
                        <Legend />
                        <Bar
                            dataKey="newCustomers"
                            name="New Customers"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="activeCustomers"
                            name="Active Customers"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
