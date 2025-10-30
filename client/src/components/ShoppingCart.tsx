import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  size: string;
  imageUrl: string;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 200 ? 0 : 15;
  const total = subtotal + shipping;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        data-testid="overlay-cart"
      />

      <div
        data-testid="drawer-cart"
        className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-background z-50 shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 data-testid="text-cart-title" className="text-xl font-medium">
            Shopping Bag ({items.length})
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

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p data-testid="text-empty-cart" className="text-muted-foreground">
                Your shopping bag is empty
              </p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`cart-item-${item.id}`}
                    className="flex gap-4"
                  >
                    <div className="w-24 h-32 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-widest text-muted-foreground">
                            {item.brand}
                          </div>
                          <h3 className="font-medium">{item.name}</h3>
                          <div className="text-sm text-muted-foreground mt-1">
                            Size: {item.size}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onRemoveItem(item.id)}
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
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
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
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div
                          data-testid={`text-item-price-${item.id}`}
                          className="font-medium"
                        >
                          ${item.price * item.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-border space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span data-testid="text-subtotal">${subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span data-testid="text-shipping">
                    {shipping === 0 ? "FREE" : `$${shipping}`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span data-testid="text-total">${total}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={onCheckout}
                data-testid="button-checkout"
              >
                Checkout
              </Button>

              {subtotal < 200 && (
                <p className="text-xs text-center text-muted-foreground">
                  Add ${200 - subtotal} more for free shipping
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
