import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

export default function Press() {
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
                            Media & Features
                        </span>
                        <h1 className="font-display text-5xl md:text-7xl mb-6 dark:text-white">
                            Press
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 font-light text-lg max-w-2xl mx-auto">
                            For press inquiries, high-resolution imagery, or interview requests, please contact our media team at <a href="mailto:press@fabricspeaks.com" className="text-amber-600 hover:text-amber-500 transition-colors">press@fabricspeaks.com</a>.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="border-t border-stone-200 dark:border-neutral-800 pt-12">
                            <h3 className="font-display text-2xl text-stone-900 dark:text-white mb-8 text-center">Recent Features</h3>
                            <div className="space-y-6">
                                {[
                                    {
                                        publication: "Vogue Italia",
                                        title: "The Renaissance of Natural Fabrics",
                                        date: "October 2024"
                                    },
                                    {
                                        publication: "GQ Style",
                                        title: "Essential Winter Coats for the Modern Gentleman",
                                        date: "September 2024"
                                    },
                                    {
                                        publication: "Monocle",
                                        title: "Brand Watch: Fabric Speaks",
                                        date: "August 2024"
                                    }
                                ].map((item, index) => (
                                    <div key={index} className="group flex flex-col md:flex-row gap-4 md:items-center justify-between p-6 rounded-lg hover:bg-stone-50 dark:hover:bg-neutral-900 transition-colors duration-300 border border-transparent hover:border-stone-100 dark:hover:border-neutral-800">
                                        <div>
                                            <h4 className="font-display text-xl text-stone-900 dark:text-white mb-1">{item.publication}</h4>
                                            <p className="text-stone-600 dark:text-neutral-400 font-light italic">"{item.title}"</p>
                                        </div>
                                        <span className="text-sm text-stone-400 dark:text-neutral-500 font-medium tracking-wide uppercase">{item.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </PageLayout>
    );
}
