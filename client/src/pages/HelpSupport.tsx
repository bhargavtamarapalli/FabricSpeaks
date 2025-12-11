import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";

export default function HelpSupport() {
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
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <span className="text-amber-600 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
                            Customer Care
                        </span>
                        <h1 className="font-display text-5xl md:text-7xl mb-6 dark:text-white">
                            Help & Support
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 font-light text-lg max-w-2xl mx-auto">
                            We're here to assist you. Find answers to common questions or get in touch with our team.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <section className="mb-16">
                            <h2 className="font-display text-2xl text-stone-900 dark:text-white mb-8">Frequently Asked Questions</h2>
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                <AccordionItem value="item-1" className="border-stone-200 dark:border-neutral-800">
                                    <AccordionTrigger className="text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-500 hover:no-underline text-lg font-light">How do I track my order?</AccordionTrigger>
                                    <AccordionContent className="text-stone-600 dark:text-neutral-400 leading-relaxed">
                                        You can track your order by logging into your account and visiting the "My Orders" section.
                                        Once your order is shipped, you will also receive a tracking link via email.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2" className="border-stone-200 dark:border-neutral-800">
                                    <AccordionTrigger className="text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-500 hover:no-underline text-lg font-light">What is your return policy?</AccordionTrigger>
                                    <AccordionContent className="text-stone-600 dark:text-neutral-400 leading-relaxed">
                                        We offer a 30-day return policy for all unworn items in their original condition with tags attached.
                                        Returns are free for all domestic orders.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3" className="border-stone-200 dark:border-neutral-800">
                                    <AccordionTrigger className="text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-500 hover:no-underline text-lg font-light">Do you ship internationally?</AccordionTrigger>
                                    <AccordionContent className="text-stone-600 dark:text-neutral-400 leading-relaxed">
                                        Yes, we ship to select international destinations. Shipping costs and delivery times vary by location.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4" className="border-stone-200 dark:border-neutral-800">
                                    <AccordionTrigger className="text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-500 hover:no-underline text-lg font-light">How do I care for my fabric?</AccordionTrigger>
                                    <AccordionContent className="text-stone-600 dark:text-neutral-400 leading-relaxed">
                                        Each product comes with specific care instructions. Generally, we recommend dry cleaning for wool and silk,
                                        and gentle machine wash for cottons. Check the inner label for details.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </section>

                        <section className="mb-12">
                            <h2 className="font-display text-2xl text-stone-900 dark:text-white mb-8">Contact Us</h2>
                            <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 transition-colors">
                                            <Mail className="h-5 w-5 text-stone-600 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-500" />
                                        </div>
                                        <span className="text-stone-600 dark:text-neutral-400 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">support@fabricspeaks.com</span>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 transition-colors">
                                            <Phone className="h-5 w-5 text-stone-600 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-500" />
                                        </div>
                                        <span className="text-stone-600 dark:text-neutral-400 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">+91 123 456 7890</span>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 transition-colors">
                                            <MessageCircle className="h-5 w-5 text-stone-600 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-500" />
                                        </div>
                                        <span className="text-stone-600 dark:text-neutral-400 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">WhatsApp Support Available</span>
                                    </div>
                                </div>

                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    <Input
                                        placeholder="Your Name"
                                        className="bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 focus-visible:ring-amber-600"
                                    />
                                    <Input
                                        type="email"
                                        placeholder="Your Email"
                                        className="bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 focus-visible:ring-amber-600"
                                    />
                                    <Textarea
                                        placeholder="How can we help you?"
                                        className="min-h-[120px] bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 focus-visible:ring-amber-600"
                                    />
                                    <Button className="w-full bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200">
                                        Send Message
                                    </Button>
                                </form>
                            </div>
                        </section>
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
