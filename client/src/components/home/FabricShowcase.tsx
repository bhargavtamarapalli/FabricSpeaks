import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
const video1 = "/assets/Generative_Video_of_Lenin_Fabric.mp4";
import royalSatinImg from "@assets/Royal_Satin.png";
import egyptCottonImg from "@assets/Egypt_Cotton.png";
import merinoWoolImg from "@assets/Merino_Wool.png";

export default function FabricShowcase() {
    const [active, setActive] = useState(0);
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });
    const [, setLocation] = useLocation();

    const handleFabricClick = (fabricName: string) => {
        let query = fabricName;
        if (fabricName.includes("Satin")) query = "Satin";
        else if (fabricName.includes("Linen")) query = "Linen";
        else if (fabricName.includes("Cotton")) query = "Cotton";
        else if (fabricName.includes("Wool")) query = "Wool";

        setLocation(`/clothing?fabric=${query}`);
    };

    const yHeader = useTransform(scrollYProgress, [0, 0.5], [50, 0]);
    const opacityHeader = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

    const fabrics = [
        { name: "Royal Satin", origin: "Imported from Italy", img: royalSatinImg, desc: "Smooth, glossy surface with a luxurious drape." },
        { name: "Pure Linen", origin: "Belgian Flax", video: video1, desc: "Breathable, natural texture for effortless elegance." },
        { name: "Egyptian Cotton", origin: "Giza, Egypt", img: egyptCottonImg, desc: "The finest long-staple cotton for unmatched softness." },
        { name: "Merino Wool", origin: "Australian Highlands", img: merinoWoolImg, desc: "Temperature regulating, soft, and naturally elastic." },
    ];

    return (
        <section ref={ref} className="py-16 px-6 max-w-7xl mx-auto min-h-[80vh] flex flex-col justify-center">
            <motion.div
                style={{ y: yHeader, opacity: opacityHeader }}
                className="text-center mb-16"
            >
                <motion.span
                    initial={{ opacity: 0, letterSpacing: "0em" }}
                    whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
                    transition={{ duration: 1 }}
                    className="text-amber-600 font-bold uppercase text-sm mb-4 block"
                >
                    Premium Collection
                </motion.span>
                <h2 className="font-display text-5xl md:text-7xl mb-6 overflow-hidden dark:text-white">
                    <motion.span
                        initial={{ y: "100%" }}
                        whileInView={{ y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="block"
                    >
                        Our Fabric Collection
                    </motion.span>
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 font-serif-alt text-2xl italic max-w-2xl mx-auto">
                    "Touch is the first language we speak."
                </p>
            </motion.div>

            <div className="h-[600px] flex flex-col md:flex-row gap-4">
                {fabrics.map((fabric, i) => (
                    <motion.div
                        key={i}
                        layout
                        onClick={() => setActive(i)}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                        className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ease-quart-out ${active === i ? 'flex-[3]' : 'flex-[1]'} group shadow-2xl`}
                    >
                        <div className="absolute inset-0 overflow-hidden">
                            {fabric.video ? (
                                <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110">
                                    <source src={fabric.video} type="video/mp4" />
                                </video>
                            ) : (
                                <img
                                    src={fabric.img}
                                    alt={fabric.name}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                            )}
                        </div>
                        <div className={`absolute inset-0 bg-black/20 transition-colors duration-500 ${active === i ? 'bg-black/10' : 'group-hover:bg-black/30'}`} />
                        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                            <motion.div layout className="flex flex-col items-start">
                                <h3 className={`font-display text-white transition-all duration-500 ${active === i ? 'text-5xl mb-4 translate-y-0' : 'text-2xl md:-rotate-90 md:origin-bottom-left md:translate-x-12 md:mb-12 translate-y-0 origin-left'}`}>
                                    {fabric.name}
                                </h3>
                                <AnimatePresence>
                                    {active === i && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, y: 20 }}
                                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                                            exit={{ opacity: 0, height: 0, y: 20 }}
                                            transition={{ duration: 0.4, delay: 0.1 }}
                                        >
                                            <motion.p
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="text-amber-400 text-sm uppercase tracking-widest mb-2"
                                            >
                                                {fabric.origin}
                                            </motion.p>
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="text-white/90 font-light text-lg leading-relaxed max-w-md"
                                            >
                                                {fabric.desc}
                                            </motion.p>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className="text-white p-0 mt-4 h-auto hover:text-amber-400 transition-colors group-hover:translate-x-2 duration-300 text-base"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFabricClick(fabric.name);
                                                    }}
                                                >
                                                    Explore Fabric <ArrowRight className="ml-2 w-4 h-4" />
                                                </Button>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
