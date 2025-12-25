import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

export default function Sustainability() {
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
        </PageLayout>
    );
}
