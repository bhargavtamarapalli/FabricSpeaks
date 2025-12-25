import { ShoppingBag, Search, User, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import ThemeToggle from "./ThemeToggle";
import FabricSpeaksLogoV4 from "./FabricSpeaksLogoV4";
import MobileMenu from "./MobileMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onAuthClick?: () => void;
}

export default function Header({ cartItemCount = 0, onCartClick, onAuthClick }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 matte-effect w-full">
      <div className="w-full">
        <div className="flex items-center justify-between h-20 md:h-24 px-6 md:px-12 transition-all duration-300">
          {/* Mobile Menu Trigger */}
          <div className="lg:hidden">
            <MobileMenu onCartOpen={onCartClick} onAuthClick={onAuthClick} />
          </div>

          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setLocation("/")}>
            <div className="relative w-12 h-12 md:w-14 md:h-14 transition-transform duration-500 group-hover:scale-110">
              <FabricSpeaksLogoV4 className="w-full h-full text-black dark:text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="font-display text-lg md:text-2xl tracking-tight text-black dark:text-white leading-none group-hover:text-amber-600 transition-colors duration-300">
                Fabric Speaks
              </h1>
              <span className="hidden md:block text-[10px] tracking-[0.3em] uppercase text-neutral-500 dark:text-neutral-400 group-hover:tracking-[0.4em] transition-all duration-500">
                Est. 2024
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/clothing" data-testid="link-clothing">
              <span className="text-xs md:text-sm uppercase tracking-widest hover-elevate active-elevate-2 px-4 py-2 rounded-md transition-all duration-200">
                Clothing
              </span>
            </Link>
            <Link href="/accessories" data-testid="link-accessories">
              <span className="text-xs md:text-sm uppercase tracking-widest hover-elevate active-elevate-2 px-4 py-2 rounded-md transition-all duration-200">
                Accessories
              </span>
            </Link>
            <Link href="/signature-collection" data-testid="link-signature">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest hover-elevate active-elevate-2 px-4 py-1 rounded-md transition-all duration-200 text-amber-700 flex flex-col items-center leading-tight text-center">
                <span>Signature</span>
                <span>Collection</span>
              </span>
            </Link>
            <Link href="/fabrics" data-testid="link-fabrics">
              <span className="text-sm uppercase tracking-widest hover-elevate active-elevate-2 px-4 py-2 rounded-md transition-all duration-200">
                Our Fabrics
              </span>
            </Link>
            <Link href="/new-arrivals" data-testid="link-new-arrivals">
              <span className="text-sm uppercase tracking-widest hover-elevate active-elevate-2 px-4 py-2 rounded-md transition-all duration-200">
                New Arrivals
              </span>
            </Link>
            <Link href="/sale" data-testid="link-sale">
              <span className="text-sm uppercase tracking-widest text-accent-foreground hover-elevate active-elevate-2 px-4 py-2 rounded-md transition-all duration-200">
                Sale
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-search"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="transition-all duration-200"
            >
              <Search className="h-5 w-5" />
            </Button>

            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            <Link href="/wishlist">
              <Button
                size="icon"
                variant="ghost"
                data-testid="button-wishlist"
                className="hidden md:flex transition-all duration-200"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    data-testid="button-account-menu"
                    className="hidden md:flex transition-all duration-200"
                    title={isAdmin ? "Admin Account" : "My Account"}
                  >
                    <User className="h-5 w-5" />
                    {isAdmin && (
                      <span className="absolute -top-1 -left-1 px-1 py-0.5 text-[10px] rounded bg-yellow-100 text-yellow-800 border border-yellow-300">Admin</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/orders")} className="cursor-pointer">
                    <ShoppingBag className="mr-2 h-4 w-4" /> My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/wishlist")} className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" /> Wishlist
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout();
                      toast({
                        title: "Logged out",
                        description: "You have been successfully logged out.",
                      });
                      setLocation("/");
                    }}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                data-testid="button-account-login"
                onClick={onAuthClick}
                className="hidden md:flex transition-all duration-200"
                title="Sign In"
              >
                <User className="h-5 w-5" />
              </Button>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="relative transition-all duration-200"
              data-testid="button-cart"
              onClick={onCartClick}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span
                  data-testid="text-cart-count"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center animate-in fade-in zoom-in duration-200"
                >
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="px-6 pb-4 animate-in slide-in-from-top-2 duration-200">
            <Input
              type="search"
              placeholder="Search products..."
              data-testid="input-search"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setLocation(`/clothing?search=${e.currentTarget.value}`);
                  setIsSearchOpen(false);
                }
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
