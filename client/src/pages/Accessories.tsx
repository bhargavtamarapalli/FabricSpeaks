import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import ProductGrid from "@/components/ProductGrid";
import bag from '@assets/generated_images/White_leather_handbag_a51b7fc1.png';
import boots from '@assets/generated_images/Black_leather_ankle_boots_5c2dfe3d.png';

export default function Accessories() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [cartItems] = useState<any[]>([]);

  const products = [
    {
      id: '4',
      brand: 'MAISON',
      name: "Men's Leather Briefcase",
      price: 1200,
      imageUrl: bag,
      isNew: true,
    },
    {
      id: '6',
      brand: 'MAISON',
      name: "Men's Chelsea Boots",
      price: 550,
      salePrice: 385,
      imageUrl: boots,
    },
    {
      id: '9',
      brand: 'ATELIER',
      name: "Men's Leather Belt",
      price: 180,
      imageUrl: bag,
    },
    {
      id: '10',
      brand: 'MAISON',
      name: "Men's Leather Wallet",
      price: 220,
      imageUrl: bag,
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
            <h1 className="text-3xl font-light mb-2">Men's Accessories</h1>
            <p className="text-muted-foreground">Complete your look with our refined accessories</p>
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
