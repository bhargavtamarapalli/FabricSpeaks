import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
const video1 = "/assets/Generative_Video_of_Lenin_Fabric.mp4";
const video2 = "/assets/Luxurious_Silk_Satin_Video_Generation.mp4";
import editorialImg from "@assets/Men's_fashion_hero_editorial_7382b369.png";
import coatImg from "@assets/Men's_camel_cashmere_overcoat_939b4b8d.png";
import { useBanners } from "@/hooks/useBanners";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

// Static slides as fallback (Strategy: Hybrid/Fallback)
// These are used ONLY if there are no active dynamic banners from the backend.
const STATIC_SLIDES = [
    { type: 'image', src: editorialImg, title: "Modern Tailoring", subtitle: "The New Silhouette" },
    { type: 'video', src: video2, title: "Royal Satin", subtitle: "Evening Elegance" },
    { type: 'image', src: coatImg, title: "Cashmere Warmth", subtitle: "Winter Essentials" },
    { type: 'video', src: video1, title: "Natural Linen", subtitle: "Breathable Luxury" },
];

export default function HeroSection() {
    // 1. Fetch active banners from backend
    const { data: activeBanners, isLoading } = useBanners();

    // 2. Determine which slides to show
    // Strategy: MERGE dynamic banners with static fallback
    // Dynamic banners come first (sorted by priority from backend), followed by static branded slides
    const hasActiveBanners = activeBanners && activeBanners.length > 0;

    const dynamicSlides = hasActiveBanners ? activeBanners.map((banner) => ({
        id: banner.id, // Track ID for analytics
        type: banner.content.mediaType || 'image',
        src: banner.content.mediaUrl,
        mobileSrc: banner.content.mobileMediaUrl, // Mobile specific image
        title: banner.title,
        subtitle: banner.content.subtitle || '',
        ctaText: banner.content.ctaText,
        ctaLink: banner.content.ctaLink,
    })) : [];

    const slides = [...dynamicSlides, ...STATIC_SLIDES];

    const handleBannerClick = async (slide: any) => {
        if (slide.id) {
            try {
                await api.post(`/api/banners/${slide.id}/click`);
                console.debug(`[DEBUG HERO] Click tracked for banner ${slide.id}`);
            } catch (err) {
                console.error("Failed to track click", err);
            }
        }
    };

    const [current, setCurrent] = useState(0);

    // Reset current slide if slides array changes length (to avoid out of bounds)
    useEffect(() => {
        if (current >= slides.length) {
            setCurrent(0);
        }
    }, [slides.length]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    // Debug logging for verification
    useEffect(() => {
        console.log('[DEBUG HERO] Current slides source:', hasActiveBanners ? 'Dynamic API' : 'Static Fallback');
        console.log('[DEBUG HERO] Active banners count:', activeBanners?.length || 0);
    }, [hasActiveBanners, activeBanners]);

    return (
        <motion.section className="relative h-screen w-full overflow-hidden bg-black">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current} // Key change triggers animation
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0"
                >
                    {/* Handle both Image and Video types */}
                    {/* Wrap content in Link if ctaLink exists, otherwise just render content */}
                    {slides[current]?.ctaLink ? (
                        <Link href={slides[current].ctaLink} onClick={() => handleBannerClick(slides[current])} className="block w-full h-full cursor-pointer">
                            {slides[current].type === 'video' ? (
                                <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80">
                                    <source src={slides[current].src} type="video/mp4" />
                                </video>
                            ) : (
                                <picture>
                                    {(slides[current] as any).mobileSrc && (
                                        <source media="(max-width: 768px)" srcSet={(slides[current] as any).mobileSrc} />
                                    )}
                                    <img
                                        src={slides[current]?.src || ''}
                                        className={`w-full h-full object-cover opacity-80 ${slides[current]?.title === "Cashmere Warmth" ? "object-top" : "object-center"}`}
                                        alt={slides[current]?.title || 'Hero Banner'}
                                    />
                                </picture>
                            )}
                        </Link>
                    ) : (
                        slides[current].type === 'video' ? (
                            <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80">
                                <source src={slides[current].src} type="video/mp4" />
                            </video>
                        ) : (
                            <picture>
                                {(slides[current] as any).mobileSrc && (
                                    <source media="(max-width: 768px)" srcSet={(slides[current] as any).mobileSrc} />
                                )}
                                <img
                                    src={slides[current]?.src || ''}
                                    className={`w-full h-full object-cover opacity-80 ${slides[current]?.title === "Cashmere Warmth" ? "object-top" : "object-center"}`}
                                    alt={slides[current]?.title || 'Hero Banner'}
                                />
                            </picture>
                        )
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                </motion.div>
            </AnimatePresence>

            {/* Helper text if loading and no fallback (shouldn't happen with fallback strategy, but good safety) */}
            {isLoading && !hasActiveBanners && !STATIC_SLIDES.length && (
                <div className="absolute inset-0 flex items-center justify-center text-white z-30">
                    Loading contents...
                </div>
            )}

            <div className="absolute bottom-20 left-12 z-20 text-white max-w-2xl">
                <motion.div key={`${current}-text`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                    <p className="text-amber-400 uppercase tracking-widest text-sm mb-2">{slides[current]?.subtitle}</p>
                    <h1 className="font-display text-4xl md:text-6xl lg:text-8xl mb-6">{slides[current]?.title}</h1>

                    {/* Render CTA Button if available */}
                    {(slides[current] as any).ctaText && (slides[current] as any).ctaLink && (
                        <Link href={(slides[current] as any).ctaLink}>
                            <Button
                                size="lg"
                                className="bg-white text-black hover:bg-white/90 transition-all text-base px-8 py-6 rounded-none group"
                                onClick={() => handleBannerClick(slides[current])}
                            >
                                {(slides[current] as any).ctaText}
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    )}
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
