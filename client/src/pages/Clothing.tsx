import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import ProductGrid from "@/components/ProductGrid";
import FilterSidebar from "@/components/FilterSidebar";
import { useProducts, UseProductsParams } from "@/hooks/useProducts";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export default function Clothing() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [, setLocation] = useLocation();
  const cartQuery = useCart();
  const cartItems = cartQuery.data?.items || [];
  const { login, register } = useAuth();

  const [filters, setFilters] = useState<UseProductsParams>({
    limit: 24,
    categorySlug: "clothing",
    sortBy: "newest"
  });

  const [showFilters, setShowFilters] = useState(false);

  const productsQuery = useProducts(filters);

  const handleFilterChange = (newFilters: UseProductsParams) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 })); // Reset offset on filter change
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-amber-600 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
              Ready-to-Wear
            </span>
            <h1 className="font-display text-5xl md:text-7xl mb-6 dark:text-white">
              Men's Clothing
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-light text-lg max-w-2xl mx-auto">
              Discover our curated collection of premium menswear, crafted for the modern gentleman.
            </p>
          </motion.div>

          <div className="flex justify-end mb-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:flex border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" /> {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>

              {/* Mobile Filter Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden border-neutral-200 dark:border-neutral-800">
                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <div className="py-6">
                    <h2 className="font-display text-2xl mb-6">Filters</h2>
                    <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Desktop Sidebar */}
            {showFilters && (
              <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-24">
                  <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
                </div>
              </aside>
            )}

            {/* Product Grid */}
            <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
              {productsQuery.isLoading ? (
                <section className="py-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="animate-pulse h-80 bg-muted rounded-md" />
                    ))}
                  </div>
                </section>
              ) : productsQuery.error ? (
                <div className="text-red-600">Failed to load clothing</div>
              ) : (
                <ProductGrid
                  products={productsQuery.data?.items || []}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => setLocation('/checkout')}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={async (email, password) => {
          try {
            await login(email, password);
            setIsAuthOpen(false);
          } catch (e) {
            console.error("Login failed:", e);
            alert("Login failed. Please check your credentials.");
          }
        }}
        onRegister={async (email, password, name) => {
          try {
            await register(email, password);
            setIsAuthOpen(false);
          } catch (e) {
            console.error("Registration failed:", e);
            alert("Registration failed. Please try again.");
          }
        }}
      />
    </div >
  );
}
