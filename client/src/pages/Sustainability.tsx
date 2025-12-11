import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";

export default function Sustainability() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [, setLocation] = useLocation();
    const cartQuery = useCart();
    const cartItems = cartQuery.data?.items || [];
    const { login, register } = useAuth();

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
                        className="text-center mb-16"
                    >
                        <span className="text-green-600 dark:text-green-500 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
                            Our Commitment
                        </span>
                        <h1 className="font-display text-5xl md:text-7xl mb-6 dark:text-white">
                            Sustainability
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 font-light text-lg max-w-2xl mx-auto">
                            Conscious creation for a better future. Respecting the artisan, the material, and the environment.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="prose prose-lg dark:prose-invert max-w-none"
                    >
                        <div className="grid md:grid-cols-2 gap-12 mb-16">
                            <div>
                                <h3 className="font-display text-2xl text-stone-900 dark:text-white mt-0 mb-4">Ethical Sourcing</h3>
                                <p className="text-stone-600 dark:text-neutral-400 font-light leading-relaxed">
                                    We partner directly with mills and artisans who uphold the highest standards of ethical production. From the flax fields of Belgium to the wool farms of Australia, we ensure fair wages and safe working conditions for everyone involved in our supply chain.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-display text-2xl text-stone-900 dark:text-white mt-0 mb-4">Eco-Friendly Materials</h3>
                                <p className="text-stone-600 dark:text-neutral-400 font-light leading-relaxed">
                                    Our commitment to the planet is reflected in our choice of materials. We prioritize natural, biodegradable fibers like organic cotton, linen, and wool. We actively avoid synthetic blends that contribute to microplastic pollution.
                                </p>
                            </div>
                        </div>

                        <div className="bg-stone-50 dark:bg-neutral-900 p-8 md:p-12 rounded-lg text-center">
                            <h3 className="font-display text-3xl text-stone-900 dark:text-white mt-0 mb-6">Zero Waste Initiatives</h3>
                            <p className="text-stone-600 dark:text-neutral-400 font-light leading-relaxed max-w-2xl mx-auto mb-0">
                                We are constantly striving to minimize waste. Our packaging is 100% recyclable and plastic-free. We also repurpose fabric scraps into smaller accessories or donate them to textile recycling programs.
                            </p>
                        </div>
                    </motion.div>
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
