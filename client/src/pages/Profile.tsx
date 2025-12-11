import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, CreditCard, History } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

// Import refactored sub-components
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { AddressBook } from "@/components/profile/AddressBook";
import { PaymentMethods } from "@/components/profile/PaymentMethods";
import { OrderHistory } from "@/components/profile/OrderHistory";

export default function Profile() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [, setLocation] = useLocation();
  const cartQuery = useCart();
  const cartItems = cartQuery.data?.items || [];

  const { user, login, register } = useAuth();
  const isAdmin = user?.role === "admin";

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
            <h1 data-testid="text-profile-title" className="font-display text-4xl md:text-5xl mb-4 dark:text-white">
              My Account
              {isAdmin && (
                <span className="ml-4 px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200 align-middle font-sans tracking-wide">Admin</span>
              )}
            </h1>
            <p className="text-stone-600 dark:text-neutral-400 font-light text-lg">
              Manage your personal information, orders, and preferences.
            </p>
          </motion.div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-12 bg-stone-100 dark:bg-neutral-900 p-1 rounded-lg">
              <TabsTrigger
                value="profile"
                className="transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-stone-900 dark:data-[state=active]:text-white text-stone-500 dark:text-neutral-500 font-medium"
              >
                <User className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="addresses"
                className="transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-stone-900 dark:data-[state=active]:text-white text-stone-500 dark:text-neutral-500 font-medium"
              >
                <MapPin className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Addresses</span>
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-stone-900 dark:data-[state=active]:text-white text-stone-500 dark:text-neutral-500 font-medium"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-stone-900 dark:data-[state=active]:text-white text-stone-500 dark:text-neutral-500 font-medium"
              >
                <History className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <ProfileInfo />
            </TabsContent>

            <TabsContent value="addresses" className="space-y-6">
              <AddressBook />
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <PaymentMethods />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <OrderHistory />
            </TabsContent>
          </Tabs>
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
