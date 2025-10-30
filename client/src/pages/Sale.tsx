import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import ProductGrid from "@/components/ProductGrid";
import coat from '@assets/generated_images/Luxury_men\'s_black_cashmere_coat_cc266279.png';
import boots from '@assets/generated_images/Men\'s_black_Chelsea_boots_f0beca21.png';

export default function Sale() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [cartItems] = useState<any[]>([]);

  const products = [
    {
      id: '1',
      brand: 'ATELIER',
      name: "Men's Cashmere Wool Coat",
      price: 890,
      salePrice: 670,
      imageUrl: coat,
    },
    {
      id: '6',
      brand: 'MAISON',
      name: "Men's Chelsea Boots",
      price: 550,
      salePrice: 385,
      imageUrl: boots,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h1 className="text-3xl font-light mb-2">Sale</h1>
            <p className="text-muted-foreground">Discover exceptional pieces at reduced prices</p>
          </div>
          
          <ProductGrid products={products} />
        </div>
      </main>

      <Footer />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={() => {}}
        onRemoveItem={() => {}}
        onCheckout={() => console.log('Checkout clicked')}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={() => setIsAuthOpen(false)}
        onRegister={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
