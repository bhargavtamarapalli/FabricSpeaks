import { useState } from "react";
import { Heart, ShoppingCart as ShoppingCartIcon, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
    useWishlists,
    useWishlist,
    useRemoveFromWishlist,
    useCreateWishlist,
} from "@/hooks/useWishlist";
import { useAddToCart, useCart } from "@/hooks/useCart";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

/**
 * Helper function to extract a valid image URL from various product image formats
 */
function getProductImage(product: any): string | null {
    if (!product) return null;

    // Check images array first (most common)
    if (product.images) {
        if (Array.isArray(product.images) && product.images.length > 0) {
            return product.images[0];
        }
        // Handle case where images might be a JSON string or object
        if (typeof product.images === 'string') {
            try {
                const parsed = JSON.parse(product.images);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed[0];
                }
            } catch (e) {
                // If parsing fails, maybe it's a direct URL
                if (product.images.startsWith('http')) {
                    return product.images;
                }
            }
        }
    }

    // Check main_image
    if (product.main_image) {
        return product.main_image;
    }

    // Check signature_details.image
    if (product.signature_details?.image) {
        return product.signature_details.image;
    }

    // Check color_images (take first available)
    if (product.color_images && typeof product.color_images === 'object') {
        const firstColor = Object.keys(product.color_images)[0];
        if (firstColor && product.color_images[firstColor]) {
            const colorImg = product.color_images[firstColor];
            if (Array.isArray(colorImg) && colorImg.length > 0) {
                return colorImg[0];
            } else if (typeof colorImg === 'string') {
                return colorImg;
            }
        }
    }

    return null;
}

