/**
 * ResponsiveImage Component
 * Displays optimized images with WebP support, lazy loading, and blur placeholder
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string; // Original or fallback image
    variants?: {
        thumbnail?: string;
        medium?: string;
        large?: string;
    };
    blurDataUrl?: string;
    alt: string;
    className?: string;
    priority?: boolean; // If true, load immediately (e.g. hero image)
}

export default function ResponsiveImage({
    src,
    variants,
    blurDataUrl,
    alt,
    className,
    priority = false,
    ...props
}: ResponsiveImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    // If no variants provided, just render normal image
    if (!variants) {
        return (
            <img
                src={src}
                alt={alt}
                className={cn(
                    "transition-opacity duration-300",
                    isLoaded ? "opacity-100" : "opacity-0",
                    className
                )}
                onLoad={() => setIsLoaded(true)}
                loading={priority ? "eager" : "lazy"}
                {...props}
            />
        );
    }

    return (
        <div className={cn("relative overflow-hidden bg-gray-100", className)}>
            {/* Blur Placeholder */}
            {blurDataUrl && !isLoaded && (
                <img
                    src={blurDataUrl}
                    alt={alt}
                    className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110"
                    aria-hidden="true"
                />
            )}

            <picture>
                {/* Large screens (Desktop) */}
                {variants.large && (
                    <source
                        media="(min-width: 1024px)"
                        srcSet={variants.large}
                        type="image/webp"
                    />
                )}

                {/* Medium screens (Tablet) */}
                {variants.medium && (
                    <source
                        media="(min-width: 640px)"
                        srcSet={variants.medium}
                        type="image/webp"
                    />
                )}

                {/* Small screens (Mobile) */}
                {variants.thumbnail && (
                    <source
                        media="(max-width: 639px)"
                        srcSet={variants.thumbnail}
                        type="image/webp"
                    />
                )}

                {/* Fallback */}
                <img
                    src={src}
                    alt={alt}
                    className={cn(
                        "w-full h-full object-cover transition-opacity duration-500",
                        isLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setError(true)}
                    loading={priority ? "eager" : "lazy"}
                    {...props}
                />
            </picture>
        </div>
    );
}
