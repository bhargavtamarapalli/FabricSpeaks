/**
 * MobileMenu Component
 * Responsive mobile navigation menu with hamburger toggle
 */

import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, Home, ShoppingBag, Search, User, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

interface MobileMenuProps {
  onCartOpen?: () => void;
  onAuthClick?: () => void;
}

export default function MobileMenu({ onCartOpen, onAuthClick }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const cartQuery = useCart();
  const cartItemsCount = cartQuery.data?.items?.length || 0;
  const { toast } = useToast();

  const menuItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Clothing", href: "/clothing", icon: ShoppingBag },
    { label: "Accessories", href: "/accessories", icon: ShoppingBag },
    { label: "Signature Collection", href: "/signature-collection", icon: ShoppingBag },
    { label: "Our Fabrics", href: "/fabrics", icon: ShoppingBag },
    { label: "New Arrivals", href: "/new-arrivals", icon: ShoppingBag },
    { label: "Sale", href: "/sale", icon: ShoppingBag },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const handleAuthClick = () => {
    if (onAuthClick) {
      onAuthClick();
    } else {
      document.dispatchEvent(new CustomEvent('open-auth'));
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-4 mt-8">
          {/* Main Navigation */}
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={handleLinkClick}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          ))}

          <div className="border-t my-4" />

          {/* User Actions */}
          {user ? (
            <>
              <Link href="/profile" onClick={handleLinkClick}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <User className="h-5 w-5" />
                  <span className="font-medium">My Account</span>
                </div>
              </Link>

              <Link href="/orders" onClick={handleLinkClick}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="font-medium">My Orders</span>
                </div>
              </Link>

              <Link href="/wishlist" onClick={handleLinkClick}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <Heart className="h-5 w-5" />
                  <span className="font-medium">Wishlist</span>
                </div>
              </Link>

              <button
                onClick={() => {
                  if (onCartOpen) {
                    onCartOpen();
                  } else {
                    document.dispatchEvent(new CustomEvent('open-cart'));
                  }
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left w-full"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="font-medium">Cart</span>
                {cartItemsCount > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              <div className="border-t my-4" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left w-full"
              >
                <X className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={handleAuthClick} className="w-full text-left">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Login</span>
                </div>
              </button>

              <button onClick={handleAuthClick} className="w-full text-left">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Sign Up</span>
                </div>
              </button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