export default function Wishlist() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedWishlistId, setSelectedWishlistId] = useState<string | undefined>();
    const [, setLocation] = useLocation();

    const cartQuery = useCart();
    const { data: wishlists, isLoading: wishlistsLoading } = useWishlists({ enabled: !!user });
    const { data: wishlistData, isLoading: itemsLoading } = useWishlist(
        selectedWishlistId || wishlists?.[0]?.id
    );
    const removeFromWishlist = useRemoveFromWishlist();
    const createWishlist = useCreateWishlist();
    const addToCart = useAddToCart();

    const items = wishlistData?.items || [];
    const currentWishlist = selectedWishlistId
        ? wishlists?.find((w) => w.id === selectedWishlistId)
        : wishlists?.[0];

    // Recommendations Logic
    const firstItem = items[0];
    const { data: recommendations } = useQuery({
        queryKey: ['wishlist-recommendations', firstItem?.product_id],
        queryFn: async () => {
            if (!firstItem?.product_id) return [];
            const res = await fetch(`/api/products/${firstItem.product_id}/recommendations`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!firstItem?.product_id
    });

    /**
     * Handle remove item
     */
    const handleRemove = async (itemId: string) => {
        if (!currentWishlist) return;

        try {
            await removeFromWishlist.mutateAsync({
                wishlistId: currentWishlist.id,
                itemId,
            });

            toast({
                title: "Removed",
                description: "Item removed from wishlist",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to remove item",
                variant: "destructive",
            });
        }
    };

    /**
     * Handle add to cart
     */
    const handleAddToCart = async (item: typeof items[0]) => {
        if (!item.product) return;

        try {
            const basePrice = item.product.sale_price || item.product.price;
            const variantAdjustment = item.variant?.price_adjustment
                ? parseFloat(item.variant.price_adjustment)
                : 0;
            const finalPrice = parseFloat(basePrice) + variantAdjustment;

            await addToCart.mutateAsync({
                product_id: item.product_id,
                quantity: 1,
                variant_id: item.variant_id || undefined,
                unit_price: parseFloat(finalPrice.toFixed(2)),
            });

            toast({
                title: "Added to Cart",
                description: "Item added to your shopping cart",
            });

            document.dispatchEvent(new Event('open-cart'));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add to cart",
                variant: "destructive",
            });
        }
    };

    /**
     * Calculate item price
     */
    const getItemPrice = (item: typeof items[0]) => {
        if (!item.product) return "0.00";

        const basePrice = item.product.sale_price || item.product.price;
        const variantAdjustment = item.variant?.price_adjustment
            ? parseFloat(item.variant.price_adjustment)
            : 0;

        return (parseFloat(basePrice) + variantAdjustment).toFixed(2);
    };

    // Require authentication
    if (!user) {
        return (
            <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <Heart className="h-16 w-16 text-stone-300 dark:text-neutral-700 mx-auto mb-6" />
                        <h1 className="text-3xl font-display mb-4 dark:text-white">Sign In to View Wishlist</h1>
                        <p className="text-stone-500 dark:text-neutral-400 mb-8 font-light text-lg">
                            Save your favorite items and access them from any device
                        </p>
                        <Button
                            onClick={() => document.dispatchEvent(new Event('open-auth'))}
                            className="bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200 px-8 py-6 text-lg font-light"
                        >
                            Sign In
                        </Button>
                    </div>
                </main>
            </PageLayout>
        );
    }

    return (
        <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
            <main className="flex-1 py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-12 text-center"
                    >
                        <span className="text-amber-600 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
                            Saved Items
                        </span>
                        <h1 className="font-display text-5xl md:text-7xl mb-4 dark:text-white">My Wishlist</h1>
                        <p className="text-stone-500 dark:text-neutral-400 font-light text-lg">
                            {items.length} {items.length === 1 ? "item" : "items"} saved
                        </p>
                    </motion.div>

                    {/* Loading State */}
                    {(wishlistsLoading || itemsLoading) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="aspect-[3/4] bg-stone-100 dark:bg-neutral-900 rounded-lg mb-4" />
                                    <div className="h-4 bg-stone-100 dark:bg-neutral-900 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-stone-100 dark:bg-neutral-900 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!wishlistsLoading && !itemsLoading && items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-stone-50 dark:bg-neutral-900/50 rounded-lg">
                            <Heart className="h-16 w-16 text-stone-300 dark:text-neutral-700 mb-6" />
                            <h2 className="font-display text-3xl mb-4 dark:text-white">Your wishlist is empty</h2>
                            <p className="text-stone-500 dark:text-neutral-400 mb-8 max-w-md font-light text-lg">
                                Explore our collection and save items you love for later
                            </p>
                            <Button asChild className="bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200 px-8 py-6 text-lg font-light">
                                <Link href="/clothing">Start Shopping</Link>
                            </Button>
                        </div>
                    )}

                    {/* Wishlist Items Grid */}
                    {!wishlistsLoading && !itemsLoading && items.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="group relative"
                                >
                                    {/* Product Image */}
                                    <Link href={`/product/${item.product_id}`}>
                                        <div className="aspect-[3/4] bg-stone-100 dark:bg-neutral-900 overflow-hidden rounded-lg mb-4 relative">
                                            {getProductImage(item.product) ? (
                                                <img
                                                    src={getProductImage(item.product)!}
                                                    alt={item.product?.name || 'Product'}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                    onError={(e) => {
                                                        // Hide broken image and show fallback
                                                        e.currentTarget.style.display = 'none';
                                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="w-full h-full flex items-center justify-center absolute inset-0"
                                                style={{ display: getProductImage(item.product) ? 'none' : 'flex' }}
                                            >
                                                <Heart className="h-12 w-12 text-stone-300 dark:text-neutral-700" />
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRemove(item.id);
                                                }}
                                                className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                                                aria-label="Remove from wishlist"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </Link>

                                    {/* Product Info */}
                                    <div className="space-y-2">
                                        <Link href={`/product/${item.product_id}`}>
                                            <h3 className="font-display text-lg dark:text-white hover:text-amber-600 dark:hover:text-amber-500 transition-colors line-clamp-1">
                                                {item.product?.name}
                                            </h3>
                                        </Link>

                                        {/* Variant Info */}
                                        {item.variant && (
                                            <p className="text-sm text-stone-500 dark:text-neutral-500">
                                                {item.variant.size && `Size: ${item.variant.size}`}
                                                {item.variant.size && item.variant.colour && " • "}
                                                {item.variant.colour && item.variant.colour}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-stone-900 dark:text-white">₹{getItemPrice(item)}</p>

                                            {/* Stock Status */}
                                            {item.product && (
                                                <p
                                                    className={`text-xs font-medium uppercase tracking-wider ${(item.variant?.stock_quantity || item.product.stock_quantity) > 0
                                                        ? "text-green-600 dark:text-green-500"
                                                        : "text-red-600 dark:text-red-500"
                                                        }`}
                                                >
                                                    {(item.variant?.stock_quantity || item.product.stock_quantity) > 0
                                                        ? "In Stock"
                                                        : "Out of Stock"}
                                                </p>
                                            )}
                                        </div>

                                        {/* Add to Cart Button */}
                                        <Button
                                            className="w-full mt-2 bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200 font-light"
                                            onClick={() => handleAddToCart(item)}
                                            disabled={
                                                !item.product ||
                                                (item.variant?.stock_quantity || item.product.stock_quantity) === 0
                                            }
                                        >
                                            <ShoppingCartIcon className="h-4 w-4 mr-2" />
                                            Add to Cart
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Recommendations Section */}
                    {recommendations && recommendations.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="mt-24 pt-16 border-t border-stone-200 dark:border-neutral-800"
                        >
                            <h2 className="font-display text-3xl md:text-4xl mb-12 text-center dark:text-white">Complete the Look</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {recommendations.map((rec: any) => (
                                    <Link key={rec.id} href={`/product/${rec.id}`}>
                                        <div className="group cursor-pointer">
                                            <div className="aspect-[3/4] bg-stone-100 dark:bg-neutral-900 overflow-hidden rounded-lg mb-4">
                                                <img
                                                    src={rec.images?.[0] || rec.signature_details?.image}
                                                    alt={rec.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                />
                                            </div>
                                            <h3 className="font-display text-lg mb-1 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{rec.name}</h3>
                                            <p className="text-stone-500 dark:text-neutral-400 font-light">₹{rec.price}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </PageLayout>
    );
}
