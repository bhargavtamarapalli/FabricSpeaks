import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Mail, Phone, Clock } from 'lucide-react';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import { formatDistanceToNow } from 'date-fns';

export default function AbandonedCarts() {
    const { data: carts = [], isLoading } = useQuery({
        queryKey: ['admin', 'abandoned-carts'],
        queryFn: () => adminApi.customers.getAbandonedCarts(),
    });

    return (
        <AdminLayout>
            <SEO title="Abandoned Carts - Admin Panel" description="Recover lost sales" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Abandoned Carts</h1>
                        <p className="mt-1 text-sm text-slate-400">Track and recover incomplete orders.</p>
                    </div>
                </div>

                <div className="rounded-md border border-slate-800 bg-slate-900/50">
                    <Table>
                        <TableHeader className="bg-slate-900">
                            <TableRow className="border-slate-800">
                                <TableHead className="text-slate-400">Customer</TableHead>
                                <TableHead className="text-slate-400">Cart Value</TableHead>
                                <TableHead className="text-slate-400">Items</TableHead>
                                <TableHead className="text-slate-400">Abandoned</TableHead>
                                <TableHead className="text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {carts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        No abandoned carts found recently.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                carts.map((cart: any) => (
                                    <TableRow key={cart.cartId} className="border-slate-800 hover:bg-slate-800/50">
                                        <TableCell>
                                            <div className="font-medium text-white">{cart.username || 'Guest'}</div>
                                            <div className="flex flex-col gap-1 mt-1">
                                                {cart.email && (
                                                    <div className="flex items-center text-xs text-slate-400">
                                                        <Mail className="mr-1 h-3 w-3" /> {cart.email}
                                                    </div>
                                                )}
                                                {cart.phone && (
                                                    <div className="flex items-center text-xs text-slate-400">
                                                        <Phone className="mr-1 h-3 w-3" /> {cart.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            ₹{cart.totalValue?.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                                                    {cart.itemsCount} items
                                                </Badge>
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500 max-w-[200px] truncate">
                                                {cart.items?.map((i: any) => i.productName).join(', ')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            <div className="flex items-center">
                                                <Clock className="mr-1 h-3 w-3 text-slate-500" />
                                                {formatDistanceToNow(new Date(cart.updatedAt), { addSuffix: true })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                                <Mail className="mr-2 h-3 w-3" />
                                                Send Nudge
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
}
