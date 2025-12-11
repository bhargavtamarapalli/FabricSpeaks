/**
 * Admin Signature Products Page
 * 
 * Dedicated page for managing signature collection products.
 * Features:
 * - Grid view of signature products only
 * - Quick preview of signature details
 * - Edit/Delete actions
 * - Status indicators (missing image, etc.)
 * - Link to full product edit form
 * 
 * @route /admin/signature-products
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, AlertTriangle, Award, Image as ImageIcon, Video } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SignatureProduct {
    id: string;
    name: string;
    slug: string;
    price: string;
    sale_price?: string;
    status: string;
    is_signature: boolean;
    main_image?: string;
    signature_details?: {
        tag?: string;
        certificate?: boolean;
        image?: string;
        video?: string;
        show_video?: boolean;
        colorHex?: string;
        details?: {
            fabric?: string;
            origin?: string;
            styling?: string;
        };
    };
}

export default function SignatureProducts() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [previewProduct, setPreviewProduct] = useState<SignatureProduct | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<SignatureProduct | null>(null);

    // Fetch signature products
    const { data: productsData, isLoading, error } = useQuery({
        queryKey: ['admin', 'signature-products'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/products?isSignature=true&limit=100', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch signature products');
            return res.json();
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminApi.products.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'signature-products'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            toast({
                title: "Product deleted",
                description: "The signature product has been deleted.",
            });
            setDeleteProduct(null);
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to delete product.",
            });
        },
    });

    // Filter products by search
    const products: SignatureProduct[] = productsData?.items || [];
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.signature_details?.tag?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handlers
    const handleEdit = (product: SignatureProduct) => {
        navigate(`/admin/products/${product.id}`);
    };

    const handleCreate = () => {
        navigate('/admin/products/new');
    };

    const handleConfirmDelete = () => {
        if (deleteProduct) {
            deleteMutation.mutate(deleteProduct.id);
        }
    };

    // Helper to check if product has missing required fields
    const getMissingFields = (product: SignatureProduct) => {
        const missing: string[] = [];
        if (!product.signature_details?.image && !product.main_image) {
            missing.push('Hero Image');
        }
        return missing;
    };

    return (
        <>
            <SEO
                title="Signature Collection | Admin"
                description="Manage signature collection products"
            />
            <AdminLayout>
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 bg-amber-500 text-white flex items-center justify-center font-serif font-bold text-sm rounded">
                                    S
                                </div>
                                <h1 className="text-2xl font-bold text-foreground">Signature Collection</h1>
                            </div>
                            <p className="text-muted-foreground">
                                Manage your exclusive signature products ({filteredProducts.length} products)
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Search signature products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 bg-background border-input"
                            />
                            <Button onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Signature Product
                            </Button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                            Failed to load signature products. Please try again.
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 bg-muted/50 rounded-lg border border-border">
                            <Award className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No Signature Products</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery
                                    ? 'No products match your search.'
                                    : 'Create your first signature product to get started.'}
                            </p>
                            <Button onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Signature Product
                            </Button>
                        </div>
                    )}

                    {/* Products Grid */}
                    {!isLoading && filteredProducts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map((product) => {
                                const missingFields = getMissingFields(product);
                                const heroImage = product.signature_details?.image || product.main_image;

                                return (
                                    <div
                                        key={product.id}
                                        className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors group"
                                    >
                                        {/* Image */}
                                        <div className="aspect-[3/4] relative bg-muted">
                                            {heroImage ? (
                                                <img
                                                    src={heroImage}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                            )}

                                            {/* Overlay Badges */}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                {product.signature_details?.tag && (
                                                    <Badge className="bg-amber-500/90 text-white text-xs">
                                                        {product.signature_details.tag}
                                                    </Badge>
                                                )}
                                                {product.signature_details?.certificate && (
                                                    <Badge className="bg-green-500/90 text-white text-xs">
                                                        Certified
                                                    </Badge>
                                                )}
                                                {product.signature_details?.video && (
                                                    <Badge className="bg-blue-500/90 text-white text-xs">
                                                        <Video className="h-3 w-3 mr-1" />
                                                        Video
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Warning Badge */}
                                            {missingFields.length > 0 && (
                                                <div className="absolute top-2 right-2">
                                                    <Badge className="bg-red-500/90 text-white text-xs">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Missing: {missingFields.join(', ')}
                                                    </Badge>
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            <div className="absolute bottom-2 left-2">
                                                <Badge
                                                    className={`text-xs ${product.status === 'active'
                                                        ? 'bg-green-500/90'
                                                        : product.status === 'draft'
                                                            ? 'bg-yellow-500/90'
                                                            : 'bg-red-500/90'
                                                        }`}
                                                >
                                                    {product.status}
                                                </Badge>
                                            </div>

                                            {/* Hover Actions */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setPreviewProduct(product)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleEdit(product)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setDeleteProduct(product)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-medium text-foreground truncate mb-1">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-semibold text-foreground">
                                                    ₹{product.sale_price || product.price}
                                                </span>
                                                {product.sale_price && (
                                                    <span className="text-sm text-muted-foreground line-through">
                                                        ₹{product.price}
                                                    </span>
                                                )}
                                            </div>
                                            {product.signature_details?.colorHex && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div
                                                        className="w-4 h-4 rounded-full border border-border"
                                                        style={{ backgroundColor: product.signature_details.colorHex }}
                                                    />
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {product.signature_details.colorHex}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Preview Dialog */}
                <Dialog open={!!previewProduct} onOpenChange={() => setPreviewProduct(null)}>
                    <DialogContent className="max-w-2xl bg-background border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">{previewProduct?.name}</DialogTitle>
                            <DialogDescription>
                                Signature product preview
                            </DialogDescription>
                        </DialogHeader>

                        {previewProduct && (
                            <div className="grid grid-cols-2 gap-6">
                                {/* Image Preview */}
                                <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                                    {(previewProduct.signature_details?.image || previewProduct.main_image) ? (
                                        <img
                                            src={previewProduct.signature_details?.image || previewProduct.main_image}
                                            alt={previewProduct.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Tag</h4>
                                        <p className="text-foreground">
                                            {previewProduct.signature_details?.tag || 'Not set'}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Certificate</h4>
                                        <p className="text-foreground">
                                            {previewProduct.signature_details?.certificate ? '✅ Authenticity Guaranteed' : '❌ Not Certified'}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Glow Color</h4>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full border border-border"
                                                style={{ backgroundColor: previewProduct.signature_details?.colorHex || '#BF953F' }}
                                            />
                                            <span className="text-foreground font-mono">
                                                {previewProduct.signature_details?.colorHex || '#BF953F'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Video</h4>
                                        <p className="text-foreground break-all">
                                            {previewProduct.signature_details?.video || 'No video set'}
                                        </p>
                                    </div>

                                    {previewProduct.signature_details?.details && (
                                        <>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Fabric</h4>
                                                <p className="text-foreground">
                                                    {previewProduct.signature_details.details.fabric || 'Not set'}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Origin</h4>
                                                <p className="text-foreground">
                                                    {previewProduct.signature_details.details.origin || 'Not set'}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Styling</h4>
                                                <p className="text-foreground">
                                                    {previewProduct.signature_details.details.styling || 'Not set'}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    <div className="pt-4 flex gap-2">
                                        <Button onClick={() => handleEdit(previewProduct)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit Product
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => window.open(`/signature-collection`, '_blank')}
                                        >
                                            View on Site
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
                    <AlertDialogContent className="bg-background border-border">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Delete Signature Product?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                                Are you sure you want to delete "{deleteProduct?.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-background border-input text-muted-foreground hover:bg-muted hover:text-foreground">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDelete}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </AdminLayout>
        </>
    );
}
