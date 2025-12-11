import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Package, Truck } from 'lucide-react';
import { format } from 'date-fns';

export function InventoryIntelligence() {
    const { data: healthReport, isLoading } = useQuery({
        queryKey: ['admin', 'inventory', 'health'],
        queryFn: () => adminApi.inventory.getInventoryHealth(),
    });

    if (isLoading) {
        return <div className="text-white">Loading intelligence report...</div>;
    }

    const items = healthReport || [];
    const criticalItems = items.filter((i: any) => i.status === 'critical');
    const lowStockItems = items.filter((i: any) => i.status === 'low_stock');

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">Critical Stockouts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{criticalItems.length}</div>
                        <p className="text-xs text-slate-400">Items needing immediate attention</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">Low Stock Warnings</CardTitle>
                        <TrendingUp className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{lowStockItems.length}</div>
                        <p className="text-xs text-slate-400">Predicted stockout within lead time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Intelligence Table */}
            <div className="rounded-md border border-slate-800 bg-slate-900/50">
                <Table>
                    <TableHeader className="bg-slate-900">
                        <TableRow className="border-slate-800">
                            <TableHead className="text-slate-400">Product</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-slate-400">Sales Velocity</TableHead>
                            <TableHead className="text-slate-400">Days Remaining</TableHead>
                            <TableHead className="text-slate-400">Reorder By</TableHead>
                            <TableHead className="text-slate-400">Suggested Qty</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item: any) => (
                            <TableRow key={item.productId} className="border-slate-800 hover:bg-slate-800/50">
                                <TableCell>
                                    <div>
                                        <div className="font-medium text-white">{item.productName}</div>
                                        <div className="text-xs text-slate-400">{item.sku}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={item.status === 'critical' ? 'destructive' : item.status === 'low_stock' ? 'warning' : 'default'}
                                        className={
                                            item.status === 'critical' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' :
                                                item.status === 'low_stock' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' :
                                                    item.status === 'overstocked' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' :
                                                        'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                        }
                                    >
                                        {item.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-slate-300">
                                    {item.salesVelocity} / day
                                </TableCell>
                                <TableCell className="text-slate-300">
                                    {item.daysUntilStockout > 365 ? '> 1 Year' : `${item.daysUntilStockout} days`}
                                </TableCell>
                                <TableCell className="text-slate-300">
                                    {item.recommendedReorderDate ? format(new Date(item.recommendedReorderDate), 'MMM d, yyyy') : '-'}
                                </TableCell>
                                <TableCell className="text-slate-300">
                                    {item.recommendedReorderQuantity > 0 ? (
                                        <span className="font-bold text-indigo-400">{item.recommendedReorderQuantity} units</span>
                                    ) : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
