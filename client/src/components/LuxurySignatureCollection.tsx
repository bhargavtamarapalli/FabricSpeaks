import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShoppingBag, X, ArrowUpRight, Ruler, Droplets, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Plus, Minus, Heart, Check, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import FabricSpeaksLogoV4 from './FabricSpeaksLogoV4';
import { useAddToCart, useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDefaultWishlist, useAddToWishlist, useRemoveFromWishlist, useWishlist } from "@/hooks/useWishlist";
import { Badge } from "@/components/ui/badge";

// --- SUB-COMPONENTS ---

const ReviewsSection = ({ productId }: { productId: string }) => {
    const { data: reviews, isLoading } = useQuery({
        queryKey: ['product-reviews', productId],
        queryFn: async () => {
            const res = await fetch(`/api/products/${productId}/reviews`);
            if (!res.ok) return [];
            return res.json();
        }
    });

    if (isLoading) return <div className="py-12 text-center">Loading reviews...</div>;

    if (!reviews || reviews.length === 0) return null;

    return (
        <div className="bg-white dark:bg-neutral-950 py-16 px-6 md:px-12 border-t border-stone-100 dark:border-neutral-800">
            <div className="max-w-4xl mx-auto">
                <h3 className="font-display text-3xl text-stone-900 dark:text-white mb-12 text-center">Client Reviews</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {reviews.map((review: any) => (
                        <div key={review.id} className="bg-stone-50 dark:bg-neutral-900 p-8 relative">
                            <span className="text-6xl text-amber-200 absolute top-4 left-4 font-serif leading-none">"</span>
                            <p className="text-stone-700 dark:text-stone-300 font-light italic mb-6 relative z-10">
                                {review.comment}
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-stone-300 dark:bg-neutral-700 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 font-serif font-bold">
                                    {review.user?.full_name?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-stone-900 dark:text-white">{review.user?.full_name || "Anonymous"}</p>
                                    {review.verified_purchase && (
                                        <p className="text-xs text-stone-500 uppercase tracking-wider">Verified Buyer</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ProductDetailView = ({ product: initialProduct, allProducts, onClose, onSelectProduct }: { product: any, allProducts: any[], onClose: () => void, onSelectProduct: (p: any) => void }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { toast } = useToast();
    const addToCart = useAddToCart();
    const { user } = useAuth();

    // Fetch full product details
    const { data: fullProduct } = useQuery({
        queryKey: ['product', initialProduct.id],
        queryFn: async () => {
            const res = await fetch(`/api/products/${initialProduct.slug || initialProduct.id}`);
            if (!res.ok) return initialProduct;
            return res.json();
        },
        initialData: initialProduct
    });

    const { data: variants } = useQuery({
        queryKey: ['product-variants', initialProduct.id],
        queryFn: async () => {
            const res = await fetch(`/api/products/${initialProduct.id}/variants`);
            if (!res.ok) return [];
            const data = await res.json();
            // Handle both array and { items: [...] } response formats
            return Array.isArray(data) ? data : (data?.items || []);
        }
    });

    const product = fullProduct || initialProduct;

    // Selection State
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Wishlist hooks - only enabled when user is logged in (from line 66)
    const { data: defaultWishlist } = useDefaultWishlist({ enabled: !!user });
    const { data: wishlistData } = useWishlist(defaultWishlist?.id);
    const addToWishlist = useAddToWishlist();
    const removeFromWishlist = useRemoveFromWishlist();

    const { data: recommendations } = useQuery({
        queryKey: ['product-recommendations', product.id],
        queryFn: async () => {
            const res = await fetch(`/api/products/${product.id}/recommendations`);
            if (!res.ok) return [];
            return res.json();
        }
    });

    // Check wishlist status
    const wishlistItem = useMemo(() => {
        if (!wishlistData?.items || !product) return null;
        return wishlistData.items.find(item => item.product_id === product.id);
    }, [wishlistData, product]);

    const isInWishlist = Boolean(wishlistItem);

    // Prepare media array (Video + Images)
    const media = useMemo(() => {
        const m = [];
        const seenUrls = new Set<string>();

        if (product.signature_details?.show_video && product.signature_details?.video) {
            m.push({ type: 'video', src: product.signature_details.video });
            seenUrls.add(product.signature_details.video);
        }

        // Add main images
        if (product.images && product.images.length > 0) {
            product.images.forEach((img: string) => {
                if (!seenUrls.has(img)) {
                    m.push({ type: 'image', src: img });
                    seenUrls.add(img);
                }
            });
        } else if (product.signature_details?.image) {
            const img = product.signature_details.image;
            if (!seenUrls.has(img)) {
                m.push({ type: 'image', src: img });
                seenUrls.add(img);
            }
        }

        // Add color images if not present
        if (product.color_images) {
            Object.entries(product.color_images).forEach(([colorName, imgs]: [string, any]) => {
                const imageArray = Array.isArray(imgs) ? imgs : [imgs];
                imageArray.forEach((img: string) => {
                    if (typeof img === 'string' && !seenUrls.has(img)) {
                        m.push({ type: 'image', src: img, color: colorName });
                        seenUrls.add(img);
                    }
                });
            });
        }

        // Add variant images
        if (variants && variants.length > 0) {
            variants.forEach((v: any) => {
                if (v.images && Array.isArray(v.images)) {
                    v.images.forEach((img: string) => {
                        if (!seenUrls.has(img)) {
                            m.push({ type: 'image', src: img });
                            seenUrls.add(img);
                        }
                    });
                }
            });
        }

        return m;
    }, [product, variants]);

    const handleNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % media.length);
    };

    const handlePrev = () => {
        setCurrentImageIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    // Auto-advance slideshow (pause if video is playing)
    useEffect(() => {
        let interval: any;
        const currentMedia = media[currentImageIndex];

        if (currentMedia?.type !== 'video' && media.length > 1) {
            interval = setInterval(handleNext, 5000);
        }

        return () => clearInterval(interval);
    }, [currentImageIndex, media]);

    // Reset index when product changes
    useEffect(() => {
        setCurrentImageIndex(0);
        setSelectedSize(null);
        setSelectedColor(null);
        setQuantity(1);
    }, [product.id]);

    // Switch image when color is selected
    useEffect(() => {
        if (!selectedColor) return;

        let found = false;

        // 1. Check color_images (handles arrays)
        if (product.color_images && product.color_images[selectedColor]) {
            const colorImgs = product.color_images[selectedColor];
            const imageUrl = Array.isArray(colorImgs) ? colorImgs[0] : colorImgs;
            if (imageUrl) {
                const index = media.findIndex(m => m.src === imageUrl);
                if (index !== -1) {
                    setCurrentImageIndex(index);
                    found = true;
                }
            }
        }

        // 2. Check variants if not found
        if (!found && variants) {
            const variant = variants.find((v: any) => v.colour === selectedColor && v.images?.length > 0);
            if (variant && variant.images[0]) {
                const index = media.findIndex(m => m.src === variant.images[0]);
                if (index !== -1) {
                    setCurrentImageIndex(index);
                }
            }
        }
    }, [selectedColor, media, product.color_images, variants]);

    const otherProducts = allProducts.filter(p => p.id !== product.id && !recommendations?.find((r: any) => r.id === p.id)).slice(0, 4);

    // --- Logic for Selectors & Cart ---

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

        // Filter out 'default'
        return colors.filter(c => c && c.toLowerCase() !== 'default');
    }, [product, variants]);

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
    };

    const handleWishlistToggle = () => {
        if (!user) {
            toast({
                title: "Sign in required",
                description: "Please sign in to save items to your wishlist.",
            });
            return;
        }
        if (!product || !defaultWishlist) return;

        // If removing from wishlist, no validation needed
        if (isInWishlist && wishlistItem) {
            removeFromWishlist.mutate({ wishlistId: defaultWishlist.id, itemId: wishlistItem.id });
            toast({ title: "Removed from Wishlist", description: "Item removed from wishlist." });
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
            description: `${product.name}${optionsText ? ` (${optionsText})` : ''} saved to wishlist.`
        });
    };

    // Clean Description (remove HTML tags)
    const cleanDescription = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/95 dark:bg-black/95 backdrop-blur-sm overflow-y-auto"
        >
            <button
                onClick={onClose}
                className="fixed top-6 right-6 z-50 p-2 bg-black text-white rounded-full hover:bg-stone-800 transition-colors"
            >
                <X size={24} />
            </button>

            <div className="min-h-screen">
                <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
                    {/* Left: Media Gallery */}
                    <div className="relative h-[50vh] lg:h-screen bg-stone-100 dark:bg-neutral-900 sticky top-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentImageIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="w-full h-full"
                            >
                                {media[currentImageIndex]?.type === 'video' ? (
                                    <div className="w-full h-full relative">
                                        <video
                                            ref={videoRef}
                                            src={media[currentImageIndex].src}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            loop
                                            muted={isMuted}
                                            playsInline
                                        />
                                        <div className="absolute bottom-6 right-6 flex gap-2">
                                            <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40">
                                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={media[currentImageIndex]?.src}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {media.length > 1 && (
                            <>
                                <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40">
                                    <ChevronLeft size={24} />
                                </button>
                                <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40">
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Right: Product Details */}
                    <div className="p-8 lg:p-24 flex flex-col justify-center bg-white dark:bg-neutral-950">
                        <div className="max-w-xl mx-auto w-full">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-bold tracking-widest uppercase rounded-full">
                                    {product.signature_details?.tag || 'Signature'}
                                </span>
                                {product.signature_details?.certificate && (
                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold tracking-widest uppercase rounded-full border border-amber-100">
                                        Authenticity Guaranteed
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-between items-start">
                                <h1 className="font-display text-5xl md:text-6xl text-stone-900 dark:text-white mb-4 leading-tight">{product.name}</h1>
                                <button
                                    onClick={handleWishlistToggle}
                                    disabled={addToWishlist.isPending || removeFromWishlist.isPending}
                                    className={`p-3 rounded-full transition-colors ${isInWishlist
                                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                                        : 'text-stone-400 hover:text-red-500 hover:bg-stone-50'
                                        }`}
                                >
                                    <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            {/* Price & Stock Badge */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-light text-stone-900 dark:text-white">₹{product.sale_price || product.price}</span>
                                    {product.sale_price && (
                                        <span className="text-lg text-stone-400 line-through">₹{product.price}</span>
                                    )}
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

                            {/* Description - CLEANED */}
                            <p className="text-stone-600 dark:text-stone-300 leading-relaxed mb-8 text-lg font-light">
                                {cleanDescription(product.description)}
                            </p>

                            {/* Selectors */}
                            {availableSizes.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-stone-900 dark:text-white mb-3 uppercase tracking-wider">
                                        Size {!selectedSize && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSizes.map((size: any) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2 border rounded-md text-sm font-medium transition-all ${selectedSize === size
                                                    ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-black dark:border-white'
                                                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {availableColors.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-stone-900 dark:text-white mb-3 uppercase tracking-wider">
                                        Color {!selectedColor && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableColors.map((color: any) => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`px-4 py-2 border rounded-md text-sm font-medium transition-all ${selectedColor === color
                                                    ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-black dark:border-white'
                                                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700'
                                                    }`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-stone-900 dark:text-white mb-3 uppercase tracking-wider">
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
                                            onClick={() => setQuantity(Math.min(quantity + 1, product.stock_quantity || 99))}
                                            className="p-3 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={quantity >= (product.stock_quantity || 99)}
                                        >
                                            <Plus className="w-4 h-4 text-stone-600 dark:text-neutral-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 border-y border-stone-100 dark:border-neutral-800 py-8">
                                {product.signature_details?.details?.fabric && (
                                    <div>
                                        <h4 className="font-bold text-stone-900 dark:text-white text-sm uppercase tracking-wider mb-2">Material</h4>
                                        <p className="text-stone-600 font-light">{product.signature_details.details.fabric}</p>
                                    </div>
                                )}
                                {product.signature_details?.details?.origin && (
                                    <div>
                                        <h4 className="font-bold text-stone-900 dark:text-white text-sm uppercase tracking-wider mb-2">Origin</h4>
                                        <p className="text-stone-600 font-light">{product.signature_details.details.origin}</p>
                                    </div>
                                )}
                                {product.signature_details?.details?.styling && (
                                    <div className="md:col-span-2">
                                        <h4 className="font-bold text-stone-900 dark:text-white text-sm uppercase tracking-wider mb-2">Styling Note</h4>
                                        <p className="text-stone-600 font-light italic">"{product.signature_details.details.styling}"</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={!canAddToCart || addToCart.isPending}
                                className={`w-full py-4 px-8 rounded-full transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 mb-16 shadow-lg ${canAddToCart
                                    ? 'bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200'
                                    : 'bg-stone-400 dark:bg-neutral-700 text-white dark:text-neutral-400 cursor-not-allowed'
                                    }`}
                            >
                                {addToCart.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <ShoppingBag size={20} />
                                )}
                                <span className="font-medium tracking-wide">
                                    {stockStatus === 'out_of_stock'
                                        ? 'Out of Stock'
                                        : !canAddToCart
                                            ? 'Select Options'
                                            : 'Add to Bag'
                                    }
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <ReviewsSection productId={product.id} />

                {/* Recommendations & Cross-Sell */}
                <div className="bg-stone-50 dark:bg-neutral-900 py-24 px-6 md:px-12">
                    <div className="max-w-7xl mx-auto">
                        {recommendations && recommendations.length > 0 && (
                            <div className="mb-24">
                                <h3 className="font-display text-3xl text-stone-900 dark:text-white mb-12 text-center">Complete the Look</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {recommendations.map((rec: any) => (
                                        <div
                                            key={rec.id}
                                            className="group cursor-pointer"
                                            onClick={() => onSelectProduct(rec)}
                                        >
                                            <div className="aspect-[3/4] bg-white overflow-hidden rounded-lg mb-4 shadow-sm">
                                                <img
                                                    src={rec.images?.[0] || rec.signature_details?.image}
                                                    alt={rec.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <h4 className="font-display text-xl text-stone-900 dark:text-white mb-1">{rec.name}</h4>
                                            <p className="text-stone-500 dark:text-stone-400">₹{rec.price}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="font-display text-3xl text-stone-900 dark:text-white mb-12 text-center">More from Signature Collection</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {otherProducts.map((p: any) => (
                                    <div
                                        key={p.id}
                                        className="group cursor-pointer"
                                        onClick={() => onSelectProduct(p)}
                                    >
                                        <div className="aspect-[3/4] bg-white overflow-hidden rounded-lg mb-4 shadow-sm">
                                            <img
                                                src={p.signature_details?.image || p.images?.[0]}
                                                alt={p.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <h4 className="font-display text-lg text-stone-900 dark:text-white mb-1">{p.name}</h4>
                                        <p className="text-stone-500 dark:text-stone-400">₹{p.price}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---

export default function LuxurySignatureCollection() {
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [stackHovered, setStackHovered] = useState(false);
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
    const [, setLocation] = useLocation();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Scroll Animation Setup - must be at top level before any returns
    const containerRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['signature-products'],
        queryFn: async () => {
            const res = await fetch('/api/products/signature');
            if (!res.ok) throw new Error('Failed to fetch signature products');
            return res.json();
        }
    });

    const products = data?.items || [];

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const activeIndex = useTransform(scrollYProgress, [0, 1], [0, Math.max(0, products.length - 1)]);
    const springIndex = useSpring(activeIndex, { stiffness: 200, damping: 30 });

    // Sync visual index for class switching if needed
    useEffect(() => {
        const unsubscribe = springIndex.on("change", (latest) => {
            setCurrentIndex(Math.round(latest));
        });
        return unsubscribe;
    }, [springIndex]);

    // 3D Parallax Tilt Handler
    const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        if (hoveredCardId !== id) return;

        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Max rotation 15deg
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        card.style.transform = `scale(1.2) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const resetCardTransform = (e: React.MouseEvent<HTMLDivElement>) => {
        // CSS transitions handle the smooth return to default state
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-[600px] w-full flex items-center justify-center bg-stone-100 dark:bg-neutral-900">
                <FabricSpeaksLogoV4 className="w-32 h-32 text-stone-900 dark:text-white" />
            </div>
        );
    }

    // Error state
    if (error) return null;

    // Empty state
    if (products.length === 0) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-100 dark:bg-neutral-900 overflow-hidden">
                <FabricSpeaksLogoV4 className="w-32 h-32 text-stone-900 dark:text-white mb-8 opacity-20" />
                <h2 className="font-display text-4xl text-stone-900 dark:text-white mb-4">The Collection</h2>
                <p className="text-stone-500 dark:text-neutral-400 font-light tracking-wide">
                    New signature pieces arriving soon.
                </p>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <span className="text-[15vw] font-display font-bold text-stone-200/50 dark:text-neutral-800/30 whitespace-nowrap select-none">
                        SIGNATURE
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full bg-stone-100 dark:bg-neutral-900 font-sans transition-colors duration-300 h-[400vh]">
            <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">

                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <span className="text-[15vw] font-display font-bold text-stone-200/50 dark:text-neutral-800/30 whitespace-nowrap select-none">
                        SIGNATURE
                    </span>
                </div>

                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16 z-10 cursor-pointer relative"
                    onClick={() => setLocation('/signature-collection')}
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="h-6 w-6 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-serif font-bold text-xs">S</div>
                        <span className="font-serif text-sm font-bold tracking-wide dark:text-neutral-200">SIGNATURE</span>
                    </div>
                    <h2 className="font-display text-5xl md:text-6xl text-stone-900 dark:text-white">The Collection</h2>
                    <div className="w-12 h-1 bg-amber-500 mx-auto mt-6" />
                </motion.div>

                {/* Central Wallet Stack */}
                <div
                    className="relative h-96 w-full max-w-5xl flex items-center justify-center perspective-1000 z-0"
                >
                    {products.map((product: any, index: number) => {
                        return (
                            <CardItem
                                key={product.id}
                                product={product}
                                index={index}
                                activeIndex={springIndex}
                                total={products.length}
                                onSelect={() => setSelectedProduct(product)}
                            />
                        );
                    })}
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 1 } }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-xs uppercase tracking-widest text-neutral-400">Scroll to Explore</span>
                    <div className="w-[1px] h-8 bg-neutral-300 dark:bg-neutral-700 relative overflow-hidden">
                        <motion.div
                            className="absolute top-0 w-full bg-black dark:bg-white"
                            style={{ height: "30%", top: "0%" }}
                            animate={{ top: ["0%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <ProductDetailView
                        key="product-detail-modal"
                        product={selectedProduct}
                        allProducts={products}
                        onClose={() => setSelectedProduct(null)}
                        onSelectProduct={setSelectedProduct}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Extracted Card Item for proper hook usage
const CardItem = ({ product, index, activeIndex, total, onSelect }: any) => {
    // We use useTransform to map the global scroll 'index' to this card's specific state
    // index - activeIndex represents how far this card is from the center (0)

    // Position Calculation based on distance from active index
    // offset < 0: card is to the left (passed)
    // offset > 0: card is to the right (coming up)

    // We want a "cover flow" / "wallet stack" effect

    // Transform values
    const offset = useTransform(activeIndex, (v: number) => index - v);

    const x = useTransform(offset, (o) => {
        // Center is 0. 
        // Right items stacked closely: 50px per item
        // Left items spread out significantly or fly off: -300px per item
        if (o >= 0) return o * 60;
        return o * 300; // Passed items fly left fast
    });

    const scale = useTransform(offset, (o) => {
        // Active item (0) is largest (1.1). Neighbors smaller.
        const dist = Math.abs(o);
        if (dist < 0.5) return 1.1; // Center
        return Math.max(0.8, 1 - dist * 0.1);
    });

    const rotateZ = useTransform(offset, (o) => {
        // Slight fanning rotation
        return o * 4;
    });

    const zIndex = useTransform(offset, (o) => {
        // Visual stacking order.
        // If o > 0 (right), we want them behind (lower z). 
        // If o < 0 (left), we want them on top? Or behind?
        // Usually cover flow: center is highest.
        return 100 - Math.abs(Math.round(o));
    });

    const opacity = useTransform(offset, (o) => {
        // Fade out far items
        if (o < -1.5) return 0; // Fade out executed items
        if (o > 4) return 0; // Hide far future items
        return 1;
    });

    // Visual filtering for "inactive" cards
    const blur = useTransform(offset, (o) => {
        if (Math.abs(o) < 0.5) return "blur(0px)";
        return "blur(2px)";
    });

    return (
        <motion.div
            onClick={onSelect}
            style={{
                x,
                scale,
                rotateZ,
                zIndex,
                opacity,
                filter: blur,
                position: 'absolute'
            }}
            className="w-72 h-[450px] rounded-xl cursor-pointer shadow-2xl origin-bottom"
        >
            {/* Gold Foil Wrapper */}
            <div
                className="w-full h-full rounded-xl overflow-hidden relative group bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] p-[4px] shadow-2xl"
            >
                <div className="w-full h-full bg-white rounded-lg overflow-hidden relative">
                    <img
                        src={product.signature_details?.image || product.images?.[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />

                    {/* Content Overlay */}
                    <div className="absolute inset-0 bg-black/10 transition-colors" />

                    <div className="absolute bottom-8 left-6 text-white drop-shadow-lg pointer-events-none">
                        <p className="text-[10px] font-bold tracking-widest mb-2 shadow-black text-[#fcf6ba]">
                            {product.signature_details?.tag}
                        </p>
                        <h3 className="font-display text-2xl shadow-black">{product.name}</h3>
                        <p className="text-white/80 text-sm mt-1">₹{product.price}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );

}
