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
            {isAdmin ? (
                <>
                    <Card className="p-8 border-none shadow-none bg-stone-50 dark:bg-neutral-900">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-display text-xl mb-2 dark:text-white">Visa ending in 4242</h3>
                                <p className="text-stone-600 dark:text-neutral-400 font-light">Expires 12/2026</p>
                            </div>
                            <Button variant="outline" size="sm" className="transition-all duration-200 border-stone-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700">Edit</Button>
                        </div>
                    </Card>
                    <Button
                        variant="outline"
                        className="w-full py-8 border-dashed border-stone-300 dark:border-neutral-700 text-stone-500 dark:text-neutral-500 hover:bg-stone-50 dark:hover:bg-neutral-900 transition-all duration-200"
                        data-testid="button-add-payment"
                        onClick={() => alert("Payment method management is currently disabled in this demo.")}
                    >
                        + Add Payment Method
                    </Button>
                </>
            ) : (
                <div className="text-center text-stone-500 dark:text-neutral-500 py-12 bg-stone-50 dark:bg-neutral-900 rounded-lg">
                    <p>Saved payment methods are not currently enabled for your account.</p>
                </div>
            )}
        </motion.div>
    );
}
