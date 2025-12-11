import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShoppingBag, Play, ChevronLeft, ChevronRight, Star, Heart } from "lucide-react";

// Assets
const video1 = "/assets/Generative_Video_of_Lenin_Fabric.mp4";
const video2 = "/assets/Luxurious_Silk_Satin_Video_Generation.mp4";
import editorialImg from "@assets/Men's_fashion_hero_editorial_7382b369.png";
import coatImg from "@assets/Men's_camel_cashmere_overcoat_939b4b8d.png";
import blazerImg from "@assets/Men's_charcoal_wool_blazer_af4c6c92.png";
import logoImg from "@assets/logo_spider.png";
import cottonImg from "@assets/Men's_white_Oxford_shirt_573f333c.png";
import woolImg from "@assets/Men's_navy_merino_sweater_266e4eb2.png";
import silkImg from "@assets/Silk_saree_gold_embroidery.png";
import trousersImg from "@assets/Men's_grey_tailored_trousers_64b68ccd.png";
import bootsImg from "@assets/Men's_black_Chelsea_boots_f0beca21.png";

// --- Types ---
type FabricDesign = 'grid' | 'carousel' | 'interactive';
type BridgeConcept = 'marquee' | 'manifesto' | 'overlap' | 'fade';

export default function DesignMockup() {
    const [fabricDesign, setFabricDesign] = useState<FabricDesign>('interactive');
    const [bridgeConcept, setBridgeConcept] = useState<BridgeConcept>('marquee');

    return (
        <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 overflow-x-hidden">
            {/* Font Import */}
            <style>
                {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
          
          .font-display { font-family: 'Playfair Display', serif; }
          .font-serif-alt { font-family: 'Cormorant Garamond', serif; }
          .font-body { font-family: 'Inter', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
            </style>

            {/* Control Panel */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center max-w-[95vw]">
                {/* Fabric Layout Controls */}
                <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-neutral-200 flex gap-4 items-center overflow-x-auto w-full no-scrollbar justify-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Layout:</span>
                    <div className="flex gap-1">
                        <button onClick={() => setFabricDesign('interactive')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${fabricDesign === 'interactive' ? "bg-black text-white" : "hover:bg-neutral-100 text-neutral-600"}`}>Interactive</button>
                        <button onClick={() => setFabricDesign('grid')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${fabricDesign === 'grid' ? "bg-black text-white" : "hover:bg-neutral-100 text-neutral-600"}`}>Grid</button>
                        <button onClick={() => setFabricDesign('carousel')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${fabricDesign === 'carousel' ? "bg-black text-white" : "hover:bg-neutral-100 text-neutral-600"}`}>Carousel</button>
                    </div>
                </div>

                {/* Bridge Concept Controls */}
                <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-neutral-200 flex gap-4 items-center overflow-x-auto w-full no-scrollbar justify-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Transition:</span>
                    <div className="flex gap-1">
                        <button onClick={() => setBridgeConcept('marquee')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${bridgeConcept === 'marquee' ? "bg-amber-600 text-white" : "hover:bg-neutral-100 text-neutral-600"}`}>Marquee</button>
                        <button onClick={() => setBridgeConcept('manifesto')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${bridgeConcept === 'manifesto' ? "bg-amber-600 text-white" : "hover:bg-neutral-100 text-neutral-600"}`}>Manifesto</button>
                        <button onClick={() => setBridgeConcept('overlap')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${bridgeConcept === 'overlap' ? "bg-amber-600 text-white" : "hover:bg-neutral-100 text-neutral-600"}`}>Overlap</button>
                        <button onClick={() => setBridgeConcept('fade')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${bridgeConcept === 'fade' ? "bg-amber-600 text-white" : "hover:bg-neutral-100 text-neutral-600"}`}>Fade</button>
                    </div>
                </div>
            </div>

            {/* Brand Logo */}
            <BrandLogo />

            {/* Hero Section */}
            <div className="relative">
                <HeroVersion5 />
                {/* Fade Overlay Concept */}
                {bridgeConcept === 'fade' && (
                    <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-neutral-50 via-neutral-50/80 to-transparent z-10 pointer-events-none" />
                )}
            </div>

            {/* Bridge Sections */}
            {bridgeConcept === 'marquee' && <MarqueeBridge />}
            {bridgeConcept === 'manifesto' && <ManifestoBridge />}

            {/* Fabric Showcase Variations */}
            <div className={`bg-neutral-50 relative z-10 transition-all duration-500 ${bridgeConcept === 'overlap' ? '-mt-32 pt-12' : ''}`}>
                <AnimatePresence mode="wait">
                    {fabricDesign === 'grid' && <FabricShowcaseGrid key="grid" />}
                    {fabricDesign === 'carousel' && <FabricShowcaseCarousel key="carousel" />}
                    {fabricDesign === 'interactive' && <FabricShowcaseInteractive key="interactive" />}
                </AnimatePresence>
            </div>

            {/* Rest of Home Page Sections */}
            <NewArrivals />
            <ProductDescription />
            <Newsletter />
            <Footer />
        </div>
    );
}

// --- Shared Components ---

function BrandLogo() {
    return (
        <div className="fixed top-6 left-6 z-40 flex items-center gap-3 mix-blend-difference text-white">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-white/30 shadow-2xl bg-black/40 backdrop-blur-sm flex-shrink-0">
                <img src={logoImg} alt="Fabric Speaks Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <div className="flex flex-col">
                <span className="font-display text-xl tracking-wide font-bold leading-none text-white drop-shadow-md">FABRIC</span>
                <span className="font-display text-xl tracking-wide font-bold leading-none text-white drop-shadow-md">SPEAKS</span>
            </div>
        </div>
    );
}

// --- Bridge Concepts ---

// 1. Marquee Bridge
function MarqueeBridge() {
    return (
        <div className="bg-black text-white py-4 overflow-hidden border-t border-white/10 border-b border-black relative z-20">
            <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="flex whitespace-nowrap gap-12 items-center"
            >
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-12">
                        <span className="text-sm uppercase tracking-[0.3em] font-medium text-neutral-400">Sustainable Luxury</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-sm uppercase tracking-[0.3em] font-medium text-neutral-400">Handcrafted in Italy</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-sm uppercase tracking-[0.3em] font-medium text-neutral-400">Timeless Design</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-sm uppercase tracking-[0.3em] font-medium text-neutral-400">Premium Materials</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

// 2. Manifesto Bridge (Parallax Quote)
function ManifestoBridge() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

    return (
        <section ref={ref} className="relative py-32 overflow-hidden flex items-center justify-center bg-neutral-900 text-white">
            {/* Background Texture with Parallax */}
            <motion.div style={{ y }} className="absolute inset-0 opacity-20">
                <img src={editorialImg} className="w-full h-full object-cover blur-sm scale-110" />
            </motion.div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Star className="w-8 h-8 text-amber-500 mx-auto mb-8" fill="currentColor" />
                    <h2 className="font-display text-4xl md:text-6xl leading-tight mb-8">
                        "Quality is not an act, it is a habit. We believe in the poetry of material and the language of touch."
                    </h2>
                    <p className="text-sm uppercase tracking-[0.3em] text-neutral-400">The Fabric Speaks Philosophy</p>
                </motion.div>
            </div>
        </section>
    );
}

// --- Hero Version 5 ---
function HeroVersion5() {
    const slides = [
        { type: 'video', src: video1, title: "Natural Linen", subtitle: "Breathable Luxury" },
        { type: 'image', src: coatImg, title: "Cashmere Warmth", subtitle: "Winter Essentials" },
        { type: 'video', src: video2, title: "Royal Satin", subtitle: "Evening Elegance" },
        { type: 'image', src: editorialImg, title: "Modern Tailoring", subtitle: "The New Silhouette" },
    ];

    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    return (
        <motion.section className="relative h-screen w-full overflow-hidden bg-black">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0"
                >
                    {slides[current].type === 'video' ? (
                        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80">
                            <source src={slides[current].src} type="video/mp4" />
                        </video>
                    ) : (
                        <img src={slides[current].src} className="w-full h-full object-cover opacity-80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-20 left-12 z-20 text-white">
                <motion.div key={current} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                    <p className="text-amber-400 uppercase tracking-widest text-sm mb-2">{slides[current].subtitle}</p>
                    <h1 className="font-display text-6xl md:text-8xl">{slides[current].title}</h1>
                </motion.div>
            </div>

            <div className="absolute bottom-12 left-12 z-20 flex gap-4">
                {slides.map((_, i) => (
                    <div key={i} className="h-1 w-16 bg-white/20 rounded-full overflow-hidden">
                        {i === current && (
                            <motion.div
                                layoutId="progress"
                                className="h-full bg-white"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </motion.section>
    );
}

// --- Fabric Showcase Variations ---

const fabrics = [
    { name: "Royal Satin", origin: "Imported from Italy", img: silkImg, desc: "Smooth, glossy surface with a luxurious drape." },
    { name: "Pure Linen", origin: "Belgian Flax", video: video1, desc: "Breathable, natural texture for effortless elegance." },
    { name: "Egyptian Cotton", origin: "Giza, Egypt", img: cottonImg, desc: "The finest long-staple cotton for unmatched softness." },
    { name: "Merino Wool", origin: "Australian Highlands", img: woolImg, desc: "Temperature regulating, soft, and naturally elastic." },
];

// V3: Interactive Cards (Enhanced with Parallax & Animations)
function FabricShowcaseInteractive() {
    const [active, setActive] = useState(0);
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Parallax effect for the heading
    const yHeader = useTransform(scrollYProgress, [0, 0.5], [50, 0]);
    const opacityHeader = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

    return (
        <section ref={ref} className="py-16 px-6 max-w-7xl mx-auto min-h-[80vh] flex flex-col justify-center">
            {/* Animated Header */}
            <motion.div
                style={{ y: yHeader, opacity: opacityHeader }}
                className="text-center mb-20"
            >
                <motion.span
                    initial={{ opacity: 0, letterSpacing: "0em" }}
                    whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
                    transition={{ duration: 1 }}
                    className="text-amber-600 font-bold uppercase text-sm mb-4 block"
                >
                    Premium Collection
                </motion.span>
                <h2 className="font-display text-5xl md:text-7xl mb-6 overflow-hidden">
                    <motion.span
                        initial={{ y: "100%" }}
                        whileInView={{ y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="block"
                    >
                        Our Fabric Collection
                    </motion.span>
                </h2>
                <p className="text-neutral-500 font-serif-alt text-2xl italic max-w-2xl mx-auto">
                    "Touch is the first language we speak."
                </p>
            </motion.div>

            {/* Interactive Cards */}
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
                        className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${active === i ? 'flex-[3]' : 'flex-[1]'} group shadow-2xl`}
                    >
                        {/* Image with Parallax/Zoom effect on Hover */}
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

                        {/* Overlays */}
                        <div className={`absolute inset-0 bg-black/20 transition-colors duration-500 ${active === i ? 'bg-black/10' : 'group-hover:bg-black/30'}`} />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                            <motion.div layout className="flex flex-col items-start">
                                {/* Rotated Text for Inactive State (Desktop) */}
                                <h3 className={`font-display text-white transition-all duration-500 ${active === i ? 'text-5xl mb-4 translate-y-0' : 'text-2xl md:-rotate-90 md:origin-bottom-left md:translate-x-12 md:mb-12 translate-y-0 origin-left'}`}>
                                    {fabric.name}
                                </h3>

                                {/* Expanded Content */}
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
                                                <Button variant="link" className="text-white p-0 mt-4 h-auto hover:text-amber-400 transition-colors group-hover:translate-x-2 duration-300 text-base">
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

// V1: Modern Grid (Clean, Minimal)
function FabricShowcaseGrid() {
    return (
        <section className="py-16 px-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
            >
                <h2 className="font-display text-4xl md:text-5xl mb-4">The Fabric Library</h2>
                <p className="text-neutral-500 font-serif-alt text-xl italic">Sourced from the world's finest mills.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {fabrics.map((fabric, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                        className="group relative h-[400px] overflow-hidden"
                    >
                        {fabric.video ? (
                            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                                <source src={fabric.video} type="video/mp4" />
                            </video>
                        ) : (
                            <img src={fabric.img} alt={fabric.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                            <h3 className="font-display text-4xl mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{fabric.name}</h3>
                            <p className="text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{fabric.origin}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

// V2: Cinematic Carousel (Immersive)
function FabricShowcaseCarousel() {
    return (
        <section className="py-16 bg-neutral-900 text-white overflow-hidden">
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="px-6 mb-12 max-w-7xl mx-auto"
            >
                <h2 className="font-display text-4xl md:text-5xl mb-2">Textile Innovation</h2>
                <p className="text-neutral-400">Swipe to explore our premium materials.</p>
            </motion.div>
            <div className="flex gap-8 overflow-x-auto px-6 pb-12 no-scrollbar snap-x snap-mandatory">
                {fabrics.map((fabric, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                        className="min-w-[80vw] md:min-w-[600px] snap-center relative h-[500px] rounded-2xl overflow-hidden group"
                    >
                        {fabric.video ? (
                            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity">
                                <source src={fabric.video} type="video/mp4" />
                            </video>
                        ) : (
                            <img src={fabric.img} alt={fabric.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                        )}
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full bg-gradient-to-t from-black to-transparent">
                            <p className="text-amber-500 text-sm uppercase tracking-widest mb-2">{fabric.origin}</p>
                            <h3 className="font-display text-5xl mb-4">{fabric.name}</h3>
                            <p className="text-lg font-light text-neutral-300 max-w-md">{fabric.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

// --- New Arrivals Section ---
function NewArrivals() {
    const products = [
        { name: "Merino Wool Sweater", price: "$185", img: woolImg },
        { name: "Tailored Linen Trousers", price: "$220", img: trousersImg },
        { name: "Oxford Cotton Shirt", price: "$145", img: cottonImg },
        { name: "Chelsea Boots", price: "$350", img: bootsImg },
    ];

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-between items-end mb-12"
                >
                    <h2 className="font-display text-4xl md:text-5xl">New Arrivals</h2>
                    <a href="#" className="text-sm uppercase tracking-widest border-b border-black pb-1 hover:text-neutral-600 transition-colors">View All</a>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                            className="group cursor-pointer"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 mb-4">
                                <img src={product.img} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <button className="absolute top-4 right-4 p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-neutral-100">
                                    <Heart size={18} />
                                </button>
                                <button className="absolute bottom-0 left-0 w-full bg-black text-white py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 font-medium text-sm uppercase tracking-wide">
                                    Quick Add
                                </button>
                            </div>
                            <h3 className="font-display text-xl mb-1">{product.name}</h3>
                            <p className="text-neutral-500 font-body text-sm">{product.price}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- Product Description (Signature Piece) ---
function ProductDescription() {
    return (
        <section className="py-16 bg-[#F5F5F0]">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="w-full md:w-1/2 relative"
                >
                    <div className="absolute top-4 left-4 z-10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest">Best Seller</div>
                    <img src={coatImg} alt="Product Detail" className="w-full h-auto shadow-2xl" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full md:w-1/2"
                >
                    <span className="text-amber-600 font-medium tracking-widest text-xs uppercase mb-4 block">Signature Piece</span>
                    <h2 className="font-display text-4xl md:text-6xl mb-6 text-neutral-900">The Camel Cashmere Overcoat</h2>
                    <div className="space-y-6 text-neutral-600 font-body font-light leading-relaxed text-lg">
                        <p>Crafted from 100% Mongolian cashmere, this overcoat represents the pinnacle of our collection. The fabric is double-faced, meaning two layers of cashmere are hand-stitched together for unlined comfort and exceptional warmth without the weight.</p>
                        <p>Featuring a modern tailored fit that accommodates layers underneath, it is finished with genuine horn buttons and a hand-sewn silk label. A timeless investment for the discerning gentleman.</p>
                    </div>
                    <div className="mt-10 grid grid-cols-2 gap-8 border-t border-neutral-300 pt-8">
                        <div><h4 className="font-serif-alt text-xl text-neutral-900 mb-2">Care</h4><p className="text-sm text-neutral-500">Dry clean only. Store in a breathable garment bag.</p></div>
                        <div><h4 className="font-serif-alt text-xl text-neutral-900 mb-2">Fit</h4><p className="text-sm text-neutral-500">True to size. Model is 6'1" wearing size 40R.</p></div>
                    </div>
                    <div className="mt-10 flex gap-4">
                        <Button className="bg-neutral-900 text-white px-10 py-7 rounded-none hover:bg-neutral-800 text-lg">Add to Bag - $1,250</Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// --- Newsletter ---
function Newsletter() {
    return (
        <section className="py-16 bg-neutral-900 text-white text-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl mx-auto px-6"
            >
                <h2 className="font-display text-3xl md:text-4xl mb-4">Join the Inner Circle</h2>
                <p className="text-neutral-400 mb-8 font-light">Subscribe to receive early access to new collections and exclusive events.</p>
                <div className="flex flex-col md:flex-row gap-4">
                    <input type="email" placeholder="Enter your email address" className="flex-1 bg-transparent border-b border-white/30 py-3 px-4 focus:outline-none focus:border-white transition-colors text-white placeholder:text-neutral-600" />
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-3 rounded-none uppercase tracking-widest text-xs">Subscribe</Button>
                </div>
            </motion.div>
        </section>
    );
}

// --- Footer ---
function Footer() {
    return (
        <footer className="bg-black text-white py-16 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-1">
                    <h3 className="font-display text-2xl mb-6">Fabric Speaks</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">Redefining modern luxury through exceptional materials and timeless design.</p>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-neutral-400">Shop</h4>
                    <ul className="space-y-4 text-sm text-neutral-300">
                        <li><a href="#" className="hover:text-white">New Arrivals</a></li>
                        <li><a href="#" className="hover:text-white">Clothing</a></li>
                        <li><a href="#" className="hover:text-white">Accessories</a></li>
                        <li><a href="#" className="hover:text-white">Fabrics</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-neutral-400">Support</h4>
                    <ul className="space-y-4 text-sm text-neutral-300">
                        <li><a href="#" className="hover:text-white">Contact Us</a></li>
                        <li><a href="#" className="hover:text-white">Shipping & Returns</a></li>
                        <li><a href="#" className="hover:text-white">Size Guide</a></li>
                        <li><a href="#" className="hover:text-white">FAQ</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-neutral-400">Social</h4>
                    <ul className="space-y-4 text-sm text-neutral-300">
                        <li><a href="#" className="hover:text-white">Instagram</a></li>
                        <li><a href="#" className="hover:text-white">Twitter</a></li>
                        <li><a href="#" className="hover:text-white">Pinterest</a></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-600">
                <p>&copy; 2025 Fabric Speaks. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
