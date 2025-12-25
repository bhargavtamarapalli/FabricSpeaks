/**
 * Order Table Component
 * 
 * Advanced data table for displaying orders.
 * Features:
 * - Sorting
 * - Pagination
 * - Row selection
 * - Custom cell rendering (status, currency, dates)
 * - Responsive design
 * - Loading states
 * 
 * @example
 * <OrderTable
 *   data={orders}
 *   loading={isLoading}
 *   onView={handleView}
 * />
 */

import { useState, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/providers/SocketProvider';
import {
    MoreHorizontal,
    Eye,
    ArrowUpDown,
    Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
    cn,
    formatCurrency,
    formatDate,
    formatRelativeTime
} from '@/lib/admin/utils';
import { useToast } from '@/hooks/use-toast';
import type { AdminOrder } from '@/types/admin';

export interface OrderTableProps {
    /** Table data */
    data: AdminOrder[];

    /** Loading state */
    loading?: boolean;

    /** View handler */
    onView?: (order: AdminOrder) => void;

    /** Additional classes */
    className?: string;
}

export function OrderTable({ data, loading, onView, className }: OrderTableProps) {
    const { toast } = useToast();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState({});
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = (updatedOrder: any) => {
            toast({
                title: "Order Updated",
                description: `Order #${updatedOrder.orderNumber} has been updated.`,
            });
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
        };

        socket.on('order:updated', handleOrderUpdate);

        return () => {
            socket.off('order:updated', handleOrderUpdate);
        };
    }, [socket, queryClient, toast]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            description: `${label} copied to clipboard.`,
        });
    };

    const columns: ColumnDef<AdminOrder>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'orderNumber',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="pl-0 text-muted-foreground hover:text-foreground"
                >
                    Order #
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{row.original.orderNumber}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(row.original.orderNumber, 'Order Number');
                        }}
                    >
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            ),
        },
        {
            accessorKey: 'customer',
            header: 'Customer',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">{row.original.user?.username || 'Guest'}</span>
                    <span className="text-xs text-muted-foreground">{row.original.user?.email || 'No email'}</span>
                </div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="pl-0 text-muted-foreground hover:text-foreground"
                >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm text-foreground">
                        {formatDate(row.original.createdAt, 'short')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(row.original.createdAt))}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'total',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="pl-0 text-muted-foreground hover:text-foreground"
                >
                    Total
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium text-foreground">
                    {formatCurrency(parseFloat(row.original.total))}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <OrderStatusBadge status={row.original.status} />
            ),
        },
        {
            accessorKey: 'paymentStatus',
            header: 'Payment',
            cell: ({ row }) => {
                const status = row.original.paymentStatus;
                if (!status) return <span className="text-xs text-muted-foreground">Unknown</span>;

                return (
                    <span className={cn(
                        'text-xs font-medium capitalize',
                        status === 'paid' ? 'text-green-600 dark:text-green-400' :
                            status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                    )}>
                        {status}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const order = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => onView?.(order)}
                                className="cursor-pointer hover:bg-muted"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            rowSelection,
        },
    });

    if (loading) {
        return (
            <div className={cn('space-y-4', className)}>
                <div className="rounded-md border border-border">
                    <div className="h-12 border-b border-border bg-muted px-4" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
                            <Skeleton className="h-4 w-4 rounded bg-muted" />
                            <Skeleton className="h-4 w-24 bg-muted" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-32 bg-muted" />
                                <Skeleton className="h-3 w-20 bg-muted" />
                            </div>
                            <Skeleton className="h-4 w-20 bg-muted" />
                            <Skeleton className="h-6 w-24 rounded-full bg-muted" />
                            <Skeleton className="h-8 w-8 rounded bg-muted" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            <div className="rounded-md border border-border/50 bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b [&_tr]:border-border/50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="border-b border-border/50 transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted/50"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
