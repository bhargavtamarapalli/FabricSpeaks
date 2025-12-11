/**
 * Product Form Component
 * 
 * Comprehensive form for creating and editing products.
 * Features:
 * - Multi-section layout
 * - Form validation
 * - Image upload integration
 * - Variant management integration
 * - Rich text editor for description
 * - SEO settings
 * 
 * @example
 * <ProductForm
/**
 * Product Form Component
 * 
 * Comprehensive form for creating and editing products.
 * Features:
 * - Multi-section layout
 * - Form validation
 * - Image upload integration
 * - Variant management integration
 * - Rich text editor for description
 * - SEO settings
 * 
 * @example
 * <ProductForm
 *   initialData={product}
 *   onSubmit={handleSubmit}
 *   loading={isSubmitting}
 * />
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from './ImageUploader';
import { SignatureDetailsForm, SignatureDetails } from './SignatureDetailsForm';
import { VariantManager } from './VariantManager';
import { cn, slugify } from '@/lib/admin/utils';
import { PRODUCT_STATUSES } from '@/lib/admin/constants';
import type { AdminProduct } from '@/types/admin';

// Validation Schema
const productSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    slug: z.string().min(3, 'Slug must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().min(0, 'Price must be positive'),
    salePrice: z.preprocess(
        (val) => (val === '' || val === null || typeof val === 'undefined' || Number.isNaN(Number(val))) ? undefined : Number(val),
        z.number().min(0, 'Sale price must be positive').optional()
    ),
    sku: z.string().min(3, 'SKU is required'),
    status: z.enum(['active', 'draft', 'archived']),
    categoryId: z.string().optional(),
    lowStockThreshold: z.number().min(0, 'Threshold must be positive').optional(),
    fabricQuality: z.string().optional(),
    fabric: z.string().optional(),
    washCare: z.string().optional(),
    // New Attributes
    brand: z.string().optional(),
    importedFrom: z.string().optional(),
    isImported: z.boolean().default(false),
    isSignature: z.boolean().default(false),
    gsm: z.preprocess((val) => (val === '' || val === null) ? undefined : Number(val), z.number().optional()),
    weave: z.string().optional(),
    occasion: z.string().optional(),
    pattern: z.string().optional(),
    fit: z.string().optional(),
    saleStartAt: z.string().optional(),
    saleEndAt: z.string().optional(),
    images: z.array(z.string()).optional(),

    colorImages: z.record(z.array(z.union([z.string(), z.any()]))).optional(),
    variants: z.array(z.object({
        size: z.string(),
        color: z.string(),
        stock: z.number(),
        sku: z.string().optional(),
    })).optional(),
    mainImage: z.any().optional(),
    signatureDetails: z.any().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export interface ProductFormProps {
    /** Initial data for edit mode */
    initialData?: AdminProduct;

    /** Submit handler */
    onSubmit: (data: ProductFormData) => Promise<void>;

    /** Cancel handler */
    onCancel: () => void;

    /** Loading state */
    loading?: boolean;

    /** Categories list */
    categories?: { id: string; name: string; parent_id?: string }[];

    /** Create category handler */
    onCreateCategory?: (name: string, parentId?: string) => Promise<void>;
}

