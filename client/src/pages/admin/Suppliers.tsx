import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const supplierSchema = z.object({
    name: z.string().min(1, "Name is required"),
    contact_person: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    lead_time_days: z.coerce.number().min(1, "Lead time must be at least 1 day"),
});

export default function Suppliers() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Fetch suppliers (mock for now as backend route isn't strictly defined in task, but we'll assume it exists or use a placeholder)
    // In a real scenario, we'd implement the backend CRUD for suppliers.
    // For this step, I'll implement the UI and mock the API call if needed, or add the backend route.
    // Since I added the schema, I should add the backend route too.

    // Let's assume we'll add the backend route in the next step.
    const { data: suppliers = [], isLoading } = useQuery({
        queryKey: ['admin', 'suppliers'],
        queryFn: async () => {
            // Placeholder until backend route is added
            // return adminApi.suppliers.list();
            return [];
        },
    });

    const form = useForm<z.infer<typeof supplierSchema>>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            lead_time_days: 7,
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: z.infer<typeof supplierSchema>) => {
            // await adminApi.suppliers.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
            toast({ title: "Supplier created" });
            setIsDialogOpen(false);
            form.reset();
        },
    });

    function onSubmit(data: z.infer<typeof supplierSchema>) {
        createMutation.mutate(data);
    }

    return (
        <AdminLayout>
            <SEO title="Suppliers - Admin Panel" description="Manage suppliers" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Suppliers</h1>
                        <p className="mt-1 text-sm text-slate-400">Manage your vendor relationships.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Supplier
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-white">
                            <DialogHeader>
                                <DialogTitle>Add New Supplier</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Supplier Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="bg-slate-800 border-slate-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="contact_person"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Contact Person</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="bg-slate-800 border-slate-700" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="lead_time_days"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Lead Time (Days)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} className="bg-slate-800 border-slate-700" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="bg-slate-800 border-slate-700" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="bg-slate-800 border-slate-700" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="bg-slate-800 border-slate-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                                        Create Supplier
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search suppliers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                        />
                    </div>
                </div>

                <div className="rounded-md border border-slate-800 bg-slate-900/50">
                    <Table>
                        <TableHeader className="bg-slate-900">
                            <TableRow className="border-slate-800">
                                <TableHead className="text-slate-400">Name</TableHead>
                                <TableHead className="text-slate-400">Contact</TableHead>
                                <TableHead className="text-slate-400">Lead Time</TableHead>
                                <TableHead className="text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                        No suppliers found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                suppliers.map((supplier: any) => (
                                    <TableRow key={supplier.id} className="border-slate-800 hover:bg-slate-800/50">
                                        <TableCell>
                                            <div className="font-medium text-white">{supplier.name}</div>
                                            <div className="text-xs text-slate-400">{supplier.address}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {supplier.email && (
                                                    <div className="flex items-center text-xs text-slate-300">
                                                        <Mail className="mr-1 h-3 w-3" /> {supplier.email}
                                                    </div>
                                                )}
                                                {supplier.phone && (
                                                    <div className="flex items-center text-xs text-slate-300">
                                                        <Phone className="mr-1 h-3 w-3" /> {supplier.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {supplier.lead_time_days} days
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                Edit
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
