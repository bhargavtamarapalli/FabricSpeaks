import { Home, ShoppingBag, Heart, User, Search, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

interface BottomNavProps {
    onCartClick?: () => void;
}

export default function BottomNav({ onCartClick }: BottomNavProps) {
    const [location] = useLocation();
    const { data: cart } = useCart();
    const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    const navItems = [
        { label: "Home", href: "/", icon: Home },
        { label: "Shop", href: "/clothing", icon: ShoppingBag },
        { label: "Wishlist", href: "/wishlist", icon: Heart },
        { label: "Profile", href: "/profile", icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border md:hidden pb-safe">
            <nav className="grid grid-cols-5 h-16 px-2">
                {navItems.map((item) => {
                    const isActive = location === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <span
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-primary transition-colors"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 transition-transform duration-200",
                                        isActive && "scale-110"
                                    )}
                                    fill={isActive && item.label === "Wishlist" ? "currentColor" : "none"}
                                />
                                <span className="text-[10px] font-medium tracking-wide">
                                    {item.label}
                                </span>
                            </span>
                        </Link>
                    );
                })}

                {/* Cart Button with Badge */}
                <button
                    onClick={onCartClick}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary transition-colors relative"
                >
                    <div className="relative">
                        <ShoppingCart className="h-5 w-5" />
                        {cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold animate-in zoom-in">
                                {cartItemCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium tracking-wide">Cart</span>
                </button>
            </nav>
        </div>
    );
}
