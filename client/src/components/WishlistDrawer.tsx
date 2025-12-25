/**
 * Wishlist Drawer Component
 * 
 * Sidebar drawer to view and manage wishlist items.
 * Similar to shopping cart drawer but for saved items.
 * 
 * @module client/src/components/WishlistDrawer
 */

import { X, ShoppingCart, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDefaultWishlist, useWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface WishlistDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Wishlist drawer component
 */
export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const { data: defaultWishlist } = useDefaultWishlist({ enabled: !!user });
    const { data: wishlistData, isLoading } = useWishlist(defaultWishlist?.id);
    const removeFromWishlist = useRemoveFromWishlist();
    const addToCart = useAddToCart();

    const items = wishlistData?.items || [];

    /**
     * Handle remove item from wishlist
     */
    const handleRemove = async (itemId: string) => {
        if (!defaultWishlist) return;

        try {
            await removeFromWishlist.mutateAsync({
                wishlistId: defaultWishlist.id,
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
     * Handle move to cart
     */
    const handleMoveToCart = async (item: typeof items[0]) => {
        if (!item.product) return;

        try {
            // Calculate price
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

            // Remove from wishlist after adding to cart
            if (defaultWishlist) {
                await removeFromWishlist.mutateAsync({
                    wishlistId: defaultWishlist.id,
                    itemId: item.id,
                });
            }

            toast({
                title: "Added to Cart",
                description: "Item moved to your shopping cart",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add to cart",
                variant: "destructive",
            });
        }
    };

    /**
     * Calculate display price for an item
     */
    const getItemPrice = (item: typeof items[0]) => {
        if (!item.product) return "0.00";

        const basePrice = item.product.sale_price || item.product.price;
        const variantAdjustment = item.variant?.price_adjustment
            ? parseFloat(item.variant.price_adjustment)
            : 0;

        return (parseFloat(basePrice) + variantAdjustment).toFixed(2);
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-background z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-500" />
                            <h2 className="text-lg font-semibold">My Wishlist</h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-24 bg-muted rounded-md" />
                                    </div>
                                ))}
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Heart className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Save items you love for later
                                </p>
                                <Button onClick={onClose} asChild>
                                    <Link href="/clothing">Start Shopping</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        {/* Product Image */}
                                        <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                                            {item.product?.images?.[0] ? (
                                                <img
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    <Heart className="h-8 w-8" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate">{item.product?.name}</h4>

                                            {/* Variant Info */}
                                            {item.variant && (
                                                <p className="text-sm text-muted-foreground">
                                                    {item.variant.size && `Size: ${item.variant.size}`}
                                                    {item.variant.size && item.variant.colour && " • "}
                                                    {item.variant.colour && `Color: ${item.variant.colour}`}
                                                </p>
                                            )}

                                            {/* Price */}
                                            <p className="text-sm font-semibold mt-1">
                                                ${getItemPrice(item)}
                                            </p>

                                            {/* Stock Status */}
                                            {item.product && (
                                                <p
                                                    className={`text-xs mt-1 ${(item.variant?.stock_quantity || item.product.stock_quantity) > 0
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                        }`}
                                                >
                                                    {(item.variant?.stock_quantity || item.product.stock_quantity) > 0
                                                        ? "In Stock"
                                                        : "Out of Stock"}
                                                </p>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMoveToCart(item)}
                                                    disabled={
                                                        !item.product ||
                                                        (item.variant?.stock_quantity || item.product.stock_quantity) === 0
                                                    }
                                                    className="flex-1"
                                                >
                                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                                    Add to Cart
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRemove(item.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="border-t p-6">
                            <Button className="w-full" onClick={onClose} asChild>
                                <Link href="/wishlist">View Full Wishlist</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
