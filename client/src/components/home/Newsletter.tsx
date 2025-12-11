import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import FabricSpeaksLogoV4 from "@/components/FabricSpeaksLogoV4";

export default function Newsletter() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubscribe = async () => {
        if (!email) return;

        setIsLoading(true);
        try {
            await api.post("/api/newsletter/subscribe", { email });
            toast({
                title: "Subscribed!",
                description: "Thank you for joining our inner circle.",
            });
            setEmail("");
        } catch (error: any) {
            toast({
                title: "Subscription failed",
                description: error.message || "Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="py-16 bg-neutral-900 text-white text-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl mx-auto px-6"
            >
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="font-display text-3xl md:text-4xl mb-4"
                >
                    Join the Inner Circle
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-neutral-400 mb-8 font-light"
                >
                    Subscribe to receive early access to new collections and exclusive events.
                </motion.p>
                <div className="flex flex-col md:flex-row gap-4">
                    <motion.input
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        type="email"
                        placeholder="Enter your email address"
                        className="flex-1 bg-transparent border-b border-white/30 py-3 px-4 focus:outline-none focus:border-white transition-colors text-white placeholder:text-neutral-600"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                    >
                        <Button
                            variant="outline"
                            className="border-white text-white hover:bg-white hover:text-black px-8 py-3 rounded-none uppercase tracking-widest text-xs h-full"
                            onClick={handleSubscribe}
                            disabled={isLoading}
                        >
                            {isLoading ? <div className="w-6 h-6"><FabricSpeaksLogoV4 className="w-full h-full" disableMouseTracking /></div> : "Subscribe"}
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}
