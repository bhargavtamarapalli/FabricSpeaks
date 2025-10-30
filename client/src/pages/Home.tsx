import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
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
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      name: 'Cashmere Wool Coat',
      brand: 'ATELIER',
      price: 670,
      quantity: 1,
      size: 'M',
      imageUrl: coat,
    },
  ]);

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
      id: '4',
      brand: 'MAISON',
      name: "Men's Leather Briefcase",
      price: 1200,
      imageUrl: briefcase,
      isNew: true,
    },
    {
      id: '5',
      brand: 'ATELIER',
      name: "Men's Merino Wool Sweater",
      price: 280,
      imageUrl: sweater,
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

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(cartItems.map((item) =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        <Hero
          title="Men's Spring Collection 2025"
          subtitle="Discover timeless sophistication with our curated men's collection"
          imageUrl={heroImage}
          ctaText="Explore Collection"
          ctaLink="/shop"
        />

        <ProductGrid products={products} title="New Arrivals for Men" />
      </main>

      <Footer />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
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
