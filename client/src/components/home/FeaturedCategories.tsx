import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import editorialImg from "@assets/Men's_fashion_hero_editorial_7382b369.png";
import bootsImg from "@assets/Men's_black_Chelsea_boots_f0beca21.png";

export default function FeaturedCategories() {
    const [, setLocation] = useLocation();

    const categories = [
        {
            title: "Clothing",
            img: editorialImg,
            link: "/clothing",
            subtitle: "Ready-to-Wear Collection"
        },
        {
            title: "Accessories",
            img: bootsImg,
            link: "/accessories",
            subtitle: "The Perfect Finish"
        }
    ];

    return (
        <section className="py-24 bg-white dark:bg-black">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-display text-4xl md:text-5xl mb-4 dark:text-white">Curated Categories</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 font-light">Explore our defined aesthetic.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {categories.map((cat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2, duration: 0.8, ease: "easeOut" }}
                            onClick={() => setLocation(cat.link)}
                            className="group relative h-[700px] overflow-hidden cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                                <motion.img
                                    initial={{ scale: 1.1 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ duration: 1.5 }}
                                    src={cat.img}
                                    alt={cat.title}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                                <span className="text-xs font-bold tracking-[0.2em] uppercase mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                    {cat.subtitle}
                                </span>
                                <h3 className="font-display text-5xl md:text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-700">
                                    {cat.title}
                                </h3>
                                <Button
                                    variant="outline"
                                    className="border-white text-white hover:bg-white hover:text-black rounded-none px-10 py-4 uppercase tracking-widest text-xs opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100"
                                >
                                    Shop Now
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
