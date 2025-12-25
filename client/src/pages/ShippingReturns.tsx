import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Truck, Clock, Globe } from "lucide-react";
import PageLayout from "@/components/PageLayout";

export default function ShippingReturns() {
    return (
        <PageLayout>
            <main className="flex-1 py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <span className="text-amber-600 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
                            Service
                        </span>
                        <h1 className="font-display text-5xl md:text-7xl mb-6 dark:text-white">
                            Shipping & Returns
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 font-light text-lg max-w-2xl mx-auto">
                            Transparent policies designed for your peace of mind. Fast delivery and hassle-free returns.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="mb-16">
                            <h2 className="font-display text-2xl text-stone-900 dark:text-white mb-6">Shipping Policy</h2>
                            <p className="text-stone-600 dark:text-neutral-400 mb-8 font-light leading-relaxed">
                                We offer free standard shipping on all orders over ₹2000. All orders are processed within 1-2 business days.
                                You will receive a confirmation email with tracking details once your order has been dispatched.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-8 bg-stone-50 dark:bg-neutral-900 rounded-lg border border-transparent hover:border-stone-200 dark:hover:border-neutral-800 transition-colors">
                                    <Truck className="h-8 w-8 text-amber-600 mb-4" />
                                    <h4 className="font-display text-xl text-stone-900 dark:text-white mb-2">Standard Shipping</h4>
                                    <p className="text-sm text-stone-500 dark:text-neutral-400 font-medium uppercase tracking-wide mb-1">5-7 Business Days</p>
                                    <p className="text-sm text-stone-600 dark:text-neutral-400">Free over ₹2000</p>
                                </div>
                                <div className="p-8 bg-stone-50 dark:bg-neutral-900 rounded-lg border border-transparent hover:border-stone-200 dark:hover:border-neutral-800 transition-colors">
                                    <Clock className="h-8 w-8 text-amber-600 mb-4" />
                                    <h4 className="font-display text-xl text-stone-900 dark:text-white mb-2">Express Shipping</h4>
                                    <p className="text-sm text-stone-500 dark:text-neutral-400 font-medium uppercase tracking-wide mb-1">2-3 Business Days</p>
                                    <p className="text-sm text-stone-600 dark:text-neutral-400">₹250 flat rate</p>
                                </div>
                                <div className="p-8 bg-stone-50 dark:bg-neutral-900 rounded-lg border border-transparent hover:border-stone-200 dark:hover:border-neutral-800 transition-colors">
                                    <Globe className="h-8 w-8 text-amber-600 mb-4" />
                                    <h4 className="font-display text-xl text-stone-900 dark:text-white mb-2">International</h4>
                                    <p className="text-sm text-stone-500 dark:text-neutral-400 font-medium uppercase tracking-wide mb-1">7-14 Business Days</p>
                                    <p className="text-sm text-stone-600 dark:text-neutral-400">Calculated at checkout</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="font-display text-2xl text-stone-900 dark:text-white mb-6">Returns & Exchanges</h2>
                            <p className="text-stone-600 dark:text-neutral-400 mb-8 font-light leading-relaxed">
                                We want you to love your purchase. If you are not completely satisfied, you may return items within 30 days of delivery.
                                We aim to make the process as simple and seamless as possible.
                            </p>

                            <Accordion type="single" collapsible className="w-full space-y-4">
                                <AccordionItem value="item-1" className="border-stone-200 dark:border-neutral-800">
                                    <AccordionTrigger className="text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-500 hover:no-underline text-lg font-light">How do I initiate a return?</AccordionTrigger>
                                    <AccordionContent className="text-stone-600 dark:text-neutral-400 leading-relaxed">
                                        To initiate a return, please visit your account order history or contact our support team. You will receive a prepaid shipping label via email.
                                        Simply print the label, attach it to the package, and drop it off at the nearest courier partner location.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2" className="border-stone-200 dark:border-neutral-800">
                                    <AccordionTrigger className="text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-500 hover:no-underline text-lg font-light">What items are eligible for return?</AccordionTrigger>
                                    <AccordionContent className="text-stone-600 dark:text-neutral-400 leading-relaxed">
                                        Items must be unworn, unwashed, and in their original condition with tags attached.
                                        Customized items, underwear, and final sale items cannot be returned unless defective.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3" className="border-stone-200 dark:border-neutral-800">
                                    <AccordionTrigger className="text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-500 hover:no-underline text-lg font-light">When will I receive my refund?</AccordionTrigger>
                                    <AccordionContent className="text-stone-600 dark:text-neutral-400 leading-relaxed">
                                        Once we receive your return, please allow 5-7 business days for processing.
                                        Refunds will be issued to the original payment method. You will receive an email notification once the refund has been processed.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </motion.div>
                </div>
            </main>
        </PageLayout>
    );
}
