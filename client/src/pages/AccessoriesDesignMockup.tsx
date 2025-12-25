import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageLayout from "@/components/PageLayout";
import comingSoonImage from "@assets/coming_soon.png";
import { ArrowRight, Bell, Lock, Sparkles } from "lucide-react";

// --- Version 1: Minimalist & Clean ---
function AccessoriesVersion1() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl w-full text-center"
            >
                <span className="text-xs font-bold tracking-[0.3em] text-neutral-400 uppercase mb-6 block">
                    The Collection
                </span>
                <h1 className="font-display text-5xl md:text-7xl mb-8 text-neutral-900">
                    Men's Accessories
                </h1>

                <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-sm overflow-hidden shadow-xl mb-12 group">
                    <img
                        src={comingSoonImage}
                        alt="Accessories Coming Soon"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm px-8 py-4 border border-white/20">
                            <span className="font-display text-2xl tracking-widest uppercase">Coming Soon</span>
                        </div>
                    </div>
                </div>

                <p className="text-xl text-neutral-500 font-light max-w-lg mx-auto mb-8 leading-relaxed">
                    We are curating a selection of refined essentials to complete your look.
                    From Italian leather to handcrafted metals.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                    <Input placeholder="Enter your email" className="bg-neutral-50 border-neutral-200" />
                    <Button className="bg-neutral-900 text-white px-8">Notify Me</Button>
                </div>
            </motion.div>
        </div>
    );
}

// --- Version 2: Immersive Editorial ---
function AccessoriesVersion2() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-900">
            {/* Background Image with Blur */}
            <div className="absolute inset-0 z-0">
                <img
                    src={comingSoonImage}
                    alt="Background"
                    className="w-full h-full object-cover opacity-40 scale-110 blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="flex items-center gap-3 text-amber-500 mb-6">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm font-bold tracking-widest uppercase">Launching Soon</span>
                    </div>
                    <h1 className="font-display text-6xl md:text-8xl text-white mb-6 leading-none">
                        Refined <br />
                        <span className="text-neutral-500 italic font-serif-alt">Details</span>
                    </h1>
                    <p className="text-neutral-300 text-lg font-light leading-relaxed mb-8 max-w-md">
                        True style lies in the details. Our upcoming accessories collection brings you the finishing touches that define a gentleman.
                    </p>

                    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-2 rounded-full border border-white/10 max-w-md">
                        <Input
                            placeholder="Join the waitlist..."
                            className="bg-transparent border-none text-white placeholder:text-neutral-500 focus-visible:ring-0"
                        />
                        <Button className="rounded-full bg-amber-600 hover:bg-amber-700 text-white px-6">
                            Join <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="hidden md:block"
                >
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                        <img
                            src={comingSoonImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                            <div className="flex justify-between items-center text-white">
                                <span className="font-display text-lg">Signature Watch</span>
                                <Lock className="w-4 h-4 text-neutral-400" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// --- Version 3: Split Modern ---
function AccessoriesVersion3() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="w-full md:w-1/2 h-[50vh] md:h-auto relative overflow-hidden"
            >
                <img
                    src={comingSoonImage}
                    alt="Accessories Detail"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-8 left-8 text-white">
                    <p className="text-xs font-bold tracking-widest uppercase mb-2">Preview</p>
                    <p className="font-display text-3xl">The Gentleman's Kit</p>
                </div>
            </motion.div>

            <div className="w-full md:w-1/2 flex items-center justify-center p-12 md:p-24 bg-[#FDFBF7]">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-md"
                >
                    <div className="w-12 h-1 bg-black mb-8" />
                    <h1 className="font-display text-5xl text-neutral-900 mb-6">
                        Accessories
                    </h1>
                    <h2 className="text-2xl font-serif-alt italic text-neutral-500 mb-8">
                        Coming Fall 2025
                    </h2>
                    <p className="text-neutral-600 leading-relaxed mb-10">
                        We believe that accessories are not just additions, but the essence of personal style. Our new collection is being handcrafted by artisans to ensure every piece tells a story.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 border border-neutral-200 bg-white hover:border-black transition-colors cursor-pointer group">
                            <Bell className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">Get Notified</p>
                                <p className="text-xs text-neutral-500">Be the first to know when we launch.</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function AccessoriesDesignMockup() {
    const [version, setVersion] = useState(0);

    return (
        <PageLayout className="min-h-screen flex flex-col font-sans">
            {/* Control Panel */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md text-white px-6 py-3 rounded-full flex gap-4 shadow-2xl border border-white/20">
                <span className="text-xs font-bold uppercase tracking-widest self-center mr-2 text-neutral-400">Design Ver:</span>
                <button
                    onClick={() => setVersion(0)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${version === 0 ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                >
                    Minimal
                </button>
                <button
                    onClick={() => setVersion(1)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${version === 1 ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                >
                    Editorial
                </button>
                <button
                    onClick={() => setVersion(2)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${version === 2 ? 'bg-white text-black' : 'hover:bg-white/20'}`}
                >
                    Split
                </button>
            </div>

            <main className="flex-1 w-full">
                {version === 0 && <AccessoriesVersion1 />}
                {version === 1 && <AccessoriesVersion2 />}
                {version === 2 && <AccessoriesVersion3 />}
            </main>
        </PageLayout>
    );
}
