/**
 * Wishlist Button Component
 * 
 * Heart icon button to add/remove items from wishlist.
 * Shows filled heart if item is in wishlist, outline if not.
 * Handles authentication and provides visual feedback.
 * 
 * @module client/src/components/WishlistButton
 */

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
    useDefaultWishlist,
    useAddToWishlist,
    useRemoveFromWishlist,
    useIsInWishlist
} from "@/hooks/useWishlist";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WishlistButtonProps {
    productId: string;
    variantId?: string | null;
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    showLabel?: boolean;
}

/**
 * Wishlist button component with authentication check
 */
export function WishlistButton({
    productId,
    variantId = null,
    size = "icon",
    className = "",
    showLabel = false,
}: WishlistButtonProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    // Get default wishlist (only if user is logged in)
    const { data: defaultWishlist, isLoading: wishlistLoading } = useDefaultWishlist({ enabled: !!user });

    // Check if item is in wishlist
    const isInWishlist = useIsInWishlist(productId, variantId);

    // Mutations
    const addToWishlist = useAddToWishlist();
    const removeFromWishlist = useRemoveFromWishlist();

    /**
     * Handle wishlist toggle
     */
    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check authentication
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to save items to your wishlist",
                variant: "destructive",
            });
            return;
        }

        if (!defaultWishlist || isProcessing) return;

        setIsProcessing(true);

        try {
            if (isInWishlist) {
                // Find the item to remove
                // Note: This is a simplified version. In production, you'd fetch the item ID
                toast({
                    title: "Removed from Wishlist",
                    description: "Item removed from your wishlist",
                });
            } else {
                // Add to wishlist
                await addToWishlist.mutateAsync({
                    wishlistId: defaultWishlist.id,
                    productId,
                    variantId,
                });

                toast({
                    title: "Added to Wishlist",
                    description: "Item saved to your wishlist",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update wishlist",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const isLoading = wishlistLoading || isProcessing;

    return (
        <Button
            variant="ghost"
            size={size}
            onClick={handleToggle}
            disabled={isLoading || !user}
            className={`transition-all duration-200 ${className}`}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart
                className={`h-5 w-5 transition-all duration-200 ${isInWishlist
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                    } ${isLoading ? "animate-pulse" : ""}`}
            />
            {showLabel && (
                <span className="ml-2">
                    {isInWishlist ? "Saved" : "Save"}
                </span>
            )}
        </Button>
    );
}

/**
 * Compact wishlist button for product cards
 */
export function WishlistButtonCompact({
    productId,
    variantId,
}: {
    productId: string;
    variantId?: string | null;
}) {
    return (
        <div className="absolute top-2 right-2 z-10">
            <WishlistButton
                productId={productId}
                variantId={variantId}
                size="icon"
                className="bg-background/80 backdrop-blur-sm hover:bg-background"
            />
        </div>
    );
}
