import { useEffect } from "react";
import { useRoute } from "wouter";
import ProductDetail from "@/components/ProductDetail";
import ReviewList from "@/components/ReviewList";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import ProductRecommendations from "@/components/ProductRecommendations";
import SimilarApparels from "@/components/SimilarApparels";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/PageLayout";

import { SEO } from "@/components/SEO";
import { analytics } from "@/lib/analytics";

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const productQuery = useProduct(params?.id || "");

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
   * @param size - The selected size
   * @param colour - The selected colour
   */
  const handleAddToCart = async (variantId: string, price: number, size?: string, colour?: string) => {
    try {
      await addToCart.mutateAsync({
        product_id: params?.id || "",
        variant_id: variantId,
        quantity: 1,
        size: size,
        colour: colour,
      });

      // Track add_to_cart
      if (productQuery.data) {
        analytics.addToCart(productQuery.data, 1);
      }

      document.dispatchEvent(new Event('open-cart'));
    } catch (e: any) {
      // Handle authentication errors
      if (e?.code === "UNAUTHORIZED") {
        document.dispatchEvent(new Event('open-auth'));
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
    <PageLayout className="min-h-screen flex flex-col">
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
              image={(productQuery.data as any).images?.[0]}
              type="product"
              structuredData={{
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": productQuery.data.name,
                "image": (productQuery.data as any).images,
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
    </PageLayout>
  );
}
