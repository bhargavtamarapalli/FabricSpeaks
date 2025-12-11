import { Gem, Scissors, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function BrandPromise() {
    const features = [
        {
            icon: <Gem className="w-6 h-6" />,
            title: "Premium Fabrics",
            desc: "Sourced from the world's finest mills."
        },
        {
            icon: <Scissors className="w-6 h-6" />,
            title: "Expert Tailoring",
            desc: "Handcrafted with precision and care."
        },
        {
            icon: <Clock className="w-6 h-6" />,
            title: "Timeless Design",
            desc: "Styles that transcend fleeting trends."
        }
    ];

    return (
        <section className="py-24 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative">
                {/* Connecting Line (Desktop Only) */}
                <div className="hidden md:block absolute top-[4.5rem] left-[16%] w-[68%] h-0.5 bg-neutral-200 dark:bg-neutral-800 -z-0">
                    <motion.div
                        initial={{ width: "0%" }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 2, ease: "linear", delay: 0.2 }}
                        className="h-full bg-amber-500 origin-left"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative z-10">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.8 + 0.2, duration: 0.4, type: "spring" }} // Staggered to match line progress
                            className="flex flex-col items-center group"
                        >
                            <motion.div
                                whileInView={{
                                    backgroundColor: ["#ffffff", "#f59e0b", "#ffffff"],
                                    color: ["#d97706", "#ffffff", "#d97706"],
                                    scale: [1, 1.2, 1]
                                }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.8 + 0.6, duration: 0.6 }}
                                className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 border-4 border-neutral-50 dark:border-neutral-900 flex items-center justify-center mb-6 shadow-lg text-amber-600 z-10 transition-colors duration-500"
                            >
                                {f.icon}
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.8 + 0.5 }}
                            >
                                <h3 className="font-display text-xl mb-2 dark:text-white">{f.title}</h3>
                                <p className="text-neutral-500 dark:text-neutral-400 font-light text-sm max-w-xs mx-auto">{f.desc}</p>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
