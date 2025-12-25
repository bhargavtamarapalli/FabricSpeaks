import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, CreditCard, History, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Import refactored sub-components
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { AddressBook } from "@/components/profile/AddressBook";
import { PaymentMethods } from "@/components/profile/PaymentMethods";
import { OrderHistory } from "@/components/profile/OrderHistory";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  // Auth Guard
  if (!user) {
    return (
      <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <User className="h-16 w-16 text-stone-300 dark:text-neutral-700 mb-6" />
          <h1 className="font-display text-3xl mb-4 dark:text-white">Sign In Required</h1>
          <p className="text-stone-500 dark:text-neutral-400 mb-8 font-light text-lg max-w-md">
            Please sign in to view your profile, manage orders, and update your settings.
          </p>
          <Button
            onClick={() => document.dispatchEvent(new Event('open-auth'))}
            size="lg"
            className="bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200"
          >
            Sign In
          </Button>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
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
            <p className="text-stone-600 dark:text-neutral-400 font-light text-lg mb-4">
              Manage your personal information, orders, and preferences.
            </p>

            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-900/20"
              onClick={async () => {
                await logout();
                toast({
                  title: "Logged out",
                  description: "You have been successfully logged out.",
                });
                setLocation("/");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
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
    </PageLayout>
  );
}
