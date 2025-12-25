import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Loading from "@/components/Loading";
import { useLocation, useSearch } from "wouter";
import PageLayout from "@/components/PageLayout";
import ProductGrid from "@/components/ProductGrid";
import { useProducts, UseProductsParams } from "@/hooks/useProducts";
import FilterSidebar from "@/components/FilterSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

export default function NewArrivals() {
  const [, setLocation] = useLocation();
  const [showFilters, setShowFilters] = useState(false);

  // Initialize filters from URL search params
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);

  const [filters, setFilters] = useState<UseProductsParams>({
    limit: 24,
    categoryId: "new", // Always restrict to 'new'
    sortBy: "newest",
    // Merge URL params
    search: params.get("search") || undefined,
    fabric: params.get("fabric") || undefined,
    size: params.get("size") || undefined,
    colour: params.get("colour") || undefined,
    minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : undefined,
    maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
  });

  // Sync state with URL when params change (e.g. back button)
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams);
    setFilters(prev => ({
      ...prev,
      search: currentParams.get("search") || undefined,
      fabric: currentParams.get("fabric") || undefined,
      size: currentParams.get("size") || undefined,
      colour: currentParams.get("colour") || undefined,
    }));
  }, [searchParams]);

  const productsQuery = useProducts(filters);

  const handleFilterChange = (newFilters: UseProductsParams) => {
    // Ensure we keep the categoryId fixed for this page
    const filtersToApply = { ...newFilters, categoryId: "new" };
    setFilters(prev => ({ ...prev, ...filtersToApply, offset: 0 }));

    // Optional: Update URL to reflect filters (simplified for now)
    // In a full implementation, we'd pushState here, but local state is fine for simple navigation
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
              Just In
            </span>
            <h1 className="font-display text-5xl md:text-7xl mb-6 dark:text-white">
              New Arrivals
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-light text-lg max-w-2xl mx-auto">
              Explore the latest additions to our collection, featuring fresh styles and seasonal essentials.
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
                <div className="text-red-600">Failed to load new arrivals</div>
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
