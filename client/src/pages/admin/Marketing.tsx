import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Send, Calendar, Mail, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';

const campaignSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(['whatsapp', 'email']),
    subject: z.string().optional(),
    message: z.string().min(1, "Message is required"),
    scheduled_at: z.string().optional(), // ISO string
});

export default function Marketing() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Mock data for now until backend is implemented
    const { data: campaigns = [], isLoading } = useQuery({
        queryKey: ['admin', 'marketing'],
        queryFn: async () => {
            return adminApi.marketing.list();
        },
    });

    const form = useForm<z.infer<typeof campaignSchema>>({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
            name: '',
            type: 'whatsapp',
            subject: '',
            message: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: z.infer<typeof campaignSchema>) => {
            await adminApi.marketing.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'marketing'] });
            toast({ title: "Campaign created" });
            setIsDialogOpen(false);
            form.reset();
        },
    });

    function onSubmit(data: z.infer<typeof campaignSchema>) {
        createMutation.mutate(data);
    }

    return (
        <AdminLayout>
            <SEO title="Marketing - Admin Panel" description="Manage marketing campaigns" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Marketing</h1>
                        <p className="mt-1 text-sm text-slate-400">Create and schedule blasts.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="mr-2 h-4 w-4" />
                                New Campaign
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create Campaign</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Campaign Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="bg-slate-800 border-slate-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Channel</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-slate-800 border-slate-700">
                                                            <SelectValue placeholder="Select channel" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                                        <SelectItem value="email">Email</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {form.watch('type') === 'email' && (
                                        <FormField
                                            control={form.control}
                                            name="subject"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Subject</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="bg-slate-800 border-slate-700" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <FormField
                                        control={form.control}
                                        name="message"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Message</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} className="bg-slate-800 border-slate-700 min-h-[100px]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="scheduled_at"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Schedule (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" {...field} className="bg-slate-800 border-slate-700" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                                        Create Campaign
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-md border border-slate-800 bg-slate-900/50">
                    <Table>
                        <TableHeader className="bg-slate-900">
                            <TableRow className="border-slate-800">
                                <TableHead className="text-slate-400">Name</TableHead>
                                <TableHead className="text-slate-400">Channel</TableHead>
                                <TableHead className="text-slate-400">Status</TableHead>
                                <TableHead className="text-slate-400">Scheduled</TableHead>
                                <TableHead className="text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        No campaigns found. Create one to start marketing.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                campaigns.map((campaign: any) => (
                                    <TableRow key={campaign.id} className="border-slate-800 hover:bg-slate-800/50">
                                        <TableCell>
                                            <div className="font-medium text-white">{campaign.name}</div>
                                            <div className="text-xs text-slate-400 truncate max-w-[200px]">{campaign.message}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-slate-300">
                                                {campaign.type === 'whatsapp' ? <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> : <Mail className="mr-2 h-4 w-4 text-blue-500" />}
                                                {campaign.type === 'whatsapp' ? 'WhatsApp' : 'Email'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${campaign.status === 'sent' ? 'bg-green-500/10 text-green-500' :
                                                campaign.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-slate-500/10 text-slate-500'
                                                }`}>
                                                {campaign.status.toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {campaign.scheduled_at ? format(new Date(campaign.scheduled_at), 'MMM d, h:mm a') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {campaign.status === 'draft' && (
                                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                                    <Send className="mr-2 h-3 w-3" />
                                                    Send Now
                                                </Button>
                                            )}
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
