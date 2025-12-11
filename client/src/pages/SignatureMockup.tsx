import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ChevronRight, ChevronLeft } from "lucide-react";

// Assets (reusing existing ones for demo)
import coatImg from "@assets/Men's_camel_cashmere_overcoat_939b4b8d.png";
import editorialImg from "@assets/Men's_fashion_hero_editorial_7382b369.png";
import suitImg from "@assets/Men's_charcoal_wool_blazer_af4c6c92.png"; // Assuming this exists or reusing another
import sweaterImg from "@assets/Men's_navy_merino_sweater_266e4eb2.png";

const signatureItems = [
    {
        id: 1,
        title: "The Camel Cashmere Overcoat",
        price: "$1,250",
        desc: "Crafted from 100% Mongolian cashmere, double-faced for unlined comfort.",
        image: coatImg,
        tag: "Best Seller"
    },
    {
        id: 2,
        title: "Italian Wool Structure Blazer",
        price: "$895",
        desc: "Neapolitan tailoring meets modern structure. Super 150s wool.",
        image: suitImg,
        tag: "New Season"
    },
    {
        id: 3,
        title: "Merino Roll-Neck Sweater",
        price: "$245",
        desc: "Fine gauge merino wool, perfect for layering or wearing solo.",
        image: sweaterImg,
        tag: "Essential"
    },
    {
        id: 4,
        title: "The Modern Trench",
        price: "$1,100",
        desc: "Water-resistant cotton gabardine with a contemporary silhouette.",
        image: editorialImg,
        tag: "Limited Edition"
    }
];

// --- Version 1: Classic Split Slider ---
// A clean, high-end slider with image on one side and text on the other. 
// Similar to the current product description but swipeable.
function SignatureSliderV1() {
    const [current, setCurrent] = useState(0);

    const next = () => setCurrent((prev) => (prev + 1) % signatureItems.length);
    const prev = () => setCurrent((prev) => (prev - 1 + signatureItems.length) % signatureItems.length);

    return (
        <div className="bg-[#F5F5F0] py-20 px-6 min-h-[80vh] flex items-center justify-center">
            <div className="max-w-6xl w-full mx-auto relative">
                <div className="absolute top-1/2 -translate-y-1/2 -left-12 z-10 hidden md:block">
                    <button onClick={prev} className="p-3 rounded-full border border-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -right-12 z-10 hidden md:block">
                    <button onClick={next} className="p-3 rounded-full border border-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col md:flex-row gap-12 items-center"
                        >
                            <div className="w-full md:w-1/2 bg-white p-8 md:p-12 shadow-xl relative">
                                <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest bg-neutral-900 text-white px-3 py-1">
                                    {signatureItems[current].tag}
                                </span>
                                <img
                                    src={signatureItems[current].image}
                                    alt={signatureItems[current].title}
                                    className="w-full h-[400px] object-contain"
                                />
                            </div>
                            <div className="w-full md:w-1/2 space-y-6">
                                <div className="flex items-center gap-4">
                                    <span className="text-amber-600 font-medium tracking-widest text-xs uppercase">
                                        Signature Piece {current + 1}/{signatureItems.length}
                                    </span>
                                    <div className="h-px bg-neutral-300 flex-1" />
                                </div>
                                <h2 className="font-display text-4xl md:text-5xl text-neutral-900 leading-tight">
                                    {signatureItems[current].title}
                                </h2>
                                <p className="text-neutral-600 text-lg font-light leading-relaxed">
                                    {signatureItems[current].desc}
                                </p>
                                <div className="pt-4 flex items-center gap-8">
                                    <span className="font-display text-2xl">{signatureItems[current].price}</span>
                                    <Button className="bg-neutral-900 text-white px-8 py-6 rounded-none hover:bg-neutral-800">
                                        Add to Bag
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Mobile Controls */}
                <div className="flex justify-center gap-4 mt-8 md:hidden">
                    <button onClick={prev} className="p-2 border rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={next} className="p-2 border rounded-full"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
}