export function ProductForm({
    initialData,
    onSubmit,
    onCancel,
    loading = false,
    categories = [],
    onCreateCategory,
}: ProductFormProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'inventory' | 'media' | 'seo' | 'attributes'>('general');
    const { toast } = useToast();

    // Category Creation State
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryParent, setNewCategoryParent] = useState<string | undefined>(undefined);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim() || !onCreateCategory) return;

        setIsCreatingCategory(true);
        try {
            await onCreateCategory(newCategoryName, newCategoryParent);
            setNewCategoryName('');
            setNewCategoryParent(undefined);
            setIsCategoryDialogOpen(false);
        } catch (error) {
            console.error("Failed to create category", error);
        } finally {
            setIsCreatingCategory(false);
        }
    };

    console.log('[DEBUG] ProductForm Initial Data:', initialData);
    console.log('[DEBUG] Color Images from Initial Data:', initialData?.colorImages || (initialData as any)?.color_images);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || '',
            slug: initialData?.slug || '',
            description: initialData?.description || '',
            price: initialData?.price ? parseFloat(initialData.price) : 0,
            salePrice: initialData?.salePrice ? parseFloat(initialData.salePrice) : (initialData as any)?.sale_price ? parseFloat((initialData as any).sale_price) : undefined,
            sku: initialData?.sku || '',
            status: initialData?.status || 'draft',
            categoryId: initialData?.categoryId || (initialData as any)?.category_id || undefined,
            lowStockThreshold: initialData?.lowStockThreshold || (initialData as any)?.low_stock_threshold || 10,
            fabricQuality: initialData?.fabricQuality || (initialData as any)?.fabric_quality || '',
            fabric: initialData?.fabric || '',
            washCare: initialData?.washCare || (initialData as any)?.wash_care || '',
            // New Fields
            brand: (initialData as any)?.brand || '',
            importedFrom: (initialData as any)?.imported_from || '',
            isImported: (initialData as any)?.is_imported || false,
            isSignature: (initialData as any)?.is_signature || false,
            gsm: (initialData as any)?.gsm || undefined,
            weave: (initialData as any)?.weave || '',
            occasion: (initialData as any)?.occasion || '',
            pattern: (initialData as any)?.pattern || '',
            fit: (initialData as any)?.fit || '',
            saleStartAt: (initialData as any)?.sale_start_at ? new Date((initialData as any).sale_start_at).toISOString().slice(0, 16) : '',
            signatureDetails: (initialData as any)?.signature_details || null,
            saleEndAt: (initialData as any)?.sale_end_at ? new Date((initialData as any).sale_end_at).toISOString().slice(0, 16) : '',

            images: initialData?.images || [],
            variants: initialData?.variants?.map(v => ({
                id: v.id,
                size: v.size || '',
                color: v.colour || '',
                stock: v.stock_quantity || 0,
                sku: v.sku || '',
                images: v.images || [],
            })) || [],
            colorImages: initialData?.colorImages || (initialData as any)?.color_images || {},
            mainImage: (initialData as any)?.mainImage || (initialData as any)?.main_image || undefined,
        },
    });

    // Watch variants to extract unique colors
    const variants = watch('variants') || [];
    const uniqueColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
    const colorImages = watch('colorImages') || {};
    const mainImage = watch('mainImage');

    // Auto-generate slug from name
    const name = watch('name');
    useEffect(() => {
        if (name && !initialData) {
            setValue('slug', slugify(name));
        }
    }, [name, initialData, setValue]);

    const handleFormSubmit = async (data: ProductFormData) => {
        try {
            await onSubmit(data);
        } catch (error) {
            console.error('Form submission error:', error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "An error occurred while saving the product.",
            });
        }
    };

    const handleFormError = (errors: any) => {
        console.error('Form validation errors:', errors);

        // Determine which tab has errors
        let targetTab = activeTab;
        if (errors.name || errors.description || errors.status || errors.categoryId) {
            targetTab = 'general';
        } else if (errors.price || errors.sku || errors.variants || errors.lowStockThreshold) {
            targetTab = 'inventory';
        } else if (errors.images || errors.colorImages) {
            targetTab = 'media';
        } else if (errors.fabricQuality || errors.washCare) {
            targetTab = 'seo';
        }

        if (targetTab !== activeTab) {
            setActiveTab(targetTab);
        }

        // Create a readable list of missing fields
        const missingFields = Object.keys(errors).map(key => {
            // Convert camelCase to Title Case (e.g., "salePrice" -> "Sale Price")
            return key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
        }).join(", ");

        toast({
            variant: "destructive",
            title: "Validation Error",
            description: `Please check the following fields: ${missingFields}`,
        });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-8">
            {/* Tabs */}
            <div className="border-b border-slate-800">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {[
                        { id: 'general', name: 'General Information' },
                        { id: 'attributes', name: 'Attributes & Fabric' },
                        { id: 'inventory', name: 'Inventory & Variants' },
                        { id: 'media', name: 'Media' },
                        { id: 'seo', name: 'SEO & Meta' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-300',
                                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                            )}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* General Tab */}
            <div className={cn('space-y-6', activeTab !== 'general' && 'hidden')}>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Basic Info */}
                    <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white">General Information</h3>

                        <div className="space-y-2">
                            <Label htmlFor="name">Product Name</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                className="bg-slate-950 border-slate-800"
                                placeholder="e.g. Classic White Shirt"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-400">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <div className="bg-slate-950 border border-slate-800 rounded-md">
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <ReactQuill
                                            theme="snow"
                                            value={field.value}
                                            onChange={field.onChange}
                                            className="h-64 mb-12 text-white"
                                        />
                                    )}
                                />
                            </div>
                            {errors.description && (
                                <p className="text-sm text-red-400">{errors.description.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Organization */}
                    <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white">Organization</h3>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="bg-slate-950 border-slate-800">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRODUCT_STATUSES.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Controller
                                name="categoryId"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="bg-slate-950 border-slate-800">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                            <div className="p-2 border-t border-slate-800 mt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full justify-start text-indigo-400 hover:text-indigo-300 h-8 px-2"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsCategoryDialogOpen(true);
                                                    }}
                                                >
                                                    + Add New Category
                                                </Button>
                                            </div>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand</Label>
                            <Input
                                id="brand"
                                {...register('brand')}
                                className="bg-slate-950 border-slate-800"
                                placeholder="e.g. Fabric Speaks"
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Controller
                                name="isSignature"
                                control={control}
                                render={({ field }) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange} id="isSignature" />
                                )}
                            />
                            <Label htmlFor="isSignature">Signature Collection</Label>
                        </div>

                        {/* Signature Details Form - Conditionally Rendered */}
                        {watch('isSignature') && (
                            <div className="mt-6">
                                <SignatureDetailsForm
                                    value={watch('signatureDetails')}
                                    onChange={(details) => setValue('signatureDetails', details)}
                                    productId={initialData?.id}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Attributes Tab */}
            <div className={cn('space-y-6', activeTab !== 'attributes' && 'hidden')}>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Fabric Details */}
                    <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white">Fabric Details</h3>

                        <div className="space-y-2">
                            <Label htmlFor="fabric">Fabric Type</Label>
                            <Input id="fabric" {...register('fabric')} className="bg-slate-950 border-slate-800" placeholder="e.g. Cotton, Silk" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fabricQuality">Fabric Quality</Label>
                            <Input id="fabricQuality" {...register('fabricQuality')} className="bg-slate-950 border-slate-800" placeholder="e.g. 100s Two Ply" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gsm">GSM (Weight)</Label>
                                <Input id="gsm" type="number" {...register('gsm')} className="bg-slate-950 border-slate-800" placeholder="e.g. 180" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weave">Weave</Label>
                                <Input id="weave" {...register('weave')} className="bg-slate-950 border-slate-800" placeholder="e.g. Poplin" />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-4">
                            <Controller
                                name="isImported"
                                control={control}
                                render={({ field }) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange} id="isImported" />
                                )}
                            />
                            <Label htmlFor="isImported">Imported Fabric</Label>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label htmlFor="importedFrom">Imported From (Country)</Label>
                            <Input
                                id="importedFrom"
                                {...register('importedFrom')}
                                className="bg-slate-950 border-slate-800"
                                placeholder="e.g. Italy, Japan"
                            />
                        </div>
                    </div>

                    {/* Apparel Attributes */}
                    <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white">Apparel Attributes</h3>

                        <div className="space-y-2">
                            <Label htmlFor="occasion">Occasion</Label>
                            <Controller
                                name="occasion"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="bg-slate-950 border-slate-800">
                                            <SelectValue placeholder="Select occasion" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="formal">Formal</SelectItem>
                                            <SelectItem value="casual">Casual</SelectItem>
                                            <SelectItem value="party">Party</SelectItem>
                                            <SelectItem value="wedding">Wedding</SelectItem>
                                            <SelectItem value="lounge">Lounge</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fit">Fit</Label>
                            <Controller
                                name="fit"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="bg-slate-950 border-slate-800">
                                            <SelectValue placeholder="Select fit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="slim">Slim Fit</SelectItem>
                                            <SelectItem value="regular">Regular Fit</SelectItem>
                                            <SelectItem value="relaxed">Relaxed Fit</SelectItem>
                                            <SelectItem value="oversized">Oversized</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Tab */}
            <div className={cn('space-y-6', activeTab !== 'inventory' && 'hidden')}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Pricing */}
                    <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white">Pricing</h3>

                        <div className="space-y-2">
                            <Label htmlFor="price">Regular Price (₹)</Label>
                            <Input
                                id="price"
                                type="number"
                                {...register('price', { valueAsNumber: true })}
                                className="bg-slate-950 border-slate-800"
                            />
                            {errors.price && (
                                <p className="text-sm text-red-400">{errors.price.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salePrice">Sale Price (₹)</Label>
                            <Input
                                id="salePrice"
                                type="number"
                                {...register('salePrice', { valueAsNumber: true })}
                                className="bg-slate-950 border-slate-800"
                            />
                        </div>

                        <p className="text-xs text-slate-500 pt-2">
                            💡 Tip: Use the Sales Management feature for store-wide promotions.
                        </p>
                    </div>

                    {/* Inventory */}
                    <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/50 p-6 lg:col-span-2">
                        <h3 className="text-lg font-medium text-white">Inventory</h3>

                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                            <Input
                                id="sku"
                                {...register('sku')}
                                className="bg-slate-950 border-slate-800"
                            />
                            {errors.sku && (
                                <p className="text-sm text-red-400">{errors.sku.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            <div className="space-y-2">
                                <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                                <Input
                                    id="lowStockThreshold"
                                    type="number"
                                    {...register('lowStockThreshold', { valueAsNumber: true })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variants */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                    <Controller
                        control={control}
                        name="variants"
                        render={({ field }) => (
                            <VariantManager
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.variants?.message}
                            />
                        )}
                    />
                </div>
            </div>

            {/* Media Tab */}
            <div className={cn('space-y-6', activeTab !== 'media' && 'hidden')}>

                {/* Default Images (No Variants) */}
                {uniqueColors.length === 0 && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Product Images</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Upload images for the product. Select a star to set the main image.
                        </p>
                        <ImageUploader
                            value={colorImages['default'] || []}
                            onChange={(images) => {
                                setValue('colorImages', {
                                    ...colorImages,
                                    'default': images
                                });
                                // If main image is removed or not set, set first image as main
                                if (images.length > 0 && !mainImage) {
                                    setValue('mainImage', images[0]);
                                }
                            }}
                            mainImage={mainImage}
                            onSetMainImage={(img) => setValue('mainImage', img)}
                            maxImages={5}
                        />
                    </div>
                )}

                {/* Color Gallery Section (With Variants) */}
                {uniqueColors.length > 0 && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Color Gallery</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Upload images for each color variant. Select a star to set the main image.
                        </p>

                        <div className="space-y-8">
                            {uniqueColors.map((color) => (
                                <div key={color} className="border-t border-slate-800 pt-6 first:border-0 first:pt-0">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div
                                            className="w-4 h-4 rounded-full border border-slate-600"
                                            style={{ backgroundColor: color.toLowerCase() }}
                                        />
                                        <h4 className="text-md font-medium text-slate-200">{color} Images</h4>
                                    </div>
                                    <ImageUploader
                                        value={colorImages[color] || colorImages['default'] || []}
                                        onChange={(images) => {
                                            console.log(`[DEBUG] Uploading images for color: ${color}`, images);
                                            console.log('[DEBUG] Current colorImages before update:', colorImages);
                                            const newColorImages = {
                                                ...colorImages,
                                                [color]: images
                                            };
                                            console.log('[DEBUG] New colorImages after update:', newColorImages);
                                            setValue('colorImages', newColorImages);
                                        }}
                                        mainImage={mainImage}
                                        onSetMainImage={(img) => setValue('mainImage', img)}
                                        maxImages={5}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SEO Tab */}
            <div className={cn('space-y-6', activeTab !== 'seo' && 'hidden')}>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Product Details</h3>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-400">SEO settings coming soon.</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 border-t border-slate-800 pt-6">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="text-slate-400 hover:text-white"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Saving...
                        </>
                    ) : (
                        'Save Product'
                    )}
                </Button>
            </div>

            {/* Category Creation Dialog */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-category-name">Category Name</Label>
                            <Input
                                id="new-category-name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g. Summer Collection"
                                className="bg-slate-950 border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-category-parent">Parent Category (Optional)</Label>
                            <Select
                                value={newCategoryParent || "none"}
                                onValueChange={(val) => setNewCategoryParent(val === "none" ? undefined : val)}
                            >
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Select parent category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Root Category)</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsCategoryDialogOpen(false)}
                            disabled={isCreatingCategory}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim() || isCreatingCategory}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isCreatingCategory ? 'Creating...' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
    );
}
