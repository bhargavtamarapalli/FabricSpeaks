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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Image, BarChart2, FileText, Trash2, Calendar as CalendarIcon, Edit, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BannerImageUploader } from "@/components/admin/content/BannerImageUploader";

const contentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(['banner', 'poll', 'blog']),

    // For Polls
    question: z.string().optional(),
    options: z.array(z.object({ value: z.string().min(1, "Option cannot be empty") })).optional(),

    // For Blogs
    bodyText: z.string().optional(),

    // For Banners
    mediaType: z.enum(['image', 'video']).optional(),
    mediaUrl: z.string().optional(),
    mobileMediaUrl: z.string().optional(),
    subtitle: z.string().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),

    // Common
    display_order: z.coerce.number().int().default(0),
    is_active: z.boolean().default(true),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
});

type ContentFormValues = z.infer<typeof contentSchema>;

// Link Builder Component for friendly URL construction
function LinkBuilder({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [linkType, setLinkType] = useState<'custom' | 'product' | 'collection' | 'page'>('custom');
    const [param, setParam] = useState('');

    // Pre-parse existing value to set initial state
    useEffect(() => {
        if (!value) return;
        if (value.startsWith('/product/')) {
            setLinkType('product');
            setParam(value.replace('/product/', ''));
        } else if (value.startsWith('/clothing?fabric=')) {
            setLinkType('collection');
            setParam(value.replace('/clothing?fabric=', ''));
        } else if (['/sale', '/new-arrivals', '/clothing', '/about', '/contact'].includes(value)) {
            setLinkType('page');
            setParam(value);
        } else {
            setLinkType('custom');
        }
    }, []); // Run once on mount? Or when value changes externally? 
    // Actually, running only on mount is safer to avoid loop, but let's watch 'value' ONLY if it changes from outside (not from our own storage).
    // For now, simple state is enough.

    const { data: products } = useQuery({
        queryKey: ['admin', 'products-list'],
        queryFn: async () => {
            const res = await adminApi.product.getProducts({ limit: 100 });
            return res.data || [];
        },
        enabled: linkType === 'product'
    });

    // Update parent when local state changes
    useEffect(() => {
        if (linkType === 'custom') {
            // Check if param is different from value before calling onChange to avoid loop?
            // Actually, for custom, the input directly calls onChange, so we don't need this effect to sync 'param' to 'value' 
            // EXCEPT if we switched TO custom from something else.
            // Let's handle updates explicitly in handlers.
        } else if (linkType === 'product' && param) {
            onChange(`/product/${param}`);
        } else if (linkType === 'collection' && param) {
            onChange(`/clothing?fabric=${param}`);
        } else if (linkType === 'page' && param) {
            onChange(param);
        }
    }, [linkType, param]);

    const staticPages = [
        { label: "Sale", value: "/sale" },
        { label: "New Arrivals", value: "/new-arrivals" },
        { label: "All Clothing", value: "/clothing" },
        { label: "Fabrics Info", value: "/fabrics" },
    ];

    const fabrics = ["Cotton", "Linen", "Wool", "Silk", "Polyester", "Denim", "Leather"];

    return (
        <div className="space-y-3 p-3 border border-border rounded-md bg-muted/30">
            <FormLabel>Link Destination</FormLabel>
            <Select
                value={linkType}
                onValueChange={(v: any) => {
                    setLinkType(v);
                    setParam(''); // Reset param on type change
                    if (v === 'custom') onChange('');
                }}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select link type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="custom">Custom URL</SelectItem>
                    <SelectItem value="product">Specific Product</SelectItem>
                    <SelectItem value="collection">Fabric Collection</SelectItem>
                    <SelectItem value="page">Static Page</SelectItem>
                </SelectContent>
            </Select>

            {linkType === 'custom' && (
                <Input
                    placeholder="/path/to/page"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}

            {linkType === 'product' && (
                <Select value={param} onValueChange={setParam}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                        {products?.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {linkType === 'collection' && (
                <Select value={param} onValueChange={setParam}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select fabric" />
                    </SelectTrigger>
                    <SelectContent>
                        {fabrics.map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {linkType === 'page' && (
                <Select value={param} onValueChange={setParam}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select page" />
                    </SelectTrigger>
                    <SelectContent>
                        {staticPages.map(p => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <p className="text-xs text-muted-foreground mt-1">
                Preview: <span className="font-mono">{value || '(none)'}</span>
            </p>
        </div>
    );
}

export default function Content() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { data: contents = [], isLoading } = useQuery({
        queryKey: ['admin', 'content'],
        queryFn: async () => {
            return adminApi.content.list();
        },
    });

    const form = useForm<ContentFormValues>({
        resolver: zodResolver(contentSchema),
        defaultValues: {
            title: '',
            type: 'banner',
            question: '',
            options: [{ value: '' }, { value: '' }],
            bodyText: '',
            mediaType: 'image',
            mediaUrl: '',
            subtitle: '',
            ctaText: 'Shop Now',
            ctaLink: '/clothing',
            display_order: 0,
            is_active: true,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options",
    });

    const createMutation = useMutation({
        mutationFn: async (data: ContentFormValues) => {
            let contentPayload: any = {};

            if (data.type === 'poll') {
                contentPayload = {
                    question: data.question,
                    options: data.options?.map(o => o.value) || []
                };
            } else if (data.type === 'banner') {
                contentPayload = {
                    mediaType: data.mediaType,
                    mediaUrl: data.mediaUrl,
                    mobileMediaUrl: data.mobileMediaUrl, // Add this
                    subtitle: data.subtitle,
                    ctaText: data.ctaText,
                    ctaLink: data.ctaLink,
                };
            } else {
                contentPayload = {
                    text: data.bodyText
                };
            }

            const payload = {
                title: data.title,
                type: data.type,
                content: contentPayload,
                is_active: data.is_active,
                display_order: data.display_order,
                start_date: data.start_date,
                end_date: data.end_date,
            };

            if (editingId) {
                await adminApi.content.update(editingId, payload);
            } else {
                await adminApi.content.create(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
            toast({ title: editingId ? "Content updated" : "Content created" });
            handleCloseDialog();
        },
        onError: (error) => {
            console.error("Mutation error:", error);
            toast({ title: "Operation failed", description: "Could not save content", variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await adminApi.content.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
            toast({ title: "Content deleted" });
        },
    });

    function onSubmit(data: ContentFormValues) {
        createMutation.mutate(data);
    }

    const handleEdit = (content: any) => {
        setEditingId(content.id);

        // Map content JSONB back to form fields
        const values: any = {
            title: content.title,
            type: content.type,
            is_active: content.is_active,
            display_order: content.display_order || 0,
            start_date: content.start_date ? new Date(content.start_date) : undefined,
            end_date: content.end_date ? new Date(content.end_date) : undefined,
        };

        if (content.type === 'poll') {
            values.question = content.content.question;
            values.options = content.content.options?.map((v: string) => ({ value: v })) || [];
        } else if (content.type === 'banner') {
            values.mediaType = content.content.mediaType || 'image';
            values.mediaUrl = content.content.mediaUrl || '';
            values.mobileMediaUrl = content.content.mobileMediaUrl || ''; // Add this
            values.subtitle = content.content.subtitle || '';
            values.ctaText = content.content.ctaText || '';
            values.ctaLink = content.content.ctaLink || '';
        } else {
            values.bodyText = content.content.text || '';
        }

        form.reset(values);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingId(null);
        form.reset({
            title: '',
            type: 'banner',
            question: '',
            options: [{ value: '' }, { value: '' }],
            bodyText: '',
            mediaType: 'image',
            mediaUrl: '',
            mobileMediaUrl: '', // Add this
            subtitle: '',
            ctaText: 'Shop Now',
            ctaLink: '/clothing',
            display_order: 0,
            is_active: true,
        });
    };

    const watchType = form.watch('type');

    return (
        <AdminLayout>
            <SEO title="Content - Admin Panel" description="Manage app content" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="admin-page-title">Content Management</h1>
                        <p className="admin-page-subtitle">Manage banners, polls, and blogs.</p>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Content
                    </Button>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                    <DialogContent className="bg-background border-border text-foreground max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-foreground">{editingId ? "Edit Content" : "Add New Content"}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Internal Title</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="bg-background border-input" placeholder="e.g., Summer Sale Banner" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingId}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background border-input">
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                                        <SelectItem value="banner">Banner</SelectItem>
                                                        <SelectItem value="poll">Poll</SelectItem>
                                                        <SelectItem value="blog">Blog Post</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="display_order"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Priority (Order)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} className="bg-background border-input" />
                                                </FormControl>
                                                <FormDescription>Lower number = Higher priority</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Banner Specific Fields */}
                                {watchType === 'banner' && (
                                    <div className="space-y-4 border-l-2 border-primary pl-4 py-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="mediaType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Media Type</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-background border-input">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                                                <SelectItem value="image">Image</SelectItem>
                                                                <SelectItem value="video">Video</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="mediaUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Media URL (Desktop)</FormLabel>
                                                        <FormControl>
                                                            {form.watch('mediaType') === 'image' ? (
                                                                <BannerImageUploader
                                                                    value={field.value || ''}
                                                                    onChange={field.onChange}
                                                                    label="Desktop Image (Landscape)"
                                                                />
                                                            ) : (
                                                                <Input {...field} className="bg-background border-input" placeholder="/assets/video.mp4" />
                                                            )}
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {form.watch('mediaType') === 'image' && (
                                            <FormField
                                                control={form.control}
                                                name="mobileMediaUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Mobile Media URL (Optional)</FormLabel>
                                                        <FormControl>
                                                            <BannerImageUploader
                                                                value={field.value || ''}
                                                                onChange={field.onChange}
                                                                label="Mobile Image (Portrait)"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        <FormField
                                            control={form.control}
                                            name="subtitle"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Subtitle (Visible in Hero)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="bg-background border-input" placeholder="e.g., Up to 50% Off" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="ctaText"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Button Text</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="bg-background border-input" placeholder="Shop Now" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="ctaLink"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <LinkBuilder
                                                                value={field.value || ''}
                                                                onChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                                {watchType === 'poll' && (
                                    <div className="space-y-4 border-l-2 border-primary pl-4">
                                        <FormField
                                            control={form.control}
                                            name="question"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Poll Question</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="bg-background border-input" placeholder="What's your favorite fabric?" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="space-y-2">
                                            <FormLabel>Options</FormLabel>
                                            {fields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}.value`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormControl>
                                                                    <Input {...field} className="bg-background border-input" placeholder={`Option ${index + 1}`} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => remove(index)}
                                                        disabled={fields.length <= 2}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => append({ value: '' })}
                                                className="mt-2 border-input text-muted-foreground hover:bg-muted"
                                            >
                                                <Plus className="mr-2 h-3 w-3" /> Add Option
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {watchType === 'blog' && (
                                    <FormField
                                        control={form.control}
                                        name="bodyText"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Content Text</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="bg-background border-input" placeholder="Content body..." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="start_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Start Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal bg-background border-input hover:bg-muted hover:text-foreground",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                            className="text-popover-foreground bg-popover"
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="end_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>End Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal bg-background border-input hover:bg-muted hover:text-foreground",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                            className="text-popover-foreground bg-popover"
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/10">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Active Status</FormLabel>
                                                <FormDescription>
                                                    Toggle to show or hide this content immediately
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={handleCloseDialog} className="border-border text-muted-foreground hover:bg-muted hover:text-foreground font-bold">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm">
                                        {editingId ? 'Update Content' : 'Create Content'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                <div className="rounded-md border border-border bg-card">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border">
                                <TableHead className="text-muted-foreground">Title</TableHead>
                                <TableHead className="text-muted-foreground">Type</TableHead>
                                <TableHead className="text-muted-foreground">Details</TableHead>
                                <TableHead className="text-muted-foreground">Priority</TableHead>
                                <TableHead className="text-muted-foreground">Schedule</TableHead>
                                <TableHead className="text-muted-foreground">Status</TableHead>
                                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No content found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                contents.map((content: any) => (
                                    <TableRow key={content.id} className="border-border hover:bg-muted/50">
                                        <TableCell>
                                            <div className="font-medium text-foreground">{content.title}</div>
                                            {content.type === 'banner' && content.content?.subtitle && (
                                                <div className="text-xs text-muted-foreground">{content.content.subtitle}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-muted-foreground">
                                                {content.type === 'banner' && <Image className="mr-2 h-4 w-4" />}
                                                {content.type === 'poll' && <BarChart2 className="mr-2 h-4 w-4" />}
                                                {content.type === 'blog' && <FileText className="mr-2 h-4 w-4" />}
                                                {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                                                {content.type === 'poll' ? (
                                                    <span>❓ {content.content?.question} ({content.content?.options?.length} options)</span>
                                                ) : content.type === 'banner' ? (
                                                    <span className="flex items-center gap-1">
                                                        {content.content?.mediaType === 'video' ? '🎥' : '🖼️'}
                                                        {content.content?.mediaUrl?.split('/').pop()}
                                                    </span>
                                                ) : (
                                                    <span>{content.content?.text}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-mono text-muted-foreground">{content.display_order}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-muted-foreground">
                                                {content.start_date ? (
                                                    <div>Start: {format(new Date(content.start_date), 'MMM d, yyyy')}</div>
                                                ) : <span className="text-muted-foreground/50">No start date</span>}
                                                {content.end_date ? (
                                                    <div>End: {format(new Date(content.end_date), 'MMM d, yyyy')}</div>
                                                ) : <span className="text-muted-foreground/50">No end date</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${content.is_active ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {content.is_active ? (
                                                    <><Eye className="mr-1 h-3 w-3" /> Active</>
                                                ) : (
                                                    <><EyeOff className="mr-1 h-3 w-3" /> Inactive</>
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    onClick={() => handleEdit(content)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this content?')) {
                                                            deleteMutation.mutate(content.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
