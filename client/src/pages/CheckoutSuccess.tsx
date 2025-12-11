
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { useOrders } from "@/hooks/useOrders";
import { motion } from "framer-motion";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

export default function CheckoutSuccess() {
    const [, setLocation] = useLocation();
    const { data: orders, isLoading } = useOrders();
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const cartQuery = useCart();
    const cartItems = cartQuery.data?.items || [];
    const { login, register } = useAuth();

    // Find the most recent order
    useEffect(() => {
        if (orders && orders.length > 0) {
            // Assuming orders are sorted by date desc or we sort them
            const sorted = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setLastOrder(sorted[0]);
        }
    }, [orders]);

    // Fetch recommendations based on the first item of the last order
    const lastProductId = lastOrder?.items?.[0]?.product_id;

    const { data: recommendations } = useQuery({
        queryKey: ['success-recommendations', lastProductId],
        queryFn: async () => {
            if (!lastProductId) return [];
            const res = await fetch(`/api/products/${lastProductId}/recommendations`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!lastProductId
    });

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
            <Header
                cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                onCartClick={() => setIsCartOpen(true)}
                onAuthClick={() => setIsAuthOpen(true)}
            />

            <main className="flex-1 flex flex-col items-center justify-center py-24 px-6">
                <div className="max-w-4xl w-full text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8"
                    >
                        <CheckCircle size={48} />
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <span className="text-amber-600 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
                            Thank You
                        </span>
                        <h1 className="text-5xl md:text-6xl font-display text-stone-900 dark:text-white mb-6">Order Confirmed</h1>
                        <p className="text-stone-600 dark:text-neutral-400 mb-10 text-xl font-light max-w-lg mx-auto">
                            We've received your order <span className="font-medium text-stone-900 dark:text-white">#{lastOrder?.id?.slice(0, 8)}</span> and will begin processing it right away.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
                            <Button
                                variant="outline"
                                onClick={() => setLocation('/orders')}
                                className="h-12 px-8 border-stone-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-stone-900 dark:text-white"
                            >
                                View Order Details
                            </Button>
                            <Button
                                onClick={() => setLocation('/clothing')}
                                className="h-12 px-8 bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200"
                            >
                                Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* Recommendations */}
                    {recommendations && recommendations.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="border-t border-stone-200 dark:border-neutral-800 pt-16"
                        >
                            <h2 className="font-display text-3xl text-stone-900 dark:text-white mb-3">Complete Your Wardrobe</h2>
                            <p className="text-stone-500 dark:text-neutral-400 mb-10 font-light">Curated selections to pair with your purchase</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                                {recommendations.map((rec: any, index: number) => (
                                    <motion.div
                                        key={rec.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.6 + (index * 0.1) }}
                                    >
                                        <Link href={`/product/${rec.id}`}>
                                            <div className="group cursor-pointer">
                                                <div className="aspect-[3/4] bg-stone-100 dark:bg-neutral-900 mb-4 overflow-hidden rounded-lg">
                                                    <img
                                                        src={rec.images?.[0] || rec.signature_details?.image}
                                                        alt={rec.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                    />
                                                </div>
                                                <h3 className="font-display text-lg text-stone-900 dark:text-white mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{rec.name}</h3>
                                                <p className="text-stone-500 dark:text-neutral-400 font-light">₹{rec.price}</p>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
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
