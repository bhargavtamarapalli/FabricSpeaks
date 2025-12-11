import { useState } from "react";
import { motion } from "framer-motion";
import Loading from "@/components/Loading";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import ProductGrid from "@/components/ProductGrid";
import { useProducts, UseProductsParams } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import FilterSidebar from "@/components/FilterSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import coat from '@assets/generated_images/Luxury_men\'s_black_cashmere_coat_cc266279.png';
import boots from '@assets/generated_images/Men\'s_black_Chelsea_boots_f0beca21.png';
import { useCart } from "@/hooks/useCart";

export default function Sale() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [, setLocation] = useLocation();
  const cartQuery = useCart();
  const cartItems = cartQuery.data?.items || [];
  const { login, register } = useAuth();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<UseProductsParams>({
    limit: 24,
    categoryId: "sale",
    sortBy: "newest"
  });

  const productsQuery = useProducts(filters);

  const handleFilterChange = (newFilters: UseProductsParams) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
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
            <span className="text-red-600 dark:text-red-500 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
              Limited Time
            </span>
            <h1 className="font-display text-5xl md:text-7xl mb-6 dark:text-white">
              The Sale
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-light text-lg max-w-2xl mx-auto">
              Discover exceptional pieces at reduced prices. A curated selection of last season's favorites.
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
            {showFilters && (
              <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-24">
                  <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
                </div>
              </aside>
            )}

            <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
              {productsQuery.isLoading ? (
                <section className="py-4 flex justify-center">
                  <Loading size="lg" />
                </section>
              ) : productsQuery.error ? (
                <div className="text-red-600">Failed to load sale items</div>
              ) : (
                productsQuery.data?.items && productsQuery.data.items.length > 0 ? (
                  <ProductGrid
                    products={productsQuery.data.items}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 bg-muted/30 rounded-lg border border-dashed">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-light">Sale is coming soon</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        We're preparing something special for you. Be the first to know when our exclusive sale begins.
                      </p>
                    </div>
                    <div className="flex gap-2 w-full max-w-sm">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <Button>Notify Me</Button>
                    </div>
                  </div>
                )
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
