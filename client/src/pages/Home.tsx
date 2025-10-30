import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import heroImage from '@assets/generated_images/Fashion_editorial_hero_image_ab08c975.png';
import coat from '@assets/generated_images/Black_cashmere_wool_coat_bdc7199b.png';
import blouse from '@assets/generated_images/Beige_silk_blouse_aba3fb75.png';
import trousers from '@assets/generated_images/Navy_tailored_trousers_2971ff9f.png';
import bag from '@assets/generated_images/White_leather_handbag_a51b7fc1.png';
import sweater from '@assets/generated_images/Cream_knit_sweater_ea49eca8.png';
import boots from '@assets/generated_images/Black_leather_ankle_boots_5c2dfe3d.png';
import blazer from '@assets/generated_images/Grey_wool_blazer_cbc57447.png';

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
      id: '4',
      brand: 'MAISON',
      name: "Men's Leather Briefcase",
      price: 1200,
      imageUrl: bag,
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
      imageUrl: coat,
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
