/**
 * Variant Selector Component
 * 
 * Provides an interactive UI for selecting product variants (size, colour).
 * Handles stock validation, availability feedback, and selection state.
 * 
 * Features:
 * - Visual size/colour selection
 * - Real-time stock status
 * - Disabled states for out-of-stock variants
 * - Accessible keyboard navigation
 * - Responsive design
 * 
 * @module components/VariantSelector
 */

import { useState, useEffect, useCallback } from "react";
import {
    useProductVariants,
    getUniqueSizes,
    getUniqueColours,
    findMatchingVariant,
    checkVariantAvailability,
    type ProductVariant
} from "@/hooks/useProductVariants";
import { AlertCircle, Check } from "lucide-react";

interface VariantSelectorProps {
    /** Product ID to fetch variants for */
    productId: string;

    /** Callback when variant selection changes */
    onVariantChange: (variant: ProductVariant | null) => void;

    /** Optional CSS class name */
    className?: string;

    /** Show stock status (default: true) */
    showStock?: boolean;
}

/**
 * VariantSelector Component
 * 
 * Allows users to select size and colour for a product.
 * Automatically finds and validates the matching variant.
 * 
 * @example
 * ```tsx
 * <VariantSelector
 *   productId={product.id}
 *   onVariantChange={(variant) => setSelectedVariant(variant)}
 * />
 * ```
 */
export function VariantSelector({
    productId,
    onVariantChange,
    className = "",
    showStock = true,
}: VariantSelectorProps) {
    const { data: variants, isLoading, error } = useProductVariants(productId);

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColour, setSelectedColour] = useState<string | null>(null);
    const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);

    // Extract unique sizes and colours
    const sizes = getUniqueSizes(variants);
    const colours = getUniqueColours(variants);

    /**
     * Find and update the matching variant when selection changes
     */
    const updateVariant = useCallback(() => {
        const matchingVariant = findMatchingVariant(variants, selectedSize, selectedColour);
        setCurrentVariant(matchingVariant);
        onVariantChange(matchingVariant);
    }, [variants, selectedSize, selectedColour, onVariantChange]);

    // Update variant when selection changes
    useEffect(() => {
        updateVariant();
    }, [updateVariant]);

    /**
     * Check if a specific size/colour combination is available
     */
    const isVariantAvailable = useCallback(
        (size: string | null, colour: string | null): boolean => {
            const variant = findMatchingVariant(variants, size, colour);
            if (!variant) return false;
            return variant.status === "active" && variant.stock_quantity > 0;
        },
        [variants]
    );

    /**
     * Handle size selection
     */
    const handleSizeSelect = (size: string) => {
        setSelectedSize(size);

        // If colour is selected, check if combination exists
        if (selectedColour && !isVariantAvailable(size, selectedColour)) {
            // Reset colour if combination doesn't exist
            setSelectedColour(null);
        }
    };

    /**
     * Handle colour selection
     */
    const handleColourSelect = (colour: string) => {
        setSelectedColour(colour);

        // If size is selected, check if combination exists
        if (selectedSize && !isVariantAvailable(selectedSize, colour)) {
            // Reset size if combination doesn't exist
            setSelectedSize(null);
        }
    };

    // Get availability status
    const availability = checkVariantAvailability(currentVariant);

    // Loading state
    if (isLoading) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
                <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">Failed to load product variants</p>
                </div>
            </div>
        );
    }

    // No variants available
    if (!variants || variants.length === 0) {
        return (
            <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
                <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">No variants available for this product</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Size Selector */}
            {sizes.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                        Size {selectedSize && <span className="text-gray-500">({selectedSize})</span>}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map(size => {
                            const isSelected = selectedSize === size;
                            const isAvailable = selectedColour
                                ? isVariantAvailable(size, selectedColour)
                                : true; // Show all sizes if no colour selected yet

                            return (
                                <button
                                    key={size}
                                    onClick={() => handleSizeSelect(size)}
                                    disabled={!isAvailable}
                                    className={`
                    relative px-4 py-2 min-w-[60px] border-2 rounded-lg
                    font-medium text-sm transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                    ${isSelected
                                            ? "bg-black text-white border-black"
                                            : isAvailable
                                                ? "bg-white text-gray-900 border-gray-300 hover:border-gray-900"
                                                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                        }
                  `}
                                    aria-label={`Select size ${size}`}
                                    aria-pressed={isSelected}
                                >
                                    {size}
                                    {isSelected && (
                                        <Check className="absolute top-1 right-1 w-3 h-3" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Colour Selector */}
            {colours.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                        Colour {selectedColour && <span className="text-gray-500">({selectedColour})</span>}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {colours.map(colour => {
                            const isSelected = selectedColour === colour;
                            const isAvailable = selectedSize
                                ? isVariantAvailable(selectedSize, colour)
                                : true; // Show all colours if no size selected yet

                            return (
                                <button
                                    key={colour}
                                    onClick={() => handleColourSelect(colour)}
                                    disabled={!isAvailable}
                                    className={`
                    relative px-4 py-2 min-w-[80px] border-2 rounded-lg
                    font-medium text-sm transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                    ${isSelected
                                            ? "bg-black text-white border-black"
                                            : isAvailable
                                                ? "bg-white text-gray-900 border-gray-300 hover:border-gray-900"
                                                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                        }
                  `}
                                    aria-label={`Select colour ${colour}`}
                                    aria-pressed={isSelected}
                                >
                                    {colour}
                                    {isSelected && (
                                        <Check className="absolute top-1 right-1 w-3 h-3" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stock Status */}
            {showStock && (selectedSize || selectedColour) && (
                <div className="pt-2">
                    {availability.available ? (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-sm text-gray-700">
                                {availability.message}
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <p className="text-sm text-red-600 font-medium">
                                {availability.message}
                            </p>
                        </div>
                    )}

                    {/* SKU Display (if available) */}
                    {currentVariant?.sku && (
                        <p className="text-xs text-gray-500 mt-1">
                            SKU: {currentVariant.sku}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
