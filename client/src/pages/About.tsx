import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { Card } from "@/components/ui/card";

export default function About() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [cartItems] = useState<any[]>([]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl font-light mb-8">About Atelier</h1>

          <div className="space-y-8">
            <Card className="p-8">
              <h2 className="text-2xl font-light mb-4">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Founded with a vision to redefine men's luxury fashion, Atelier represents the perfect
                balance between timeless elegance and contemporary design. Our curated collections
                feature premium materials and exceptional craftsmanship.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Every piece in our collection is carefully selected to embody sophistication,
                quality, and versatility, ensuring that the modern gentleman can build a wardrobe
                that stands the test of time.
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-light mb-4">Our Values</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Quality First</h3>
                  <p className="text-sm text-muted-foreground">
                    We source only the finest materials and work with master craftsmen to ensure
                    every piece meets our exacting standards.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Timeless Design</h3>
                  <p className="text-sm text-muted-foreground">
                    Our collections focus on classic silhouettes and refined details that transcend
                    seasonal trends.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Sustainability</h3>
                  <p className="text-sm text-muted-foreground">
                    We're committed to responsible sourcing and ethical production practices that
                    minimize our environmental impact.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-light mb-4">Craftsmanship</h2>
              <p className="text-muted-foreground leading-relaxed">
                Each garment in our collection is crafted with meticulous attention to detail.
                From the initial design sketch to the final stitch, we maintain the highest
                standards of quality. Our partnerships with renowned European ateliers ensure
                that every piece exemplifies the pinnacle of luxury menswear.
              </p>
            </Card>
          </div>
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
