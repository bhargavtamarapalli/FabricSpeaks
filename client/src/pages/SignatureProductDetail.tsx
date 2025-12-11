import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Ruler, Droplets, ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAddToCart, useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function SignatureProductDetail() {
    const [, params] = useRoute("/signature/:slug");
    const slug = params?.slug;
    const [, setLocation] = useLocation();
    const addToCart = useAddToCart();
    const { toast } = useToast();
    const cartQuery = useCart();
    const { login, register } = useAuth();

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    const { data: product, isLoading } = useQuery({
        queryKey: ["product", slug],
        queryFn: async () => {
            if (!slug) return null;
            const res = await fetch(`/api/products/${slug}`);
            if (!res.ok) throw new Error("Product not found");
            return res.json();
        },
        enabled: !!slug,
    });

    const handleAddToCart = () => {
        if (product) {
            addToCart.mutate({ productId: product.id, quantity: 1 });
            toast({
                title: "Added to Bag",
                description: `${product.name} has been added to your cart.`,
            });
            setIsCartOpen(true);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400 dark:text-neutral-600" />
            </div>
        );
    }

    if (!product) return <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-black text-stone-900 dark:text-white">Product not found</div>;

    const details = product.signature_details?.details || {};
    const image = product.signature_details?.image || product.images?.[0];

    return (
        <div className="min-h-screen bg-[#F5F5F0] dark:bg-black font-sans transition-colors duration-300">
            <Header
                cartItemCount={(cartQuery.data?.items || []).reduce((sum, item) => sum + item.quantity, 0)}
                onCartClick={() => setIsCartOpen(true)}
                onAuthClick={() => setIsAuthOpen(true)}
            />

            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Button
                            variant="ghost"
                            onClick={() => setLocation("/signature-collection")}
                            className="mb-8 hover:bg-transparent hover:text-amber-600 dark:hover:text-amber-500 pl-0 text-stone-600 dark:text-neutral-400"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collection
                        </Button>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row gap-16">
                        {/* Left: Image */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="w-full lg:w-1/2"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-2xl dark:shadow-none">
                                <img
                                    src={image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-6 left-6 bg-white/90 dark:bg-black/90 backdrop-blur px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-900 dark:text-white border border-stone-200 dark:border-neutral-800">
                                    {product.signature_details?.tag || "Signature"}
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: Details */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="w-full lg:w-1/2 flex flex-col justify-center"
                        >
                            <span className="text-amber-700 dark:text-amber-500 font-bold tracking-[0.2em] uppercase mb-4 block text-sm">
                                Signature Collection
                            </span>
                            <h1 className="font-display text-5xl md:text-6xl text-stone-900 dark:text-white mb-6 leading-tight">
                                {product.name}
                            </h1>
                            <div className="text-3xl font-light text-stone-900 dark:text-white mb-8">
                                ₹{product.price}
                            </div>

                            <div className="prose prose-stone dark:prose-invert text-lg text-stone-600 dark:text-neutral-400 font-light mb-10 leading-relaxed">
                                <p>{product.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10 border-t border-stone-300 dark:border-neutral-800 pt-8">
                                <div>
                                    <h4 className="font-display text-lg text-stone-900 dark:text-white mb-2 flex items-center gap-2">
                                        <Ruler size={18} className="text-stone-600 dark:text-neutral-500" /> Fit & Details
                                    </h4>
                                    <ul className="text-sm text-stone-600 dark:text-neutral-400 space-y-1">
                                        <li>{product.fit || details.fit || "Standard fit"}</li>
                                        {product.pattern && <li>Pattern: {product.pattern}</li>}
                                        {product.occasion && <li>Occasion: {product.occasion}</li>}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-display text-lg text-stone-900 dark:text-white mb-2 flex items-center gap-2">
                                        <Droplets size={18} className="text-stone-600 dark:text-neutral-500" /> Fabric & Care
                                    </h4>
                                    <ul className="text-sm text-stone-600 dark:text-neutral-400 space-y-1">
                                        <li>{product.fabric || "Premium Fabric"}</li>
                                        {product.gsm && <li>Weight: {product.gsm} GSM</li>}
                                        {product.weave && <li>Weave: {product.weave}</li>}
                                        <li>{product.wash_care || details.care || "See label"}</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-stone-900 dark:bg-white text-white dark:text-black h-14 text-sm uppercase tracking-widest hover:bg-stone-800 dark:hover:bg-neutral-200 shadow-lg dark:shadow-none transition-all duration-300"
                                >
                                    <ShoppingBag className="mr-2 h-4 w-4" /> Add to Bag
                                </Button>
                            </div>
                        </motion.div>
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
