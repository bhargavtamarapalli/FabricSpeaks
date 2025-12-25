import { useLocation } from "wouter";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import TiltCard from "@/components/TiltCard";

const video1 = "/assets/Generative_Video_of_Lenin_Fabric.mp4";
const video2 = "/assets/Luxurious_Silk_Satin_Video_Generation.mp4";
import royalSatinImg from "@assets/Royal_Satin.png";
import egyptCottonImg from "@assets/Egypt_Cotton.png";
import merinoWoolImg from "@assets/Merino_Wool.png";

export default function Fabrics() {
    const [, setLocation] = useLocation();

    const fabrics = [
        {
            name: "Royal Satin",
            description: "Smooth, glossy surface with a luxurious drape. Imported from Italy.",
            image: royalSatinImg,
            video: video2,
            richness: "Evening Elegance"
        },
        {
            name: "Pure Linen",
            description: "Breathable, natural texture for effortless elegance. Sourced from Belgian Flax.",
            video: video1,
            richness: "Breathable Luxury"
        },
        {
            name: "Egyptian Cotton",
            description: "The finest long-staple cotton for unmatched softness. Sourced from Giza, Egypt.",
            image: egyptCottonImg,
            richness: "The Gold Standard"
        },
        {
            name: "Merino Wool",
            description: "Temperature regulating, soft, and naturally elastic. Sourced from Australian Highlands.",
            image: merinoWoolImg,
            richness: "Nature's Performance Fiber"
        }
    ];

    return (
        <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
            <main className="flex-1">
                <section className="py-24 px-6 bg-stone-50 dark:bg-neutral-900 border-b border-stone-100 dark:border-neutral-800">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="font-display text-5xl md:text-7xl mb-6 text-stone-900 dark:text-white"
                        >
                            The Art of Fabric
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-xl text-stone-600 dark:text-neutral-400 font-light leading-relaxed max-w-2xl mx-auto"
                        >
                            We believe that true luxury begins with the material. Explore the exquisite fabrics that define our collection.
                        </motion.p>
                    </div>
                </section>

                <section className="py-16 px-6">
                    <div className="max-w-7xl mx-auto space-y-24">
                        {fabrics.map((fabric, index) => (
                            <div
                                key={fabric.name}
                                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}
                            >
                                <div className="flex-1 w-full perspective-1000">
                                    <TiltCard className="aspect-[4/3] w-full">
                                        <div className="w-full h-full overflow-hidden rounded-lg shadow-xl relative">
                                            {fabric.video ? (
                                                <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                                    <source src={fabric.video} type="video/mp4" />
                                                </video>
                                            ) : (
                                                <img
                                                    src={fabric.image}
                                                    alt={fabric.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors duration-300" />
                                        </div>
                                    </TiltCard>
                                </div>
                                <motion.div
                                    initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="flex-1 space-y-6 text-center md:text-left"
                                >
                                    <h2 className="font-display text-4xl md:text-5xl text-stone-900 dark:text-white">{fabric.name}</h2>
                                    <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em]">{fabric.richness}</h3>
                                    <p className="text-stone-600 dark:text-neutral-400 leading-relaxed text-lg font-light">
                                        {fabric.description}
                                    </p>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </PageLayout>
    );
}
