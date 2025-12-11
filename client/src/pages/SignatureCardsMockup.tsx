import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, X } from "lucide-react";

// Assets
import coatImg from "@assets/Men's_camel_cashmere_overcoat_939b4b8d.png";
import editorialImg from "@assets/Men's_fashion_hero_editorial_7382b369.png";
import suitImg from "@assets/Men's_charcoal_wool_blazer_af4c6c92.png";
import sweaterImg from "@assets/Men's_navy_merino_sweater_266e4eb2.png";
import FabricSpeaksLogoV4 from "@/components/FabricSpeaksLogoV4";

const items = [
    { id: 1, title: "Camel Overcoat", price: "$1,250", img: coatImg, tag: "Signature" },
    { id: 2, title: "Wool Blazer", price: "$895", img: suitImg, tag: "New" },
    { id: 3, title: "Merino Sweater", price: "$245", img: sweaterImg, tag: "Essential" },
    { id: 4, title: "Modern Trench", price: "$1,100", img: editorialImg, tag: "Limited" },
];

// --- Style 1: Apple Wallet Stack (Vertical) ---
function WalletStack() {
    const [expanded, setExpanded] = useState<number | null>(null);

    return (
        <div className="min-h-[80vh] bg-neutral-100 flex items-center justify-center py-20">
            <div className="relative w-[350px] h-[600px]">
                {items.map((item, index) => {
                    const isExpanded = expanded === index;
                    const isOtherExpanded = expanded !== null && expanded !== index;

                    return (
                        <motion.div
                            key={item.id}
                            onClick={() => setExpanded(isExpanded ? null : index)}
                            initial={false}
                            animate={{
                                top: isExpanded ? 0 : index * 60,
                                scale: isExpanded ? 1 : isOtherExpanded ? 0.9 : 1 - index * 0.05,
                                zIndex: isExpanded ? 50 : items.length - index,
                                opacity: isOtherExpanded ? 0 : 1
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute top-0 left-0 w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl cursor-pointer origin-top bg-white"
                            style={{ transformOrigin: "top center" }}
                        >
                            <div className="relative h-full">
                                <img src={item.img} className="w-full h-full object-cover" alt={item.title} />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

                                <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20">
                                        {item.tag}
                                    </span>
                                    {isExpanded && (
                                        <button onClick={(e) => { e.stopPropagation(); setExpanded(null); }} className="bg-white/20 p-2 rounded-full text-white hover:bg-white hover:text-black transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="absolute bottom-0 left-0 w-full p-8 text-white transform transition-transform duration-500">
                                    <h3 className="font-display text-3xl mb-2">{item.title}</h3>
                                    <div className="flex justify-between items-end">
                                        <p className="text-lg opacity-90">{item.price}</p>
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 20 }}
                                                >
                                                    <Button className="bg-white text-black hover:bg-neutral-200 rounded-full px-6">
                                                        Shop Now
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            <div className="absolute bottom-10 text-neutral-400 text-sm uppercase tracking-widest">
                Tap a card to expand
            </div>
        </div>
    );
}

// --- Style 2: 3D Flip Cards (Grid) ---
function FlipCards() {
    return (
        <div className="min-h-[80vh] bg-neutral-900 flex items-center justify-center py-20 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {items.map((item) => (
                    <div key={item.id} className="group h-[500px] w-full [perspective:1000px]">
                        <div className="relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                            {/* Front */}
                            <div className="absolute inset-0 h-full w-full rounded-2xl overflow-hidden shadow-xl [backface-visibility:hidden]">
                                <img src={item.img} className="w-full h-full object-cover" alt={item.title} />
                                <div className="absolute inset-0 bg-black/20" />
                                <div className="absolute bottom-6 left-6 text-white">
                                    <h3 className="font-display text-2xl">{item.title}</h3>
                                    <p className="text-sm opacity-80">{item.price}</p>
                                </div>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 h-full w-full rounded-2xl bg-white p-8 text-neutral-900 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-between">
                                <div>
                                    <span className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-4 block">{item.tag}</span>
                                    <h3 className="font-display text-3xl mb-4">{item.title}</h3>
                                    <p className="text-neutral-600 leading-relaxed">
                                        Expertly crafted for the modern gentleman. This signature piece embodies timeless elegance and superior quality.
                                    </p>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-6 border-t border-neutral-200 pt-4">
                                        <span className="font-medium">Price</span>
                                        <span className="font-bold text-xl">{item.price}</span>
                                    </div>
                                    <Button className="w-full bg-black text-white hover:bg-neutral-800 py-6 text-lg">
                                        Add to Bag
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Style 3: Parallax Tilt Card (Single Focus) ---
function TiltCard({ item }: { item: typeof items[0] }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    return (
        <motion.div
            style={{ x, y, rotateX, rotateY, z: 100 }}
            drag
            dragElastic={0.1}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            whileHover={{ cursor: "grabbing" }}
            className="relative w-[320px] h-[480px] rounded-2xl bg-white shadow-2xl overflow-hidden shrink-0"
        >
            <div
                style={{ transform: "translateZ(50px)" }}
                className="absolute inset-0 preserve-3d"
            >
                <img src={item.img} className="w-full h-full object-cover pointer-events-none" alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <div className="absolute bottom-8 left-8 text-white pointer-events-none">
                    <motion.span
                        style={{ transform: "translateZ(30px)" }}
                        className="text-xs font-bold uppercase tracking-widest mb-2 block text-amber-400"
                    >
                        {item.tag}
                    </motion.span>
                    <motion.h3
                        style={{ transform: "translateZ(20px)" }}
                        className="font-display text-3xl"
                    >
                        {item.title}
                    </motion.h3>
                </div>
            </div>
        </motion.div>
    );
}

function ParallaxShowcase() {
    return (
        <div className="min-h-[80vh] bg-[#E5E5E5] flex items-center justify-center overflow-hidden py-20">
            <div className="flex gap-8 perspective-1000 px-12 overflow-x-auto pb-12 no-scrollbar">
                {items.map((item) => (
                    <TiltCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}

// --- Style 4: Horizontal Long Card Scroll ---
function LongCardScroll() {
    return (
        <div className="min-h-[80vh] bg-white flex items-center py-20">
            <div className="w-full overflow-x-auto px-6 pb-12 no-scrollbar flex gap-6 snap-x snap-mandatory">
                {items.map((item) => (
                    <div key={item.id} className="snap-center shrink-0 w-[85vw] md:w-[400px] h-[600px] relative group overflow-hidden rounded-lg">
                        <img src={item.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={item.title} />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

                        <div className="absolute top-0 left-0 w-full h-full p-8 flex flex-col justify-between">
                            <div className="flex justify-between items-start translate-y-[-20px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                <span className="text-white text-xs font-bold uppercase tracking-widest border border-white/30 px-3 py-1 rounded-full backdrop-blur-md">{item.tag}</span>
                                <Button size="icon" className="rounded-full bg-white text-black hover:bg-neutral-200"><Plus className="w-4 h-4" /></Button>
                            </div>

                            <div>
                                <h3 className="font-display text-4xl text-white mb-2 translate-y-[20px] group-hover:translate-y-0 transition-transform duration-500">{item.title}</h3>
                                <p className="text-white/80 text-lg translate-y-[20px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">{item.price}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {/* Spacer */}
                <div className="w-6 shrink-0" />
            </div>
        </div>
    )
}

export default function SignatureCardsMockup() {
    const [version, setVersion] = useState(0);

    return (
        <div className="min-h-screen flex flex-col font-sans relative">
            {/* Logo Placeholder (Top Right) */}
            <div className="fixed top-6 right-6 z-50">
                <FabricSpeaksLogoV4 className="w-24 h-24 md:w-32 md:h-32" />
            </div>

            {/* Control Panel */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md text-white px-6 py-3 rounded-full flex gap-4 shadow-2xl border border-white/20">
                <span className="text-xs font-bold uppercase tracking-widest self-center mr-2 text-neutral-400">Card Style:</span>
                <button
                    onClick={() => setVersion(0)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${version === 0 ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                >
                    Wallet Stack
                </button>
                <button
                    onClick={() => setVersion(1)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${version === 1 ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                >
                    3D Flip
                </button>
                <button
                    onClick={() => setVersion(2)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${version === 2 ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                >
                    Parallax Tilt
                </button>
                <button
                    onClick={() => setVersion(3)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${version === 3 ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                >
                    Long Scroll
                </button>
            </div>

            <div className="flex-1">
                {version === 0 && <WalletStack />}
                {version === 1 && <FlipCards />}
                {version === 2 && <ParallaxShowcase />}
                {version === 3 && <LongCardScroll />}
            </div>
        </div>
    );
}
