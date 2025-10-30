import { useState } from "react";
import { useRoute } from "wouter";
import Header from "@/components/Header";
import ProductDetail from "@/components/ProductDetail";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import coat from '@assets/generated_images/Luxury_men\'s_black_cashmere_coat_cc266279.png';

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  const handleAddToCart = (size: string) => {
    console.log('Added to cart with size:', size);
    const newItem = {
      id: params?.id || '1',
      name: 'Cashmere Wool Coat',
      brand: 'ATELIER',
      price: 670,
      quantity: 1,
      size,
      imageUrl: coat,
    };
    setCartItems([...cartItems, newItem]);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        <ProductDetail
          brand="ATELIER"
          name="Men's Cashmere Wool Coat"
          price={890}
          salePrice={670}
          description="Luxuriously crafted from the finest cashmere wool blend, this men's coat embodies timeless elegance. Featuring a classic silhouette with modern tailoring, it offers both warmth and sophistication for the contemporary gentleman's wardrobe. The minimalist design ensures versatility across seasons."
          images={[coat, coat, coat, coat]}
          sizes={["S", "M", "L", "XL", "XXL"]}
          onAddToCart={handleAddToCart}
        />
      </main>

      <Footer />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(id, quantity) => {
          setCartItems(cartItems.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ));
        }}
        onRemoveItem={(id) => {
          setCartItems(cartItems.filter((item) => item.id !== id));
        }}
        onCheckout={() => console.log('Checkout clicked')}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={(email, password) => {
          console.log('Login:', email, password);
          setIsAuthOpen(false);
        }}
        onRegister={(email, password, name) => {
          console.log('Register:', email, password, name);
          setIsAuthOpen(false);
        }}
      />
    </div>
  );
}
