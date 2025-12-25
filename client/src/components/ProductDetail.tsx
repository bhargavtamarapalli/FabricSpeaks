/**
 * Product Detail Component
 * 
 * Displays comprehensive product information with variant selection.
 * Supports size/colour selection, stock validation, and dynamic pricing.
 * 
 * Features:
 * - Image gallery with thumbnails
 * - Variant selector (size, colour)
 * - Real-time stock status
 * - Dynamic price calculation with variant adjustments
 * - Responsive design
 * - Accessibility support
 * 
 * @module components/ProductDetail
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VariantSelector } from "@/components/VariantSelector";
import { WishlistButton } from "@/components/WishlistButton";
import { calculateVariantPrice, checkVariantAvailability, type ProductVariant } from "@/hooks/useProductVariants";
import { Product } from "../../../shared/schema";
import { ShoppingBag, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FREE_SHIPPING_THRESHOLD, CURRENCY_SYMBOL } from "@/lib/constants";

interface ProductDetailProps {
  product: Product;
  onAddToCart: (variantId: string, price: number, size?: string, colour?: string) => void;
}

/**
 * ProductDetail Component
 * 
 * Main product display page with variant selection and cart integration
 */
export default function ProductDetail({
  product,
  onAddToCart,
}: ProductDetailProps) {
  const { toast } = useToast();
  const [location] = useLocation();
  const { brand, name, price, sale_price, description, images, color_images, main_image } = product;

  // Read query parameters for initial variant selection (from cart navigation)
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialColorFromUrl = searchParams.get('color');
  const initialSizeFromUrl = searchParams.get('size');

  // State declarations - must be before any code that uses them
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Determine which images to display
  // Priority: Color Group Images -> Default Color Images -> Product Images -> Empty Array
  const selectedColor = selectedVariant?.colour;

  // Case-insensitive lookup for color_images
  // The color_images keys might be "Black", "black", "BLACK", etc.
  let colorGroupImages: string[] | null = null;

  // Get the default color by finding which color group contains the main/hero image
  // This ensures consistency with product listing cards which use main_image
  let defaultColor: string | null = null;
  if (color_images && typeof color_images === 'object') {
    const colorImagesObj = color_images as Record<string, string[]>;
    // Use main_image (hero image) to determine default color
    const heroImage = main_image || (images && Array.isArray(images) && images.length > 0 ? images[0] : null);

    if (heroImage) {
      // Find which color group contains the hero/main image
      for (const [colorKey, urls] of Object.entries(colorImagesObj)) {
        if (colorKey !== 'default' && Array.isArray(urls) && urls.includes(heroImage)) {
          defaultColor = colorKey;
          break;
        }
      }
    }

    // Fallback: if first image not found in any color group, use the first available color
    if (!defaultColor) {
      const colorKeys = Object.keys(colorImagesObj).filter(
        key => key !== 'default' && Array.isArray(colorImagesObj[key]) && colorImagesObj[key].length > 0
      );
      if (colorKeys.length > 0) {
        defaultColor = colorKeys[0];
      }
    }
  }

  // Use selected color if available, otherwise use default color
  const effectiveColor = selectedColor || defaultColor;

  if (effectiveColor && color_images && typeof color_images === 'object') {
    const colorImagesObj = color_images as Record<string, string[]>;

    // First try exact match
    if (colorImagesObj[effectiveColor] && colorImagesObj[effectiveColor].length > 0) {
      colorGroupImages = colorImagesObj[effectiveColor];
    } else {
      // Try case-insensitive match
      const lowerEffectiveColor = effectiveColor.toLowerCase();
      for (const [colorKey, urls] of Object.entries(colorImagesObj)) {
        if (colorKey.toLowerCase() === lowerEffectiveColor && Array.isArray(urls) && urls.length > 0) {
          colorGroupImages = urls;
          break;
        }
      }
    }

    // Fallback to 'default' key if color-specific images not found
    if (!colorGroupImages && colorImagesObj['default'] && Array.isArray(colorImagesObj['default']) && colorImagesObj['default'].length > 0) {
      colorGroupImages = colorImagesObj['default'];
    }
  }

  const hasColorImages = colorGroupImages && Array.isArray(colorGroupImages) && colorGroupImages.length > 0;

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProductDetail] Color:', effectiveColor, '(selected:', selectedColor, 'default:', defaultColor, ') Has color images:', hasColorImages, 'Count:', colorGroupImages?.length || 0);
  }

  const displayImages = hasColorImages
    ? colorGroupImages as string[]
    : (images && Array.isArray(images) && images.length > 0) ? images as string[] : [];

  // Reset selected image index when images change
  useEffect(() => {
    setSelectedImage(0);
  }, [hasColorImages, effectiveColor]);

  // Calculate base price (use sale price if available)
  const basePrice = sale_price ? Number(sale_price) : Number(price);

  // Calculate final price with variant adjustment
  const finalPrice = selectedVariant
    ? calculateVariantPrice(basePrice, selectedVariant.price_adjustment)
    : basePrice;

  // Check variant availability
  const availability = checkVariantAvailability(selectedVariant);

  /**
   * Handle add to cart action
   * Validates variant selection and stock before adding
   */
  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select a size and colour",
      });
      return;
    }

    if (!availability.available) {
      toast({
        variant: "destructive",
        title: "Unavailable",
        description: availability.message,
      });
      return;
    }

    onAddToCart(selectedVariant.id, finalPrice, selectedVariant.size || undefined, selectedVariant.colour || undefined);
  };

  /**
   * Handle variant selection change
   */
  const handleVariantChange = (variant: ProductVariant | null) => {
    setSelectedVariant(variant);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
            {displayImages.length > 0 ? (
              <img
                src={displayImages[selectedImage]}
                alt={`${brand} ${name}`}
                className="w-full h-full object-cover"
                data-testid="img-main-product"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {displayImages.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {displayImages.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-[3/4] bg-muted rounded-md overflow-hidden transition-all ${selectedImage === index ? "ring-2 ring-black" : "hover:opacity-75"
                    }`}
                  data-testid={`button-thumbnail-${index}`}
                >
                  <img
                    src={image}
                    alt={`View ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="lg:sticky lg:top-24 h-fit space-y-6">
          {/* Brand and Name */}
          <div>
            <div
              data-testid="text-brand"
              className="text-xs uppercase tracking-widest text-muted-foreground mb-2"
            >
              {brand}
            </div>
            <h1 data-testid="text-product-name" className="font-display text-4xl mb-4">
              {name}
            </h1>

            {/* Price Display */}
            <div className="flex items-center gap-3">
              <span data-testid="text-price" className="text-2xl font-medium">
                ₹{finalPrice.toFixed(2)}
              </span>

              {sale_price && !selectedVariant?.price_adjustment && (
                <>
                  <span
                    data-testid="text-original-price"
                    className="text-lg text-muted-foreground line-through"
                  >
                    ₹{Number(price).toFixed(2)}
                  </span>
                  <Badge className="bg-accent text-accent-foreground border-accent-border">
                    Save ₹{(Number(price) - Number(sale_price)).toFixed(2)}
                  </Badge>
                </>
              )}

              {selectedVariant?.price_adjustment && Number(selectedVariant.price_adjustment) !== 0 && (
                <Badge variant="outline" className="text-xs">
                  {Number(selectedVariant.price_adjustment) > 0 ? "+" : ""}
                  ₹{Number(selectedVariant.price_adjustment).toFixed(2)}
                </Badge>
              )}
            </div>
          </div>

          {/* Variant Selector */}
          <VariantSelector
            productId={product.id}
            onVariantChange={handleVariantChange}
            showStock={true}
            initialSize={initialSizeFromUrl}
            initialColour={initialColorFromUrl}
          />

          {/* Add to Cart Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={!availability.available}
            onClick={handleAddToCart}
            data-testid="button-add-to-cart"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            {availability.available ? "Add to Bag" : availability.message}
          </Button>

          <div className="flex justify-center mt-4">
            <WishlistButton
              productId={product.id}
              variantId={selectedVariant?.id}
              showLabel={true}
              className="w-full"
              size="default"
            />
          </div>

          {/* Shipping Info */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Truck className="w-4 h-4" />
            <p>Free shipping on orders over {CURRENCY_SYMBOL}{FREE_SHIPPING_THRESHOLD}</p>
          </div>

          {/* Product Details Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="description">
              <AccordionTrigger data-testid="button-description">
                Description
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description || "No description available"}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="details">
              <AccordionTrigger data-testid="button-details">
                Product Details
              </AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Made in {product.is_imported ? 'Imported' : 'India'}</li>
                  {product.fabric && <li>• Fabric: {product.fabric}</li>}
                  {product.gsm && <li>• Weight: {product.gsm} GSM</li>}
                  {product.weave && <li>• Weave: {product.weave}</li>}
                  {product.fit && <li>• Fit: {product.fit}</li>}
                  {product.pattern && <li>• Pattern: {product.pattern}</li>}
                  {product.occasion && <li>• Occasion: {product.occasion}</li>}
                  <li>• {product.wash_care || 'Dry clean only'}</li>
                  {selectedVariant?.sku && (
                    <li>• SKU: {selectedVariant.sku}</li>
                  )}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipping">
              <AccordionTrigger data-testid="button-shipping">
                Shipping & Returns
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.shipping_info || "Free standard shipping on orders over ₹2000. Express shipping available."}
                  <br />
                  {product.returns_policy || "Easy returns within 30 days."}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
