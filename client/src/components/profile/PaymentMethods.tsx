import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function PaymentMethods() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <div className="text-center text-stone-500 dark:text-neutral-500 py-12 bg-stone-50 dark:bg-neutral-900 rounded-lg">
                <p className="mb-2">For your security, we do not store credit card details directly.</p>
                <p className="text-sm">Your payment methods are securely managed by our payment partner (Razorpay) during checkout.</p>
            </div>
        </motion.div>
    );
}
