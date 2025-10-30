import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import ProductGrid from "@/components/ProductGrid";
import coat from '@assets/generated_images/Luxury_men\'s_black_cashmere_coat_cc266279.png';
import shirt from '@assets/generated_images/Men\'s_white_Oxford_shirt_573f333c.png';
import trousers from '@assets/generated_images/Men\'s_grey_tailored_trousers_64b68ccd.png';
import sweater from '@assets/generated_images/Men\'s_navy_merino_sweater_266e4eb2.png';
import blazer from '@assets/generated_images/Men\'s_charcoal_wool_blazer_af4c6c92.png';
import overcoat from '@assets/generated_images/Men\'s_camel_cashmere_overcoat_939b4b8d.png';

export default function Clothing() {
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
      id: '2',
      brand: 'MAISON',
      name: "Men's Oxford Shirt",
      price: 220,
      imageUrl: shirt,
      isNew: true,
    },
    {
      id: '3',
      brand: 'ATELIER',
      name: "Men's Tailored Trousers",
      price: 350,
      imageUrl: trousers,
    },
    {
      id: '5',
      brand: 'ATELIER',
      name: "Men's Merino Wool Sweater",
      price: 280,
      imageUrl: sweater,
    },
    {
      id: '7',
      brand: 'ATELIER',
      name: "Men's Wool Blazer",
      price: 780,
      imageUrl: blazer,
    },
    {
      id: '8',
      brand: 'MAISON',
      name: "Men's Premium Overcoat",
      price: 950,
      imageUrl: overcoat,
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
            <h1 className="text-3xl font-light mb-2">Men's Clothing</h1>
            <p className="text-muted-foreground">Discover our curated collection of premium menswear</p>
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
