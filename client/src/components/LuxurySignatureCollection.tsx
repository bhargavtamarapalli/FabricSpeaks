import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, X, ArrowUpRight, Ruler, Droplets, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import FabricSpeaksLogoV4 from './FabricSpeaksLogoV4';

// --- SUB-COMPONENTS ---

const ReviewsSection = ({ productId }: { productId: string }) => {
    const { data: reviews, isLoading } = useQuery({
        queryKey: ['product-reviews', productId],
        queryFn: async () => {
            const res = await fetch(`/api/products/${productId}/reviews`);
            if (!res.ok) return [];
            return res.json();
        }
    });

    if (isLoading) return <div className="py-12 text-center">Loading reviews...</div>;

    if (!reviews || reviews.length === 0) return null;

    return (
        <div className="bg-white dark:bg-neutral-950 py-16 px-6 md:px-12 border-t border-stone-100 dark:border-neutral-800">
            <div className="max-w-4xl mx-auto">
                <h3 className="font-display text-3xl text-stone-900 dark:text-white mb-12 text-center">Client Reviews</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {reviews.map((review: any) => (
                        <div key={review.id} className="bg-stone-50 dark:bg-neutral-900 p-8 relative">
                            <span className="text-6xl text-amber-200 absolute top-4 left-4 font-serif leading-none">"</span>
                            <p className="text-stone-700 dark:text-stone-300 font-light italic mb-6 relative z-10">
                                {review.comment}
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-stone-300 dark:bg-neutral-700 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 font-serif font-bold">
                                    {review.user?.full_name?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-stone-900 dark:text-white">{review.user?.full_name || "Anonymous"}</p>
                                    {review.verified_purchase && (
                                        <p className="text-xs text-stone-500 uppercase tracking-wider">Verified Buyer</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ProductDetailView = ({ product, allProducts, onClose, onSelectProduct }: { product: any, allProducts: any[], onClose: () => void, onSelectProduct: (p: any) => void }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { data: recommendations } = useQuery({
        queryKey: ['product-recommendations', product.id],
        queryFn: async () => {
            const res = await fetch(`/api/products/${product.id}/recommendations`);
            if (!res.ok) return [];
            return res.json();
        }
    });

    // Prepare media array (Video + Images)
    const media = [];
    if (product.signature_details?.show_video && product.signature_details?.video) {
        media.push({ type: 'video', src: product.signature_details.video });
    }
    if (product.images && product.images.length > 0) {
        product.images.forEach((img: string) => media.push({ type: 'image', src: img }));
    } else if (product.signature_details?.image) {
        media.push({ type: 'image', src: product.signature_details.image });
    }

    const handleNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % media.length);
    };

    const handlePrev = () => {
        setCurrentImageIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    // Auto-advance slideshow (pause if video is playing)
    useEffect(() => {
        let interval: any;
        const currentMedia = media[currentImageIndex];

        if (currentMedia?.type !== 'video') {
            interval = setInterval(handleNext, 5000);
        }

        return () => clearInterval(interval);
    }, [currentImageIndex, media]);

    // Reset index when product changes
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [product]);

    const otherProducts = allProducts.filter(p => p.id !== product.id && !recommendations?.find((r: any) => r.id === p.id)).slice(0, 4);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/95 dark:bg-black/95 backdrop-blur-sm overflow-y-auto"
        >
            <button
                onClick={onClose}
                className="fixed top-6 right-6 z-50 p-2 bg-black text-white rounded-full hover:bg-stone-800 transition-colors"
            >
                <X size={24} />
            </button>

            <div className="min-h-screen">
                <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
                    {/* Left: Media Gallery */}
                    <div className="relative h-[50vh] lg:h-screen bg-stone-100 dark:bg-neutral-900 sticky top-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentImageIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="w-full h-full"
                            >
                                {media[currentImageIndex]?.type === 'video' ? (
                                    <div className="w-full h-full relative">
                                        <video
                                            ref={videoRef}
                                            src={media[currentImageIndex].src}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            loop
                                            muted={isMuted}
                                            playsInline
                                        />
                                        <div className="absolute bottom-6 right-6 flex gap-2">
                                            <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40">
                                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={media[currentImageIndex]?.src}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {media.length > 1 && (
                            <>
                                <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40">
                                    <ChevronLeft size={24} />
                                </button>
                                <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40">
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Right: Product Details */}
                    <div className="p-8 lg:p-24 flex flex-col justify-center bg-white dark:bg-neutral-950">
                        <div className="max-w-xl mx-auto w-full">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-bold tracking-widest uppercase rounded-full">
                                    {product.signature_details?.tag || 'Signature'}
                                </span>
                                {product.signature_details?.certificate && (
                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold tracking-widest uppercase rounded-full border border-amber-100">
                                        Authenticity Guaranteed
                                    </span>
                                )}
                            </div>

                            <h1 className="font-display text-5xl md:text-6xl text-stone-900 dark:text-white mb-4 leading-tight">{product.name}</h1>

                            <div className="flex items-baseline gap-4 mb-8">
                                <span className="text-2xl font-light text-stone-900 dark:text-white">₹{product.sale_price || product.price}</span>
                                {product.sale_price && (
                                    <span className="text-lg text-stone-400 line-through">₹{product.price}</span>
                                )}
                            </div>

                            <p className="text-stone-600 dark:text-stone-300 leading-relaxed mb-12 text-lg font-light">
                                {product.description}
                            </p>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 border-y border-stone-100 dark:border-neutral-800 py-8">
                                {product.signature_details?.details?.fabric && (
                                    <div>
                                        <h4 className="font-bold text-stone-900 dark:text-white text-sm uppercase tracking-wider mb-2">Material</h4>
                                        <p className="text-stone-600 font-light">{product.signature_details.details.fabric}</p>
                                    </div>
                                )}
                                {product.signature_details?.details?.origin && (
                                    <div>
                                        <h4 className="font-bold text-stone-900 dark:text-white text-sm uppercase tracking-wider mb-2">Origin</h4>
                                        <p className="text-stone-600 font-light">{product.signature_details.details.origin}</p>
                                    </div>
                                )}
                                {product.signature_details?.details?.styling && (
                                    <div className="md:col-span-2">
                                        <h4 className="font-bold text-stone-900 dark:text-white text-sm uppercase tracking-wider mb-2">Styling Note</h4>
                                        <p className="text-stone-600 font-light italic">"{product.signature_details.details.styling}"</p>
                                    </div>
                                )}
                            </div>

                            <button className="w-full bg-stone-900 dark:bg-white text-white dark:text-black py-4 px-8 rounded-full hover:bg-stone-800 dark:hover:bg-neutral-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 mb-16">
                                <ShoppingBag size={20} />
                                <span className="font-medium tracking-wide">Add to Collection</span>
                            </button>
                        </div>
                    </div>
                </div>

                <ReviewsSection productId={product.id} />

                {/* Recommendations & Cross-Sell */}
                <div className="bg-stone-50 dark:bg-neutral-900 py-24 px-6 md:px-12">
                    <div className="max-w-7xl mx-auto">
                        {recommendations && recommendations.length > 0 && (
                            <div className="mb-24">
                                <h3 className="font-display text-3xl text-stone-900 dark:text-white mb-12 text-center">Complete the Look</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {recommendations.map((rec: any) => (
                                        <div
                                            key={rec.id}
                                            className="group cursor-pointer"
                                            onClick={() => onSelectProduct(rec)}
                                        >
                                            <div className="aspect-[3/4] bg-white overflow-hidden rounded-lg mb-4 shadow-sm">
                                                <img
                                                    src={rec.images?.[0] || rec.signature_details?.image}
                                                    alt={rec.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <h4 className="font-display text-xl text-stone-900 dark:text-white mb-1">{rec.name}</h4>
                                            <p className="text-stone-500 dark:text-stone-400">₹{rec.price}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="font-display text-3xl text-stone-900 dark:text-white mb-12 text-center">More from Signature Collection</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {otherProducts.map((p: any) => (
                                    <div
                                        key={p.id}
                                        className="group cursor-pointer"
                                        onClick={() => onSelectProduct(p)}
                                    >
                                        <div className="aspect-[3/4] bg-white overflow-hidden rounded-lg mb-4 shadow-sm">
                                            <img
                                                src={p.signature_details?.image || p.images?.[0]}
                                                alt={p.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <h4 className="font-display text-lg text-stone-900 dark:text-white mb-1">{p.name}</h4>
                                        <p className="text-stone-500 dark:text-stone-400">₹{p.price}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---

export default function LuxurySignatureCollection() {
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [stackHovered, setStackHovered] = useState(false);
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
    const [, setLocation] = useLocation();

    const { data, isLoading, error } = useQuery({
        queryKey: ['signature-products'],
        queryFn: async () => {
            const res = await fetch('/api/products?isSignature=true');
            if (!res.ok) throw new Error('Failed to fetch signature products');
            return res.json();
        }
    });

    const products = data?.items || [];

    // 3D Parallax Tilt Handler
    const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        if (hoveredCardId !== id) return;

        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Max rotation 15deg
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        card.style.transform = `scale(1.2) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const resetCardTransform = (e: React.MouseEvent<HTMLDivElement>) => {
        // CSS transitions handle the smooth return to default state
    };

    if (isLoading) {
        return (
            <div className="min-h-[600px] w-full flex items-center justify-center bg-stone-100 dark:bg-neutral-900">
                <FabricSpeaksLogoV4 className="w-32 h-32 text-stone-900 dark:text-white" />
            </div>
        );
    }

    if (error) return null;

    return (
        <div className="min-h-[600px] w-full bg-stone-100 dark:bg-neutral-900 p-8 flex flex-col items-center justify-center relative overflow-hidden font-sans transition-colors duration-300">
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <span className="text-[15vw] font-display font-bold text-stone-200/50 dark:text-neutral-800/30 whitespace-nowrap select-none">
                    SIGNATURE
                </span>
            </div>

            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16 z-10 cursor-pointer relative"
                onClick={() => setLocation('/signature-collection')}
            >
                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="h-6 w-6 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-serif font-bold text-xs">S</div>
                    <span className="font-serif text-sm font-bold tracking-wide dark:text-neutral-200">SIGNATURE</span>
                </div>
                <h2 className="font-display text-5xl md:text-6xl text-stone-900 dark:text-white">The Collection</h2>
                <div className="w-12 h-1 bg-amber-500 mx-auto mt-6" />
            </motion.div>

            {/* Central Wallet Stack */}
            <div
                className="relative h-96 w-full max-w-5xl flex items-center justify-center perspective-1000 z-0"
                onMouseEnter={() => setStackHovered(true)}
                onMouseLeave={() => { setStackHovered(false); setHoveredCardId(null); }}
            >
                {products.map((product: any, index: number) => {
                    const centerIndex = (products.length - 1) / 2;
                    const offset = index - centerIndex;
                    const isCardHovered = hoveredCardId === product.id;
                    const isAnyHovered = hoveredCardId !== null;

                    // Wallet Spread Logic
                    const xSpread = stackHovered ? 140 : 50;
                    const xPos = offset * xSpread;

                    // Base Transforms
                    let rotation = isCardHovered ? 0 : (stackHovered ? 0 : offset * 4);
                    let scale = isCardHovered ? 1.2 : (stackHovered ? 1.05 : 1 - Math.abs(offset) * 0.05);
                    let zIndex = isCardHovered ? 50 : index;

                    // Dimming Logic
                    const opacity = isAnyHovered && !isCardHovered ? 0.4 : 1;
                    const filter = isAnyHovered && !isCardHovered ? 'blur(2px)' : 'none';

                    // Ambient Shadow Logic
                    const colorHex = product.signature_details?.colorHex || '#000000';
                    const boxShadow = isCardHovered
                        ? `0 25px 50px -12px ${colorHex}80` // Colored ambient glow
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)';

                    const image = product.signature_details?.image || product.images?.[0];

                    return (
                        <div
                            key={product.id}
                            onClick={() => {
                                console.log("Card clicked:", product.name);
                                setSelectedProduct(product);
                            }}
                            onMouseEnter={(e) => {
                                e.stopPropagation();
                                setHoveredCardId(product.id);
                            }}
                            onMouseMove={(e) => handleCardMouseMove(e, product.id)}
                            onMouseLeave={(e) => {
                                setHoveredCardId(null);
                                resetCardTransform(e);
                            }}
                            className="absolute w-64 h-96 rounded-xl cursor-pointer transition-all duration-300 ease-out transform-style-3d"
                            style={{
                                transform: `translateX(${xPos}px) rotateZ(${rotation}deg) scale(${scale})`,
                                zIndex: zIndex,
                                opacity: opacity,
                                filter: filter
                            }}
                        >
                            {/* Gold Foil Wrapper */}
                            <div
                                className="w-full h-full rounded-xl overflow-hidden relative group bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] p-[4px] shadow-2xl"
                                style={{ boxShadow }}
                            >
                                <div className="w-full h-full bg-white rounded-lg overflow-hidden relative">
                                    <img
                                        src={image}
                                        alt={product.name}
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

                                    <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300 drop-shadow-lg pointer-events-none">
                                        <p className="text-[10px] font-bold tracking-widest mb-1 shadow-black text-[#fcf6ba]">
                                            {product.signature_details?.tag}
                                        </p>
                                        <h3 className="font-display text-xl shadow-black">{product.name}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <ProductDetailView
                        key="product-detail-modal"
                        product={selectedProduct}
                        allProducts={products}
                        onClose={() => setSelectedProduct(null)}
                        onSelectProduct={setSelectedProduct}
                    />
                )}
            </AnimatePresence>

            {/* Required Animations */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
                
                @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slideUpFade { animation: slideUpFade 0.6s ease-out forwards; }

                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }

                @keyframes revealParallax { 0% { transform: scale(1.1); opacity: 0; } 100% { transform: scale(1.0); opacity: 1; } }
                .animate-revealParallax { animation: revealParallax 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
            `}</style>
        </div>
    );
}
