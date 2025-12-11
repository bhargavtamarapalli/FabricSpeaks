
import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import ProductCard from "@/components/ProductCard";
import { useCart, useAddToCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import Loading from "@/components/Loading";
import { useToast } from "@/hooks/use-toast";
import LuxurySignatureCollection from "@/components/LuxurySignatureCollection";

// Home Components
import HeroSection from "@/components/home/HeroSection";
import MarqueeBridge from "@/components/home/MarqueeBridge";
import BrandPromise from "@/components/home/BrandPromise";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import FabricShowcase from "@/components/home/FabricShowcase";
import SocialProof from "@/components/home/SocialProof";
import TrustBadges from "@/components/home/TrustBadges";
import Newsletter from "@/components/home/Newsletter";
import { PollWidget } from "@/components/PollWidget";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartQuery = useCart();
  const addToCart = useAddToCart();
  const { toast } = useToast();

  // Updated to fetch New Arrivals correctly
  const productsQuery = useProducts({
    limit: 4,
    categoryId: "new",
    sortBy: "newest"
  });

  const handleAddToCart = (id: string) => {
    addToCart.mutate({ product_id: id, quantity: 1 });
    setIsCartOpen(true); // Open cart to show feedback
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-neutral-900 dark:bg-black dark:text-white transition-colors duration-300">
      <Header
        cartItemCount={(cartQuery.data?.items || []).reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => document.dispatchEvent(new CustomEvent('open-auth'))}
      />

      <main className="flex-1">
        <HeroSection />
        <MarqueeBridge />

        {/* 3. Brand Promise */}
        <BrandPromise />

        {/* 4. Signature Collection (Moved Up) */}
        <LuxurySignatureCollection />

        {/* 5. Featured Categories */}
        <FeaturedCategories />

        {/* 6. New Arrivals */}
        <section className="py-16 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <motion.span
                initial={{ opacity: 0, letterSpacing: "0em" }}
                whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
                transition={{ duration: 1 }}
                className="text-amber-600 font-bold uppercase text-sm mb-4 block"
              >
                Latest Drops
              </motion.span>
              <h2 className="font-display text-4xl md:text-5xl mb-6 dark:text-white">New Arrivals</h2>
              <a href="/new-arrivals" className="text-sm uppercase tracking-widest border-b border-black dark:border-white pb-1 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors dark:text-white">View All Collection</a>
            </motion.div>

            {productsQuery.isLoading ? (
              <div className="flex justify-center py-12"><Loading size="lg" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {(productsQuery.data?.items || []).map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                  >
                    <ProductCard
                      id={product.id}
                      brand={product.brand}
                      name={product.name}
                      price={Number(product.price)}
                      imageUrl={(product.images && Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : ""}
                      salePrice={product.sale_price ? Number(product.sale_price) : undefined}
                      isNew={product.created_at ? new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : false}
                      onAddToCart={() => handleAddToCart(product.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 7. Fabric Showcase */}
        <FabricShowcase />

        {/* 8. Social Proof */}
        <SocialProof />

        {/* 9. Trust Badges */}
        <TrustBadges />

        {/* 10. Community Poll */}
        <section className="py-8 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-6">
            <PollWidget />
          </div>
        </section>

        {/* 11. Newsletter */}
        <Newsletter />
      </main>

      <Footer />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
}
