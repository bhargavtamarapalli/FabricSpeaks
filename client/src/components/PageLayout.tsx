/**
 * PageLayout Component
 * Shared layout wrapper for e-commerce pages
 * Provides consistent Header and Footer with global cart/auth event handling
 */

import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";

interface PageLayoutProps {
    children: ReactNode;
    /** Optional: Hide footer on certain pages */
    hideFooter?: boolean;
    /** Optional: Custom className for the main container */
    className?: string;
}

export default function PageLayout({
    children,
    hideFooter = false,
    className = "min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300"
}: PageLayoutProps) {
    const cartQuery = useCart();
    const cartItems = cartQuery.data?.items || [];
    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className={className}>
            <Header
                cartItemCount={cartItemCount}
                onCartClick={() => document.dispatchEvent(new Event('open-cart'))}
                onAuthClick={() => document.dispatchEvent(new Event('open-auth'))}
            />

            {children}

            {!hideFooter && <Footer />}
        </div>
    );
}
