import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";

export default function Orders() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [, setLocation] = useLocation();
  const cartQuery = useCart();
  const cartItems = cartQuery.data?.items || [];
  const ordersQuery = useOrders();
  const { user, login, register } = useAuth();
  const isAdmin = user?.role === "admin";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none hover:bg-green-100 dark:hover:bg-green-900/30"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-none hover:bg-blue-100 dark:hover:bg-blue-900/30"><Truck className="h-3 w-3 mr-1" />In Transit</Badge>;
      case 'processing':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none hover:bg-amber-100 dark:hover:bg-amber-900/30"><Package className="h-3 w-3 mr-1" />Processing</Badge>;
      default:
        return <Badge variant="secondary" className="bg-stone-100 text-stone-800 dark:bg-neutral-800 dark:text-neutral-400 border-none"><Clock className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h1 data-testid="text-orders-title" className="font-display text-4xl md:text-5xl mb-4 dark:text-white">
              My Orders
              {isAdmin && (
                <span className="ml-4 px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200 align-middle font-sans tracking-wide">Admin</span>
              )}
            </h1>
            <p className="text-stone-600 dark:text-neutral-400 font-light text-lg">
              Track your shipments and view order history.
            </p>
          </motion.div>

          <div className="space-y-6">
            {ordersQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-stone-50 dark:bg-neutral-900 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : ordersQuery.error ? (
              <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                Failed to load orders. Please try again later.
              </div>
            ) : (ordersQuery.data || []).length === 0 ? (
              <div className="text-center py-16 bg-stone-50 dark:bg-neutral-900 rounded-lg">
                <Package className="h-12 w-12 mx-auto text-stone-300 dark:text-neutral-700 mb-4" />
                <p className="text-stone-500 dark:text-neutral-500 text-lg">No orders found.</p>
                <Button variant="link" className="text-amber-600 dark:text-amber-500 mt-2">Start Shopping</Button>
              </div>
            ) : (
              (ordersQuery.data || []).map((order: any, index: number) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    data-testid={`card-order-${order.id}`}
                    className="p-8 border-none shadow-none bg-stone-50 dark:bg-neutral-900 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors duration-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-6">
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <h3 data-testid={`text-order-id-${order.id}`} className="font-display text-xl dark:text-white">
                            Order #{order.id}
                          </h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-stone-500 dark:text-neutral-400 font-light">
                          Ordered on {new Date(order.placedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-sm text-stone-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Total</p>
                        <p data-testid={`text-order-total-${order.id}`} className="text-2xl font-display dark:text-white">
                          ₹{order.totalAmount}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-6 border-t border-stone-200 dark:border-neutral-800">
                      <Button variant="outline" className="flex-1 md:flex-none border-stone-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700 dark:text-white transition-all duration-200">
                        Track Order
                      </Button>
                      <Button variant="outline" className="flex-1 md:flex-none border-stone-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700 dark:text-white transition-all duration-200">
                        View Details
                      </Button>
                      {isAdmin && (
                        <Button variant="destructive" className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 transition-all duration-200">
                          Admin Action
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
            {!isAdmin && (
              <div className="text-center text-stone-400 dark:text-neutral-600 text-xs mt-8">
                Only admin users can perform order management actions.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => setLocation('/checkout')}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={async (email, password) => {
          try {
            await login(email, password);
            setIsAuthOpen(false);
          } catch (e) {
            console.error("Login failed:", e);
            alert("Login failed. Please check your credentials.");
          }
        }}
        onRegister={async (email, password, name) => {
          try {
            await register(email, password);
            setIsAuthOpen(false);
          } catch (e) {
            console.error("Registration failed:", e);
            alert("Registration failed. Please try again.");
          }
        }}
      />
    </div>
  );
}
