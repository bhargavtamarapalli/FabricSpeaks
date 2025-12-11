import React, { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LuxurySignatureCollection from "@/components/LuxurySignatureCollection";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

export default function SignatureCollectionPage() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [, setLocation] = useLocation();
    const cartQuery = useCart();
    const cartItems = cartQuery.data?.items || [];
    const { login, register } = useAuth();

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-black font-sans transition-colors duration-300">
            <Header
                cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                onCartClick={() => setIsCartOpen(true)}
                onAuthClick={() => setIsAuthOpen(true)}
            />
            <main className="pt-20">
                <LuxurySignatureCollection />
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
