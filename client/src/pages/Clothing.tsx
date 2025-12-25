import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useSearch } from "wouter";
import PageLayout from "@/components/PageLayout";
import ProductGrid from "@/components/ProductGrid";
import FilterSidebar from "@/components/FilterSidebar";
import { useProducts, UseProductsParams } from "@/hooks/useProducts";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

export default function Clothing() {
  const [location] = useLocation();
  const searchString = useSearch(); // Reactive query string

  // Read search query from reactive searchString
  const searchParams = new URLSearchParams(searchString);
  const initialSearch = searchParams.get('search') || '';
  const initialFabric = searchParams.get('fabric') || undefined;
  const initialSize = searchParams.get('size') || undefined;
  const initialColour = searchParams.get('colour') || undefined;
  const initialCategory = searchParams.get('category') || undefined;

  const [filters, setFilters] = useState<UseProductsParams>({
    limit: 24,
    categorySlug: initialCategory || "clothing",
    sortBy: "newest",
    search: initialSearch || undefined,
    fabric: initialFabric,
    size: initialSize,
    colour: initialColour
  });

  // Update filters when search string changes
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const searchQuery = params.get('search');

    // Only update if search query changed and it's different from current filter
    // We also handle the case where search is cleared (searchQuery is null/empty)
    if (searchQuery !== filters.search) {
      // If searchQuery is falsy (empty/null) and filters.search is undefined, don't update
      if (!searchQuery && !filters.search) return;

      setFilters(prev => ({
        ...prev,
        search: searchQuery || undefined,
        offset: 0
      }));
    }
  }, [searchString, filters.search]);

  const [showFilters, setShowFilters] = useState(false);

  const productsQuery = useProducts(filters);

  const handleFilterChange = (newFilters: UseProductsParams) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 })); // Reset offset on filter change
  };

  return (
    <PageLayout>
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
    </PageLayout>
  );
}
