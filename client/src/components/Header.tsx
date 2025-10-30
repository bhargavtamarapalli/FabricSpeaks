import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "wouter";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onAuthClick?: () => void;
}

export default function Header({ cartItemCount = 0, onCartClick, onAuthClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-20 px-6">
          <button
            data-testid="button-mobile-menu"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link href="/" className="flex-shrink-0">
            <h1 data-testid="text-logo" className="text-2xl font-light tracking-tight">
              ATELIER
            </h1>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/clothing" data-testid="link-clothing">
              <span className="text-sm uppercase tracking-widest hover-elevate active-elevate-2 px-4 py-2 rounded-md transition-all duration-200">
                Clothing
              </span>
            </Link>
            <Link href="/accessories" data-testid="link-accessories">
              <span className="text-sm uppercase tracking-widest hover-elevate active-elevate-2 px-4 py-2 rounded-md transition-all duration-200">
                Accessories
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

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-search"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="transition-all duration-200"
            >
              <Search className="h-5 w-5" />
            </Button>

            <ThemeToggle />

            <Button
              size="icon"
              variant="ghost"
              data-testid="button-account"
              onClick={onAuthClick}
              className="transition-all duration-200"
            >
              <User className="h-5 w-5" />
            </Button>

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
          <div className="px-6 pb-4">
            <Input
              type="search"
              placeholder="Search products..."
              data-testid="input-search"
              className="w-full"
            />
          </div>
        )}

        {isMenuOpen && (
          <nav className="lg:hidden border-t border-border px-6 py-4 space-y-4 animate-in slide-in-from-top duration-300">
            <Link href="/clothing" data-testid="link-mobile-clothing">
              <div className="text-sm uppercase tracking-widest py-2 transition-colors duration-200">Clothing</div>
            </Link>
            <Link href="/accessories" data-testid="link-mobile-accessories">
              <div className="text-sm uppercase tracking-widest py-2 transition-colors duration-200">Accessories</div>
            </Link>
            <Link href="/new-arrivals" data-testid="link-mobile-new-arrivals">
              <div className="text-sm uppercase tracking-widest py-2 transition-colors duration-200">New Arrivals</div>
            </Link>
            <Link href="/sale" data-testid="link-mobile-sale">
              <div className="text-sm uppercase tracking-widest py-2 transition-colors duration-200">Sale</div>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
