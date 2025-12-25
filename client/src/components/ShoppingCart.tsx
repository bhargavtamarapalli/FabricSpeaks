/**
 * Shopping Cart Component
 * 
 * Slide-out cart drawer with:
 * - Cart items display with product details
 * - Quantity controls with stock validation
 * - Price totals using cart config
 * - Recommendations section
 * - Guest/authenticated checkout flow
 * 
 * @module components/ShoppingCart
 */

import { X, Minus, Plus, Trash2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart, useUpdateCartItem, useRemoveCartItem, useAddToCart, useCartTotals } from "@/hooks/useCart";
import { useLocation } from "wouter";
import { useCartValidation } from "@/hooks/useCartValidation";
import { CartValidationBanner, CartItemStockStatus } from "@/components/CartValidation";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { CartConfig } from "../../../shared/config/cart.config";

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  items?: any[]; // Optional for backward compatibility
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onCheckout?: () => void;
}

/**
 * Format price with currency symbol
 * Handles both number and string inputs safely
 */
function formatPrice(amount: number | string | undefined | null): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (isNaN(numAmount)) return `${CartConfig.CURRENCY_SYMBOL}0.00`;
  return `${CartConfig.CURRENCY_SYMBOL}${numAmount.toFixed(CartConfig.CURRENCY_DECIMALS)}`;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Use hooks unconditionally (React rules)
  const cartQuery = useCart();
  const updateItemMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveCartItem();
  const addToCart = useAddToCart();
  const totals = useCartTotals();

  // Override with props if provided (backward compatibility)
  const cartItems = items || cartQuery.data?.items || [];
  const handleUpdateQuantity = onUpdateQuantity
    ? (id: string, quantity: number) => onUpdateQuantity(id, quantity)
    : (id: string, quantity: number) => updateItemMutation.mutate({ id, quantity });
  const handleRemoveItem = onRemoveItem || ((id: string) => removeItemMutation.mutate(id));

  // Use cart validation hook to get validation status
  const validationQuery = useCartValidation(cartQuery.data);

  const isGuest = !user;

  // Recommendations Logic
  const lastItem = cartItems[cartItems.length - 1];
  const { data: recommendations } = useQuery({
    queryKey: ['cart-recommendations', lastItem?.product_id],
    queryFn: async () => {
      if (!lastItem?.product_id) return [];
      const res = await fetch(`/api/products/${lastItem.product_id}/recommendations`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!lastItem?.product_id
  });

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
        data-testid="overlay-cart"
      />

      <div
        data-testid="drawer-cart"
        className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-background z-50 shadow-xl flex flex-col animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 data-testid="text-cart-title" className="text-xl font-medium">
            Shopping Bag ({cartItems.length})
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-cart"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Validation Banner */}
        {validationQuery.data && (
          <CartValidationBanner
            errors={validationQuery.data.errors || []}
            warnings={validationQuery.data.warnings || []}
          />
        )}

        {cartItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p data-testid="text-empty-cart" className="text-muted-foreground">
                Your shopping bag is empty
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            {/* Cart Items */}
            <div className="p-6 space-y-4">
              {cartItems.map((item) => {
                const unitPrice = typeof item.unit_price === 'string'
                  ? parseFloat(item.unit_price)
                  : item.unit_price;

                return (
                  <div
                    key={item.id}
                    data-testid={`cart-item-${item.id}`}
                    className="flex gap-4"
                  >
                    <div
                      className="w-24 h-32 bg-muted rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        onClose();
                        const params = new URLSearchParams();
                        if (item.colour) params.set('color', item.colour);
                        if (item.size) params.set('size', item.size);
                        const queryString = params.toString();
                        setLocation(`/product/${item.product_id}${queryString ? '?' + queryString : ''}`);
                      }}
                    >
                      <img
                        src={item.product_images?.[0] || '/placeholder-image.jpg'}
                        alt={item.product_name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between">
                        <div>
                          <h3
                            className="font-medium text-sm leading-tight cursor-pointer hover:text-primary transition-colors"
                            onClick={() => {
                              onClose();
                              const params = new URLSearchParams();
                              if (item.colour) params.set('color', item.colour);
                              if (item.size) params.set('size', item.size);
                              const queryString = params.toString();
                              setLocation(`/product/${item.product_id}${queryString ? '?' + queryString : ''}`);
                            }}
                          >
                            {item.product_name || 'Product'}
                          </h3>
                          <div className="text-sm text-muted-foreground mt-1">
                            {(item.size || item.colour) ? (
                              <>
                                {item.size && <span className="inline-block px-2 py-0.5 bg-muted rounded text-xs mr-1">Size: {item.size}</span>}
                                {item.colour && <span className="inline-block px-2 py-0.5 bg-muted rounded text-xs">Color: {item.colour}</span>}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground/70">No variant selected</span>
                            )}
                          </div>
                          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                            {formatPrice(unitPrice)} each
                          </div>
                          {/* Stock Status Badge */}
                          <div className="mt-2">
                            <CartItemStockStatus
                              itemId={item.id}
                              productId={item.product_id}
                              quantity={item.quantity}
                              availableQuantity={item.stock_quantity ?? 999}
                              unitPrice={unitPrice}
                            />
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removeItemMutation.isPending}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateItemMutation.isPending}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span
                            data-testid={`text-quantity-${item.id}`}
                            className="w-8 text-center"
                          >
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updateItemMutation.isPending}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div
                          data-testid={`text-item-price-${item.id}`}
                          className="font-bold text-lg text-emerald-600 dark:text-emerald-400"
                        >
                          {formatPrice(unitPrice * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Summary */}
            <div className="p-6 border-t border-border space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span data-testid="text-subtotal" className="font-medium">{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span data-testid="text-shipping" className={totals.shipping === 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
                    {totals.shipping === 0 ? "FREE" : formatPrice(totals.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{CartConfig.TAX_NAME}</span>
                  <span data-testid="text-tax">{formatPrice(totals.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span data-testid="text-total" className="text-emerald-600 dark:text-emerald-400">{formatPrice(totals.total)}</span>
                </div>
              </div>

              {isGuest ? (
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      onClose();
                      setLocation('/checkout');
                    }}
                    data-testid="button-guest-checkout"
                  >
                    Continue as Guest
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      onClose();
                      document.dispatchEvent(new Event('open-auth'));
                    }}
                    data-testid="button-sign-in"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In for Faster Checkout
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Sign in to track orders, save addresses, and get personalized recommendations
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={onCheckout || (() => setLocation('/checkout'))}
                  data-testid="button-checkout"
                >
                  Proceed to Checkout
                </Button>
              )}

              {totals.amountToFreeShipping > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Add {formatPrice(totals.amountToFreeShipping)} more for free shipping
                </p>
              )}
            </div>

            {/* Recommendations Section */}
            {recommendations && recommendations.length > 0 && (
              <div className="p-6 border-t border-border bg-muted/20">
                <h3 className="text-sm font-medium mb-4">Complete the Look</h3>
                <div className="space-y-4">
                  {recommendations.slice(0, 2).map((rec: any) => (
                    <div key={rec.id} className="flex gap-3 items-center bg-background p-2 rounded-md border border-border">
                      <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                        <img
                          src={rec.images?.[0] || rec.signature_details?.image}
                          alt={rec.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rec.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(rec.price)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs"
                        onClick={() => {
                          addToCart.mutate({
                            product_id: rec.id,
                            quantity: 1
                          });
                        }}
                        disabled={addToCart.isPending}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </>
  );
}
