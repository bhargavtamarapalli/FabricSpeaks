import { useState } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    MoreHorizontal,
    Search,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Edit2,
    Grid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/admin/utils';
import type { InventoryItem } from '@/types/admin';

interface InventoryTableProps {
    data: InventoryItem[];
    loading?: boolean;
    onAdjust: (item: InventoryItem) => void;
    onBulkEdit?: (item: InventoryItem) => void;
}

export function InventoryTable({ data, loading = false, onAdjust, onBulkEdit }: InventoryTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState('');

    const columns: ColumnDef<InventoryItem>[] = [
        {
            accessorKey: 'productName',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="text-slate-400 hover:text-white pl-0"
                    >
                        Product Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-slate-700 bg-slate-800">
                            {item.product.imageUrl ? (
                                <img
                                    src={item.product.imageUrl}
                                    alt={item.product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
                                    No Img
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="font-medium text-white">{item.product.name}</div>
                            <div className="text-xs text-slate-400">{item.product.sku}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'variant',
            header: 'Variant',
            cell: ({ row }) => {
                const item = row.original;
                if (!item.variant) return <span className="text-slate-500">-</span>;
                return (
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300 border border-slate-700">
                            {item.variant.size}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300 border border-slate-700">
                            {item.variant.color}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'stockQuantity',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="text-slate-400 hover:text-white"
                    >
                        Stock
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const stock = row.getValue('stockQuantity') as number;
                const threshold = row.original.lowStockThreshold;

                let statusColor = 'text-green-400';
                let StatusIcon = CheckCircle2;

                if (stock === 0) {
                    statusColor = 'text-red-400';
                    StatusIcon = XCircle;
                } else if (stock <= threshold) {
                    statusColor = 'text-yellow-400';
                    StatusIcon = AlertTriangle;
                }

                return (
                    <div className="flex items-center gap-2">
                        <span className={cn("font-medium", statusColor)}>
                            {stock}
                        </span>
                        <StatusIcon className={cn("h-4 w-4", statusColor)} />
                    </div>
                );
            },
        },
        {
            accessorKey: 'value',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="text-slate-400 hover:text-white"
                    >
                        Value
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue('value'));
                return <div className="text-slate-300">{formatCurrency(amount)}</div>;
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onAdjust(item)}
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px] border-slate-800 bg-slate-900 text-slate-200">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => onAdjust(item)}
                                    className="hover:bg-slate-700 cursor-pointer"
                                >
                                    Adjust Stock
                                </DropdownMenuItem>
                                {onBulkEdit && (
                                    <DropdownMenuItem
                                        onClick={() => onBulkEdit(item)}
                                        className="hover:bg-slate-700 cursor-pointer"
                                    >
                                        <Grid className="mr-2 h-4 w-4" />
                                        Bulk Edit Matrix
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="hover:bg-slate-700 cursor-pointer">View History</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    });

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="rounded-md border border-slate-800 bg-slate-900/50">
                <Table>
                    <TableHeader className="bg-slate-900">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-slate-800 hover:bg-transparent">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="text-slate-400">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className="border-slate-800 hover:bg-slate-800/50"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="border-slate-800">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-400 border-slate-800">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
