/**
 * Customer Table Component
 * 
 * Data table for displaying customers.
 * Features:
 * - Sorting by name, email, orders, spent
 * - Pagination
 * - Row selection
 * - Custom cell rendering
 * - Action menu
 * 
 * @example
 * <CustomerTable
 *   data={customers}
 *   loading={isLoading}
 *   onView={handleView}
 * />
 */

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  ArrowUpDown,
  Mail,
  Phone,
  User
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
import { cn, formatCurrency, formatDate } from '@/lib/admin/utils';
import { userApi } from '@/lib/admin/api';
import type { AdminCustomer } from '@/types/admin';

export interface CustomerTableProps {
  /** Customer data */
  data: AdminCustomer[];

  /** Loading state */
  loading?: boolean;

  /** View handler */
  onView?: (customer: AdminCustomer) => void;

  /** Selection handler */
  onSelectionChange?: (selectedIds: string[]) => void;

  /** Additional CSS classes */
  className?: string;
}

export function CustomerTable({
  data,
  loading = false,
  onView,
  onSelectionChange,
  className,
}: CustomerTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  // Define columns
  const columns: ColumnDef<AdminCustomer>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="pl-0 text-muted-foreground hover:text-foreground"
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const customerName = row.original.name || row.original.username || row.original.email?.split('@')[0] || 'Guest User';
        const joinDate = row.original.createdAt || row.original.created_at;

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{customerName}</span>
              <span className="text-xs text-muted-foreground">
                {joinDate ? `Joined ${formatDate(joinDate, 'short')}` : 'Registration date unknown'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => {
        const email = row.original.email || 'No email';
        const phone = row.original.phone;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[200px]" title={email}>{email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {phone || 'No phone'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalOrders',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="pl-0 text-muted-foreground hover:text-foreground"
        >
          Orders
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-foreground">
          {row.original.totalOrders}
        </div>
      ),
    },
    {
      accessorKey: 'totalSpent',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="pl-0 text-muted-foreground hover:text-foreground"
        >
          Total Spent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-foreground">
          {formatCurrency(row.original.totalSpent)}
        </div>
      ),
    },
    {
      accessorKey: 'lastOrderDate',
      header: 'Last Order',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastOrderDate
            ? formatDate(row.original.lastOrderDate, 'short')
            : 'Never'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const customer = row.original;

        const handleDelete = async () => {
          if (confirm(`Are you sure you want to delete user ${customer.name}?`)) {
            try {
              console.log('[CustomerTable] Deleting user via userApi:', customer.id);
              await userApi.deleteUser(customer.id);
              window.location.reload();
            } catch (e: any) {
              console.error('[CustomerTable] Delete failed:', e);
              alert("Failed to delete user: " + (e.message || 'Unknown error'));
            }
          }
        };

        const handleRoleUpdate = async (role: 'user' | 'admin') => {
          if (confirm(`Change role of ${customer.name} to ${role}?`)) {
            try {
              console.log('[CustomerTable] Updating role via userApi:', customer.id, role);
              await userApi.updateUserRole(customer.id, role);
              window.location.reload();
            } catch (e: any) {
              console.error('[CustomerTable] Role update failed:', e);
              alert("Failed to update role: " + (e.message || 'Unknown error'));
            }
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border bg-popover text-popover-foreground">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onView?.(customer)}
                className="cursor-pointer hover:bg-muted"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRoleUpdate('admin')}
                className="cursor-pointer hover:bg-muted text-amber-600 dark:text-amber-500 hover:text-amber-500"
              >
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer hover:bg-destructive/10 text-destructive hover:text-destructive"
              >
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Initialize table
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

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="rounded-md border border-border">
          <div className="h-12 border-b border-border bg-muted/50 px-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
              <Skeleton className="h-4 w-4 rounded bg-muted" />
              <Skeleton className="h-8 w-8 rounded-full bg-muted" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32 bg-muted" />
                <Skeleton className="h-3 w-20 bg-muted" />
              </div>
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-4 w-20 bg-muted" />
              <Skeleton className="h-8 w-8 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table */}
      <div className="rounded-md border border-border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b [&_tr]:border-border">
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
                    className="border-b border-border transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted/50"
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
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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
            className="border-input text-foreground hover:bg-muted"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-input text-foreground hover:bg-muted"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
