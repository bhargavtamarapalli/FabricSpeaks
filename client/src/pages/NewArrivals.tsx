import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import ProductGrid from "@/components/ProductGrid";
import shirt from '@assets/generated_images/Men\'s_white_Oxford_shirt_573f333c.png';
import briefcase from '@assets/generated_images/Men\'s_brown_leather_briefcase_d5a30cf5.png';

export default function NewArrivals() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [cartItems] = useState<any[]>([]);

  const products = [
    {
      id: '2',
      brand: 'MAISON',
      name: "Men's Oxford Shirt",
      price: 220,
      imageUrl: shirt,
      isNew: true,
    },
    {
      id: '4',
      brand: 'MAISON',
      name: "Men's Leather Briefcase",
      price: 1200,
      imageUrl: briefcase,
      isNew: true,
    },
    {
      id: '10',
      brand: 'MAISON',
      name: "Men's Leather Wallet",
      price: 220,
      imageUrl: briefcase,
      isNew: true,
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
            <h1 className="text-3xl font-light mb-2">New Arrivals</h1>
            <p className="text-muted-foreground">Explore the latest additions to our men's collection</p>
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
