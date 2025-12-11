import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import ProductDetail from "@/components/ProductDetail";
import ReviewList from "@/components/ReviewList";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart, useCart } from "@/hooks/useCart";
import ProductRecommendations from "@/components/ProductRecommendations";
import SimilarApparels from "@/components/SimilarApparels";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { SEO } from "@/components/SEO";
import { analytics } from "@/lib/analytics";

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const cartQuery = useCart();
  const addToCart = useAddToCart();
  const productQuery = useProduct(params?.id || "");
  const { login, register } = useAuth();

  // Track view_item
  useEffect(() => {
    if (productQuery.data) {
      analytics.viewItem(productQuery.data);
    }
  }, [productQuery.data]);

  /**
   * Handle adding a variant to cart
   * @param variantId - The selected variant ID
   * @param price - The calculated price (including variant adjustments)
   */
  const handleAddToCart = async (variantId: string, price: number) => {
    try {
      await addToCart.mutateAsync({
        product_id: params?.id || "",
        variant_id: variantId,
        unit_price: price,
        quantity: 1,
      });

      // Track add_to_cart
      if (productQuery.data) {
        analytics.addToCart(productQuery.data, 1);
      }

      setIsCartOpen(true);
    } catch (e: any) {
      // Handle authentication errors
      if (e?.code === "UNAUTHORIZED") {
        setIsAuthOpen(true);
      } else {
        // Show error message to user
        console.error("Failed to add to cart:", e);
        toast({
          variant: "destructive",
          title: "Error adding to cart",
          description: e?.message || "Failed to add item to cart. Please try again.",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemCount={(cartQuery.data?.items || []).reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        {productQuery.isLoading ? (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="animate-pulse h-96 bg-muted rounded-md" />
          </div>
        ) : productQuery.error || !productQuery.data ? (
          <div className="max-w-7xl mx-auto px-6 py-12 text-center text-red-600">
            Product not found
          </div>
        ) : (

          <>
            <SEO
              title={productQuery.data.name}
              description={productQuery.data.description}
              image={productQuery.data.images?.[0]}
              type="product"
              structuredData={{
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": productQuery.data.name,
                "image": productQuery.data.images,
                "description": productQuery.data.description,
                "sku": productQuery.data.sku,
                "offers": {
                  "@type": "Offer",
                  "priceCurrency": "USD",
                  "price": productQuery.data.price,
                  "availability": productQuery.data.stock_quantity > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock"
                }
              }}
            />


            <ProductDetail
              product={productQuery.data}
              onAddToCart={handleAddToCart}
            />

            <ProductRecommendations productId={productQuery.data.id} />
            <SimilarApparels productId={productQuery.data.id} />

            <div className="max-w-7xl mx-auto px-6 py-16">
              <ReviewList productId={productQuery.data.id} />
            </div>
          </>
        )}
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
            toast({
              variant: "destructive",
              title: "Login Failed",
              description: "Please check your credentials.",
            });
          }
        }}
        onRegister={async (email, password, name) => {
          try {
            await register(email, password);
            setIsAuthOpen(false);
          } catch (e) {
            console.error("Registration failed:", e);
            toast({
              variant: "destructive",
              title: "Registration Failed",
              description: "Please try again.",
            });
          }
        }}
      />
    </div>
  );
}