// --- Version 2: Card Carousel (3D-ish) ---
// Shows multiple items, center focused. Good for browsing.
function SignatureSliderV2() {
    const [current, setCurrent] = useState(0);

    const next = () => setCurrent((prev) => (prev + 1) % signatureItems.length);
    const prev = () => setCurrent((prev) => (prev - 1 + signatureItems.length) % signatureItems.length);

    // Calculate indices for visible items (prev, current, next)
    const getIndex = (offset: number) => {
        return (current + offset + signatureItems.length) % signatureItems.length;
    };

    return (
        <div className="bg-neutral-900 py-20 px-6 min-h-[80vh] flex flex-col justify-center overflow-hidden">
            <div className="text-center mb-16">
                <span className="text-amber-500 font-bold tracking-widest text-xs uppercase mb-4 block">The Collection</span>
                <h2 className="font-display text-4xl md:text-5xl text-white">Signature Pieces</h2>
            </div>

            <div className="relative max-w-5xl mx-auto w-full h-[500px] flex items-center justify-center perspective-1000">
                {/* Previous Item (Left) */}
                <motion.div
                    className="absolute left-0 md:left-10 w-[280px] md:w-[350px] h-[450px] bg-neutral-800 opacity-40 scale-90 z-0 cursor-pointer"
                    onClick={prev}
                    animate={{ x: "-50%", scale: 0.85, opacity: 0.4, zIndex: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <img src={signatureItems[getIndex(-1)].image} className="w-full h-full object-cover grayscale" />
                </motion.div>

                {/* Next Item (Right) */}
                <motion.div
                    className="absolute right-0 md:right-10 w-[280px] md:w-[350px] h-[450px] bg-neutral-800 opacity-40 scale-90 z-0 cursor-pointer"
                    onClick={next}
                    animate={{ x: "50%", scale: 0.85, opacity: 0.4, zIndex: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <img src={signatureItems[getIndex(1)].image} className="w-full h-full object-cover grayscale" />
                </motion.div>

                {/* Current Item (Center) */}
                <motion.div
                    key={current}
                    className="absolute w-[300px] md:w-[400px] h-[550px] bg-white shadow-2xl z-20 overflow-hidden"
                    layoutId="activeCard"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1, x: 0, zIndex: 20 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="h-[65%] bg-neutral-100 relative">
                        <img src={signatureItems[current].image} className="w-full h-full object-cover" />
                        <div className="absolute top-4 right-4 bg-black text-white text-xs px-2 py-1 uppercase tracking-widest">
                            {signatureItems[current].tag}
                        </div>
                    </div>
                    <div className="h-[35%] p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="font-display text-2xl mb-2">{signatureItems[current].title}</h3>
                            <p className="text-sm text-neutral-500 line-clamp-2">{signatureItems[current].desc}</p>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <span className="font-medium">{signatureItems[current].price}</span>
                            <button className="text-xs uppercase font-bold tracking-widest border-b border-black pb-1">Shop Now</button>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="flex justify-center gap-4 mt-12">
                <button onClick={prev} className="w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                <button onClick={next} className="w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"><ArrowRight className="w-5 h-5" /></button>
            </div>
        </div>
    );
}

// --- Version 3: Spotlight List ---
// A list of titles on the left, large changing image on the right. 
// Very editorial and premium.
function SignatureSliderV3() {
    const [active, setActive] = useState(0);

    return (
        <div className="bg-white py-20 px-6 min-h-[80vh] flex items-center">
            <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-12 md:gap-24">

                {/* Left: List */}
                <div className="w-full md:w-1/3 flex flex-col justify-center space-y-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Curated Selection</span>
                        <h2 className="font-display text-3xl mb-8">Signature Pieces</h2>
                    </div>

                    <div className="space-y-2">
                        {signatureItems.map((item, index) => (
                            <div
                                key={item.id}
                                onMouseEnter={() => setActive(index)}
                                className={`cursor-pointer transition-all duration-300 group ${active === index ? 'pl-4 border-l-2 border-black' : 'pl-0 border-l-2 border-transparent opacity-50 hover:opacity-100'}`}
                            >
                                <h3 className={`font-display text-2xl mb-1 ${active === index ? 'text-black' : 'text-neutral-500'}`}>
                                    {item.title}
                                </h3>
                                <AnimatePresence>
                                    {active === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-sm text-neutral-600 py-2">{item.desc}</p>
                                            <p className="font-medium text-sm mt-1">{item.price}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8">
                        <Button variant="outline" className="rounded-none border-black text-black hover:bg-black hover:text-white transition-colors px-8">
                            View All Collection
                        </Button>
                    </div>
                </div>

                {/* Right: Image Display */}
                <div className="w-full md:w-2/3 relative h-[600px] bg-neutral-100 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="absolute inset-0"
                        >
                            <img src={signatureItems[active].image} className="w-full h-full object-cover" alt={signatureItems[active].title} />
                            <div className="absolute inset-0 bg-black/10" />
                        </motion.div>
                    </AnimatePresence>

                    <div className="absolute bottom-8 right-8 z-10">
                        <span className="text-white font-display text-8xl opacity-20">0{active + 1}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function SignatureMockup() {
    const [version, setVersion] = useState(0);

    return (
        <div className="min-h-screen flex flex-col font-sans">
            {/* Control Panel */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md text-white px-6 py-3 rounded-full flex gap-4 shadow-2xl border border-white/20">
                <span className="text-xs font-bold uppercase tracking-widest self-center mr-2 text-neutral-400">Carousel Ver:</span>
                <button
                    onClick={() => setVersion(0)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${version === 0 ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                >
                    Classic Split
                </button>
                <button
                    onClick={() => setVersion(1)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${version === 1 ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                >
                    3D Cards
                </button>
                <button
                    onClick={() => setVersion(2)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${version === 2 ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                >
                    Spotlight List
                </button>
            </div>

            <div className="flex-1">
                {version === 0 && <SignatureSliderV1 />}
                {version === 1 && <SignatureSliderV2 />}
                {version === 2 && <SignatureSliderV3 />}
            </div>
        </div>
    );
}
