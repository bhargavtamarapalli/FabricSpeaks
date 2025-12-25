import React, { useState, useMemo, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Ruler, Droplets, ShoppingBag, Plus, Minus, Check, Heart, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddToCart, useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useDefaultWishlist, useAddToWishlist, useRemoveFromWishlist, useWishlist } from "@/hooks/useWishlist";
import PageLayout from "@/components/PageLayout";

export default function SignatureProductDetail() {
    const [, params] = useRoute("/signature/:slug");
    const slug = params?.slug;
    const [, setLocation] = useLocation();
    const addToCart = useAddToCart();
    const { toast } = useToast();
    const { user } = useAuth();
    // useCart is effectively used by PageLayout but we might need it here if we want to check things, 
    // but PageLayout handles the header count. 
    // However, the original code used cartQuery.data?.items for header count only.
    // So we can remove useCart if not used elsewhere.
    // Checking usage: cartQuery usage was only in Header prop.
    // So we can remove useCart here.

    // New state for selections
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Image gallery state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

    // Wishlist hooks (only enabled when user is logged in)
    const { data: defaultWishlist } = useDefaultWishlist({ enabled: !!user });
    const { data: wishlistData } = useWishlist(defaultWishlist?.id);
    const addToWishlist = useAddToWishlist();
    const removeFromWishlist = useRemoveFromWishlist();

    const { data: product, isLoading } = useQuery({
        queryKey: ["product", slug],
        queryFn: async () => {
            if (!slug) return null;
            const res = await fetch(`/api/products/${slug}`);
            if (!res.ok) throw new Error("Product not found");
            return res.json();
        },
        enabled: !!slug,
    });

    // Fetch variants
    const { data: variants } = useQuery({
        queryKey: ['product-variants', product?.id],
        queryFn: async () => {
            if (!product?.id) return [];
            const res = await fetch(`/api/products/${product.id}/variants`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!product?.id
    });

    // Get all product images
    const allImages = useMemo(() => {
        if (!product) return [];
        const images: string[] = [];

        // Add signature image first if available
        if (product.signature_details?.image) {
            images.push(product.signature_details.image);
        }
        // Add main image
        if (product.main_image && !images.includes(product.main_image)) {
            images.push(product.main_image);
        }
        // Add images array
        if (Array.isArray(product.images)) {
            product.images.forEach((img: string) => {
                if (!images.includes(img)) images.push(img);
            });
        }
        // Add color images if available
        if (product.color_images && typeof product.color_images === 'object') {
            Object.values(product.color_images).forEach((img: any) => {
                if (typeof img === 'string' && !images.includes(img)) {
                    images.push(img);
                }
            });
        }

        // Add variant images
        if (variants && variants.length > 0) {
            variants.forEach((v: any) => {
                if (v.images && Array.isArray(v.images)) {
                    v.images.forEach((img: string) => {
                        if (!images.includes(img)) {
                            images.push(img);
                        }
                    });
                }
            });
        }

        return images.length > 0 ? images : ['/placeholder-product.jpg'];
    }, [product, variants]);

    // Switch image when color is selected
    useEffect(() => {
        if (!selectedColor) return;

        let found = false;

        // 1. Check color_images
        if (product?.color_images && product.color_images[selectedColor]) {
            const imageUrl = product.color_images[selectedColor];
            const index = allImages.findIndex(img => img === imageUrl);
            if (index !== -1) {
                setSelectedImageIndex(index);
                found = true;
            }
        }

        // 2. Check variants if not found
        if (!found && variants) {
            const variant = variants.find((v: any) => v.colour === selectedColor && v.images?.length > 0);
            if (variant && variant.images[0]) {
                const index = allImages.findIndex(img => img === variant.images[0]);
                if (index !== -1) {
                    setSelectedImageIndex(index);
                }
            }
        }
    }, [selectedColor, allImages, product?.color_images, variants]);

    // Check if product is in wishlist
    const wishlistItem = useMemo(() => {
        if (!wishlistData?.items || !product) return null;
        return wishlistData.items.find(item => item.product_id === product.id);
    }, [wishlistData, product]);

    const isInWishlist = Boolean(wishlistItem);

    // Extract available sizes and colors
    const availableSizes = useMemo(() => {
        if (!product) return [];
        const rawVariants = variants || product.variants || [];

        if (product.size) {
            return product.size.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        if (rawVariants.length > 0) {
            return Array.from(new Set(rawVariants.map((v: any) => v.size).filter(Boolean)));
        }
        return [];
    }, [product, variants]);

    const availableColors = useMemo(() => {
        if (!product) return [];
        let colors: string[] = [];
        const rawVariants = variants || product.variants || [];

        if (product.color_images && Object.keys(product.color_images).length > 0) {
            colors = Object.keys(product.color_images);
        } else if (product.colour) {
            colors = product.colour.split(',').map((c: string) => c.trim()).filter(Boolean);
        } else if (rawVariants.length > 0) {
            colors = Array.from(new Set(rawVariants.map((v: any) => v.colour).filter(Boolean)));
        }

        return colors.filter(c => c && c.toLowerCase() !== 'default');
    }, [product, variants]);

    // Stock status
    const stockStatus = useMemo(() => {
        if (!product) return 'unknown';
        const qty = product.stock_quantity ?? 0;
        if (qty <= 0) return 'out_of_stock';
        if (qty <= (product.low_stock_threshold || 5)) return 'low_stock';
        return 'in_stock';
    }, [product]);

    const canAddToCart = useMemo(() => {
        if (stockStatus === 'out_of_stock') return false;
        if (availableSizes.length > 0 && !selectedSize) return false;
        if (availableColors.length > 0 && !selectedColor) return false;
        return true;
    }, [stockStatus, availableSizes, selectedSize, availableColors, selectedColor]);

    const handleAddToCart = () => {
        if (!product || !canAddToCart) return;

        addToCart.mutate({
            product_id: product.id,
            quantity,
            size: selectedSize || undefined,
            colour: selectedColor || undefined,
        });

        const optionsText = [selectedSize, selectedColor].filter(Boolean).join(' / ');
        toast({
            title: "Added to Bag",
            description: `${product.name}${optionsText ? ` (${optionsText})` : ''} has been added to your cart.`,
        });
        document.dispatchEvent(new Event('open-cart'));
    };

    const handleWishlistToggle = () => {
        if (!user) {
            document.dispatchEvent(new Event('open-auth'));
            toast({
                title: "Sign in required",
                description: "Please sign in to save items to your wishlist.",
            });
            return;
        }

        if (!product || !defaultWishlist) return;

        // If removing from wishlist, no validation needed
        if (isInWishlist && wishlistItem) {
            removeFromWishlist.mutate({
                wishlistId: defaultWishlist.id,
                itemId: wishlistItem.id,
            });
            toast({
                title: "Removed from Wishlist",
                description: `${product.name} has been removed from your wishlist.`,
            });
            return;
        }

        // For adding to wishlist, require size and color selection if available
        if (availableSizes.length > 0 && !selectedSize) {
            toast({
                title: "Select a Size",
                description: "Please select a size before adding to your wishlist.",
                variant: "destructive",
            });
            return;
        }

        if (availableColors.length > 0 && !selectedColor) {
            toast({
                title: "Select a Color",
                description: "Please select a color before adding to your wishlist.",
                variant: "destructive",
            });
            return;
        }

        // Find the matching variant if size/color is selected
        let variantId: string | undefined;
        if (variants && (selectedSize || selectedColor)) {
            const matchingVariant = variants.find((v: any) => {
                const sizeMatch = !selectedSize || v.size === selectedSize;
                const colorMatch = !selectedColor || v.colour === selectedColor;
                return sizeMatch && colorMatch && v.status === 'active';
            });
            variantId = matchingVariant?.id;
        }

        addToWishlist.mutate({
            wishlistId: defaultWishlist.id,
            productId: product.id,
            variantId: variantId || undefined,
        });

        const optionsText = [selectedSize, selectedColor].filter(Boolean).join(' / ');
        toast({
            title: "Added to Wishlist",
            description: `${product.name}${optionsText ? ` (${optionsText})` : ''} has been saved to your wishlist.`,
        });
    };


    const handleImageZoom = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400 dark:text-neutral-600" />
            </div>
        );
    }

    if (!product) return <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-black text-stone-900 dark:text-white">Product not found</div>;

    const details = product.signature_details?.details || {};

    return (
        <PageLayout className="min-h-screen bg-[#F5F5F0] dark:bg-black font-sans transition-colors duration-300">
            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Button
                            variant="ghost"
                            onClick={() => setLocation("/signature-collection")}
                            className="mb-8 hover:bg-transparent hover:text-amber-600 dark:hover:text-amber-500 pl-0 text-stone-600 dark:text-neutral-400"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collection
                        </Button>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row gap-16">
                        {/* Left: Image Gallery */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="w-full lg:w-1/2"
                        >
                            {/* Main Image with Zoom */}
                            <div
                                className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-2xl dark:shadow-none cursor-zoom-in group"
                                onMouseMove={handleImageZoom}
                                onMouseEnter={() => setIsZoomed(true)}
                                onMouseLeave={() => setIsZoomed(false)}
                                onClick={() => setIsZoomed(!isZoomed)}
                            >
                                <img
                                    src={allImages[selectedImageIndex]}
                                    alt={product.name}
                                    className={`w-full h-full object-cover transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                                    style={isZoomed ? {
                                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                                    } : undefined}
                                />

                                {/* Signature Tag */}
                                <div className="absolute top-6 left-6 bg-white/90 dark:bg-black/90 backdrop-blur px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-900 dark:text-white border border-stone-200 dark:border-neutral-800">
                                    {product.signature_details?.tag || "Signature"}
                                </div>

                                {/* Wishlist Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleWishlistToggle();
                                    }}
                                    disabled={addToWishlist.isPending || removeFromWishlist.isPending}
                                    className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur transition-all duration-300 ${isInWishlist
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-white/90 dark:bg-black/90 text-stone-600 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 border border-stone-200 dark:border-neutral-800'
                                        }`}
                                    title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                                >
                                    <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                                </button>

                                {/* Zoom indicator */}
                                <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-black/90 backdrop-blur px-3 py-2 rounded-md text-xs text-stone-600 dark:text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    <ZoomIn className="w-4 h-4" />
                                    {isZoomed ? 'Click to reset' : 'Hover to zoom'}
                                </div>
                            </div>

                            {/* Thumbnail Gallery */}
                            {allImages.length > 1 && (
                                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                                    {allImages.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImageIndex(index)}
                                            className={`flex-shrink-0 w-20 h-24 rounded-md overflow-hidden border-2 transition-all duration-200 ${selectedImageIndex === index
                                                ? 'border-amber-600 dark:border-amber-500 ring-2 ring-amber-600/20'
                                                : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <img
                                                src={img}
                                                alt={`${product.name} view ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Right: Details */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="w-full lg:w-1/2 flex flex-col justify-center"
                        >
                            <span className="text-amber-700 dark:text-amber-500 font-bold tracking-[0.2em] uppercase mb-4 block text-sm">
                                Signature Collection
                            </span>
                            <h1 className="font-display text-5xl md:text-6xl text-stone-900 dark:text-white mb-6 leading-tight">
                                {product.name}
                            </h1>

                            {/* Price & Stock */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="text-3xl font-light text-stone-900 dark:text-white">
                                    ₹{Number(product.price).toLocaleString('en-IN')}
                                </div>
                                {stockStatus === 'in_stock' && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                        <Check className="w-3 h-3 mr-1" /> In Stock
                                    </Badge>
                                )}
                                {stockStatus === 'low_stock' && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                        Only {product.stock_quantity} left
                                    </Badge>
                                )}
                                {stockStatus === 'out_of_stock' && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                        Out of Stock
                                    </Badge>
                                )}
                            </div>

                            <div className="prose prose-stone dark:prose-invert text-lg text-stone-600 dark:text-neutral-400 font-light mb-8 leading-relaxed">
                                <p>{product.description}</p>
                            </div>

                            {/* Size Selector */}
                            {availableSizes.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-stone-900 dark:text-white mb-3 uppercase tracking-wider">
                                        Size {!selectedSize && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSizes.map((size: string) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2 border rounded-md text-sm font-medium transition-all duration-200 ${selectedSize === size
                                                    ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-black dark:border-white'
                                                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700 dark:hover:border-white'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Color Selector */}
                            {availableColors.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-stone-900 dark:text-white mb-3 uppercase tracking-wider">
                                        Color {!selectedColor && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableColors.map((color: string) => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`px-4 py-2 border rounded-md text-sm font-medium transition-all duration-200 ${selectedColor === color
                                                    ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-black dark:border-white'
                                                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700 dark:hover:border-white'
                                                    }`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity Selector */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-stone-900 dark:text-white mb-3 uppercase tracking-wider">
                                    Quantity
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center border border-stone-300 dark:border-neutral-700 rounded-md">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="p-3 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
                                            disabled={quantity <= 1}
                                        >
                                            <Minus className="w-4 h-4 text-stone-600 dark:text-neutral-400" />
                                        </button>
                                        <span className="px-6 py-2 text-lg font-medium text-stone-900 dark:text-white min-w-[60px] text-center">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="p-3 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
                                        >
                                            <Plus className="w-4 h-4 text-stone-600 dark:text-neutral-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Fit & Fabric Details */}
                            <div className="grid grid-cols-2 gap-8 mb-10 border-t border-stone-300 dark:border-neutral-800 pt-8">
                                <div>
                                    <h4 className="font-display text-lg text-stone-900 dark:text-white mb-2 flex items-center gap-2">
                                        <Ruler size={18} className="text-stone-600 dark:text-neutral-500" /> Fit & Details
                                    </h4>
                                    <ul className="text-sm text-stone-600 dark:text-neutral-400 space-y-1">
                                        <li>{product.fit || details.fit || "Standard fit"}</li>
                                        {product.pattern && <li>Pattern: {product.pattern}</li>}
                                        {product.occasion && <li>Occasion: {product.occasion}</li>}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-display text-lg text-stone-900 dark:text-white mb-2 flex items-center gap-2">
                                        <Droplets size={18} className="text-stone-600 dark:text-neutral-500" /> Fabric & Care
                                    </h4>
                                    <ul className="text-sm text-stone-600 dark:text-neutral-400 space-y-1">
                                        <li>{product.fabric || "Premium Fabric"}</li>
                                        {product.gsm && <li>Weight: {product.gsm} GSM</li>}
                                        {product.weave && <li>Weave: {product.weave}</li>}
                                        <li>{product.wash_care || details.care || "See label"}</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!canAddToCart || addToCart.isPending}
                                    className={`flex-1 h-14 text-sm uppercase tracking-widest shadow-lg transition-all duration-300 ${canAddToCart
                                        ? 'bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200'
                                        : 'bg-stone-400 dark:bg-neutral-700 text-white dark:text-neutral-400 cursor-not-allowed'
                                        }`}
                                >
                                    {addToCart.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ShoppingBag className="mr-2 h-4 w-4" />
                                    )}
                                    {stockStatus === 'out_of_stock'
                                        ? 'Out of Stock'
                                        : !canAddToCart
                                            ? 'Select Options'
                                            : 'Add to Bag'
                                    }
                                </Button>

                                {/* Wishlist Button (Desktop) */}
                                <Button
                                    variant="outline"
                                    onClick={handleWishlistToggle}
                                    disabled={addToWishlist.isPending || removeFromWishlist.isPending}
                                    className={`h-14 px-6 transition-all duration-300 ${isInWishlist
                                        ? 'border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                        : 'border-stone-300 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:border-red-500 hover:text-red-500'
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </PageLayout>
    );
}
