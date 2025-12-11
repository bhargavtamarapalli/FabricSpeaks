import React, { useState, useEffect, useRef } from 'react';

interface FabricSpeaksLogoProps {
    className?: string;
    disableMouseTracking?: boolean;
}

/**
 * FabricSpeaksLogoV4 - Dynamic Edition
 * Automatically adapts to the current theme using CSS variables.
 */
const FabricSpeaksLogoV4 = ({ className = "w-80 h-80 md:w-96 md:h-96", disableMouseTracking = false }: FabricSpeaksLogoProps) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse Tracking Logic
    useEffect(() => {
        if (disableMouseTracking) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const x = (e.clientX - centerX) / (rect.width / 2);
            const y = (e.clientY - centerY) / (rect.height / 2);

            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [disableMouseTracking]);

    const spiderLookX = mousePos.x * 15;
    const spiderLookY = mousePos.y * 15;

    // Use CSS variables for dynamic theming
    const activeGradientId = "url(#dynamicGradient)";

    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
        >
            {/* Animation Styles */}
            <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes crawl-leg-1 {
          0% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-18deg) translateY(-6px); }
          50% { transform: rotate(0deg) translateY(0); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        @keyframes crawl-leg-2 {
          0% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(-18deg) translateY(-6px); }
          75% { transform: rotate(0deg) translateY(0); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        @keyframes body-crawl {
          0% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(2deg) translateY(1px); }
          50% { transform: rotate(0deg) translateY(0); }
          75% { transform: rotate(-2deg) translateY(1px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        /* Stacking Web Sequence */
        @keyframes sequence-1 { 0% { opacity: 0.1; stroke-width: 0.5; } 10% { opacity: 1; stroke-width: 1.5; } 90% { opacity: 1; stroke-width: 1.5; } 100% { opacity: 0.1; stroke-width: 0.5; } }
        @keyframes sequence-2 { 0% { opacity: 0.1; stroke-width: 0.5; } 25% { opacity: 0.1; stroke-width: 0.5; } 35% { opacity: 1; stroke-width: 1.5; } 90% { opacity: 1; stroke-width: 1.5; } 100% { opacity: 0.1; stroke-width: 0.5; } }
        @keyframes sequence-3 { 0% { opacity: 0.1; stroke-width: 0.5; } 50% { opacity: 0.1; stroke-width: 0.5; } 60% { opacity: 1; stroke-width: 1.5; } 90% { opacity: 1; stroke-width: 1.5; } 100% { opacity: 0.1; stroke-width: 0.5; } }
        @keyframes sequence-4 { 0% { opacity: 0.1; stroke-width: 0.5; } 75% { opacity: 0.1; stroke-width: 0.5; } 85% { opacity: 1; stroke-width: 1.5; } 90% { opacity: 1; stroke-width: 1.5; } 100% { opacity: 0.1; stroke-width: 0.5; } }
        @keyframes straight-thread-pulse { 0%, 100% { opacity: 0.3; stroke-width: 0.5; } 50% { opacity: 0.6; stroke-width: 1; } }

        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-crawl-l1 { animation: crawl-leg-1 0.3s infinite; transform-origin: 150px 150px; }
        .animate-crawl-r1 { animation: crawl-leg-2 0.3s infinite; transform-origin: 150px 150px; }
        .animate-crawl-l2 { animation: crawl-leg-2 0.3s infinite; transform-origin: 150px 150px; }
        .animate-crawl-r2 { animation: crawl-leg-1 0.3s infinite; transform-origin: 150px 150px; }
        .animate-body-crawl { animation: body-crawl 0.3s infinite ease-in-out; transform-origin: 150px 150px; }
        
        .animate-seq-1 { animation: sequence-1 3s infinite linear; }
        .animate-seq-2 { animation: sequence-2 3s infinite linear; }
        .animate-seq-3 { animation: sequence-3 3s infinite linear; }
        .animate-seq-4 { animation: sequence-4 3s infinite linear; }
        .animate-thread-pulse { animation: straight-thread-pulse 3s infinite ease-in-out; }

        .ring-text {
          font-family: serif;
          font-weight: bold;
          font-size: 14px;
          letter-spacing: 5px;
          fill: ${activeGradientId};
        }
      `}</style>

            <div ref={containerRef} className="w-full h-full relative group perspective-1000">
                <svg
                    viewBox="0 0 300 300"
                    className="w-full h-full transition-all duration-500 drop-shadow-lg"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="dynamicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--logo-gradient-start)" />
                            <stop offset="25%" stopColor="var(--logo-gradient-mid)" />
                            <stop offset="50%" stopColor="var(--logo-gradient-mid)">
                                <animate attributeName="stop-color" values="var(--logo-gradient-start);var(--logo-gradient-mid);var(--logo-gradient-start)" dur="3s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="75%" stopColor="var(--logo-gradient-mid)" />
                            <stop offset="100%" stopColor="var(--logo-gradient-end)" />
                        </linearGradient>

                        <path id="ringPathSmall" d="M 150, 150 m -60, 0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0" />
                    </defs>

                    {/* --- ROTATING TEXT RING & WEB --- */}
                    <g className="origin-center animate-spin-slow">
                        <g className="transition-colors duration-500" stroke="var(--logo-stroke)" strokeWidth="0.5" fill="none">
                            <g className="animate-thread-pulse">
                                <line x1="150" y1="150" x2="150" y2="92" />
                                <line x1="150" y1="150" x2="208" y2="150" />
                                <line x1="150" y1="150" x2="150" y2="208" />
                                <line x1="150" y1="150" x2="92" y2="150" />
                                <line x1="150" y1="150" x2="191" y2="109" />
                                <line x1="150" y1="150" x2="191" y2="191" />
                                <line x1="150" y1="150" x2="109" y2="191" />
                                <line x1="150" y1="150" x2="109" y2="109" />
                            </g>
                            <circle cx="150" cy="150" r="15" stroke={activeGradientId} fill="none" className="animate-seq-1" />
                            <circle cx="150" cy="150" r="30" stroke={activeGradientId} fill="none" className="animate-seq-2" />
                            <circle cx="150" cy="150" r="45" stroke={activeGradientId} fill="none" className="animate-seq-3" />
                            <circle cx="150" cy="150" r="58" stroke={activeGradientId} fill="none" className="animate-seq-4" />
                        </g>

                        <text className="ring-text">
                            <textPath href="#ringPathSmall" startOffset="0%" textLength="377" lengthAdjust="spacing">
                                FABRIC SPEAKS ♦ FABRIC SPEAKS ♦
                            </textPath>
                        </text>
                    </g>

                    {/* --- SPIDER --- */}
                    <g className="origin-center" style={{ filter: "drop-shadow(1px 2px 1px rgba(0,0,0,0.3))" }}>
                        <g transform={`translate(150,150) scale(0.75) rotate(${spiderLookX}, 0, 0) translate(-150,-150)`}>
                            <g className="animate-crawl-l1">
                                <path d="M140 150 Q110 120 100 90" fill="none" stroke={activeGradientId} strokeWidth="3" strokeLinecap="round" />
                                <path d="M140 160 Q100 180 90 200" fill="none" stroke={activeGradientId} strokeWidth="3" strokeLinecap="round" />
                            </g>
                            <g className="animate-crawl-l2">
                                <path d="M140 155 Q100 150 90 140" fill="none" stroke={activeGradientId} strokeWidth="3" strokeLinecap="round" />
                                <path d="M145 165 Q120 200 110 220" fill="none" stroke={activeGradientId} strokeWidth="3" strokeLinecap="round" />
                            </g>
                            <g className="animate-crawl-r1">
                                <path d="M160 150 Q190 120 200 90" fill="none" stroke={activeGradientId} strokeWidth="3" strokeLinecap="round" />
                                <path d="M160 160 Q200 180 210 200" fill="none" stroke={activeGradientId} strokeWidth="3" strokeLinecap="round" />
                            </g>
                            <g className="animate-crawl-r2">
                                <path d="M160 155 Q200 150 210 140" fill="none" stroke={activeGradientId} strokeWidth="3" strokeLinecap="round" />
                                <path d="M155 165 Q180 200 190 220" fill="none" stroke={activeGradientId} strokeWidth="3" strokeLinecap="round" />
                            </g>

                            <g className="animate-body-crawl" transform={`rotate(${spiderLookY * 0.5}, 150, 150)`}>
                                <path d="M138,160 C135,165 135,175 142,180 C145,183 155,183 158,180 C165,175 165,165 162,160 C160,155 140,155 138,160 Z" fill={activeGradientId} />
                                <path d="M145,160 L155,170 M155,160 L145,170" stroke="var(--logo-stroke)" strokeWidth="1" opacity="0.6" />
                                <ellipse cx="150" cy="148" rx="9" ry="10" fill={activeGradientId} />
                                <path d="M145,140 Q142,135 144,132" stroke={activeGradientId} strokeWidth="2" fill="none" />
                                <path d="M155,140 Q158,135 156,132" stroke={activeGradientId} strokeWidth="2" fill="none" />
                                <circle cx="147" cy="145" r="1.5" fill="#dc2626" />
                                <circle cx="153" cy="145" r="1.5" fill="#dc2626" />
                                <circle cx="144" cy="147" r="1" fill="#dc2626" opacity="0.7" />
                                <circle cx="156" cy="147" r="1" fill="#dc2626" opacity="0.7" />
                                <ellipse cx="145" cy="165" rx="3" ry="5" fill="white" opacity="0.3" transform="rotate(-20 145 165)" />
                                <circle cx="152" cy="145" r="1" fill="white" opacity="0.4" />
                            </g>
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    );
};

export default FabricSpeaksLogoV4;
