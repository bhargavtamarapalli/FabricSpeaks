import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle } from "lucide-react";
import coat from '@assets/generated_images/Black_cashmere_wool_coat_bdc7199b.png';
import blouse from '@assets/generated_images/Beige_silk_blouse_aba3fb75.png';

export default function Orders() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [cartItems] = useState<any[]>([]);

  const orders = [
    {
      id: 'ORD-2025-001',
      date: 'March 15, 2025',
      status: 'delivered',
      total: 1090,
      items: [
        { name: 'Cashmere Wool Coat', size: 'M', quantity: 1, price: 670, image: coat },
        { name: 'Silk Blouse', size: 'L', quantity: 1, price: 420, image: blouse },
      ],
    },
    {
      id: 'ORD-2025-002',
      date: 'March 20, 2025',
      status: 'in_transit',
      total: 780,
      items: [
        { name: 'Wool Blazer', size: 'L', quantity: 1, price: 780, image: coat },
      ],
    },
    {
      id: 'ORD-2025-003',
      date: 'March 25, 2025',
      status: 'processing',
      total: 550,
      items: [
        { name: 'Leather Ankle Boots', size: '42', quantity: 1, price: 550, image: blouse },
      ],
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-600 text-white"><Truck className="h-3 w-3 mr-1" />In Transit</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Package className="h-3 w-3 mr-1" />Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 data-testid="text-orders-title" className="text-3xl font-light mb-8">
            My Orders
          </h1>

          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {orders.map((order, index) => (
              <Card
                key={order.id}
                data-testid={`card-order-${order.id}`}
                className="p-6 hover-elevate transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 data-testid={`text-order-id-${order.id}`} className="font-medium text-lg">
                        {order.id}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ordered on {order.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p data-testid={`text-order-total-${order.id}`} className="text-xl font-medium">
                      ${order.total}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-20 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Size: {item.size} • Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-medium mt-1">${item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" className="flex-1 transition-all duration-200">
                    Track Order
                  </Button>
                  <Button variant="outline" className="flex-1 transition-all duration-200">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
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
