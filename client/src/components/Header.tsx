import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "wouter";

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
            <Link href="/women" data-testid="link-women">
              <span className="text-sm uppercase tracking-widest hover-elevate active-elevate-2 px-4 py-2 rounded-md">
                Women
              </span>
            </Link>
            <Link href="/men" data-testid="link-men">
              <span className="text-sm uppercase tracking-widest hover-elevate active-elevate-2 px-4 py-2 rounded-md">
                Men
              </span>
            </Link>
            <Link href="/new-arrivals" data-testid="link-new-arrivals">
              <span className="text-sm uppercase tracking-widest hover-elevate active-elevate-2 px-4 py-2 rounded-md">
                New Arrivals
              </span>
            </Link>
            <Link href="/sale" data-testid="link-sale">
              <span className="text-sm uppercase tracking-widest text-accent-foreground hover-elevate active-elevate-2 px-4 py-2 rounded-md">
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
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              data-testid="button-account"
              onClick={onAuthClick}
            >
              <User className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="relative"
              data-testid="button-cart"
              onClick={onCartClick}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span
                  data-testid="text-cart-count"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center"
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
          <nav className="lg:hidden border-t border-border px-6 py-4 space-y-4">
            <Link href="/women" data-testid="link-mobile-women">
              <div className="text-sm uppercase tracking-widest py-2">Women</div>
            </Link>
            <Link href="/men" data-testid="link-mobile-men">
              <div className="text-sm uppercase tracking-widest py-2">Men</div>
            </Link>
            <Link href="/new-arrivals" data-testid="link-mobile-new-arrivals">
              <div className="text-sm uppercase tracking-widest py-2">New Arrivals</div>
            </Link>
            <Link href="/sale" data-testid="link-mobile-sale">
              <div className="text-sm uppercase tracking-widest py-2">Sale</div>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
