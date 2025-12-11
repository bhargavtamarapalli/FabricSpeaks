import { useState } from "react";
import Loading from "@/components/Loading";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import { useProducts } from "@/hooks/useProducts";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { useCart, useAddToCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import heroImage from '@assets/generated_images/Men\'s_fashion_hero_editorial_7382b369.png';
import coat from '@assets/generated_images/Luxury_men\'s_black_cashmere_coat_cc266279.png';
import shirt from '@assets/generated_images/Men\'s_white_Oxford_shirt_573f333c.png';
import trousers from '@assets/generated_images/Men\'s_grey_tailored_trousers_64b68ccd.png';
import briefcase from '@assets/generated_images/Men\'s_brown_leather_briefcase_d5a30cf5.png';
import sweater from '@assets/generated_images/Men\'s_navy_merino_sweater_266e4eb2.png';
import boots from '@assets/generated_images/Men\'s_black_Chelsea_boots_f0beca21.png';
import blazer from '@assets/generated_images/Men\'s_charcoal_wool_blazer_af4c6c92.png';
import overcoat from '@assets/generated_images/Men\'s_camel_cashmere_overcoat_939b4b8d.png';

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const cartQuery = useCart();
  const addToCart = useAddToCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const { login, register } = useAuth();

  const productsQuery = useProducts({ limit: 12 });

  const handleUpdateQuantity = (id: string, quantity: number) => {
    updateItem.mutate({ id, quantity });
  };

  const handleRemoveItem = (id: string) => {
    removeItem.mutate(id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemCount={(cartQuery.data?.items || []).reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        <Hero
          title="Men's Spring Collection 2025"
          subtitle="Discover timeless sophistication with our curated men's collection"
          imageUrl={heroImage}
          ctaText="Explore Collection"
          ctaLink="/clothing"
        />

        {productsQuery.isLoading ? (
          <section className="py-16 px-6 flex justify-center">
            <Loading size="lg" />
          </section>
        ) : productsQuery.error ? (
          <section className="py-16 px-6">
            <div className="max-w-7xl mx-auto text-center text-red-600">
              Failed to load products
            </div>
          </section>
        ) : (
          <ProductGrid
            products={productsQuery.data?.items || []}
            title="New Arrivals for Men"
          />
        )}
      </main>

      <Footer />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
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
            // Note: The current register function in useAuth only takes username and password.
            // We might need to update useAuth to accept name if the backend supports it.
            // For now, we'll use the email as username.
            await register(email, password);
            setIsAuthOpen(false);
          } catch (e) {
            console.error("Registration failed:", e);
            alert("Registration failed. Please try again.");
          }
        }}
      />
    </div>
  );
}
