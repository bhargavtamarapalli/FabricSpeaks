import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import ProductGrid from "@/components/ProductGrid";
import coat from '@assets/generated_images/Black_cashmere_wool_coat_bdc7199b.png';
import blouse from '@assets/generated_images/Beige_silk_blouse_aba3fb75.png';
import trousers from '@assets/generated_images/Navy_tailored_trousers_2971ff9f.png';
import sweater from '@assets/generated_images/Cream_knit_sweater_ea49eca8.png';
import blazer from '@assets/generated_images/Grey_wool_blazer_cbc57447.png';

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
      imageUrl: blouse,
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
      imageUrl: coat,
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
