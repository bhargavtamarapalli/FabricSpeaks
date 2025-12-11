/**
 * Star Rating Component
 * 
 * Displays a star rating (read-only or interactive).
 * 
 * @module client/src/components/StarRating
 */

import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: "sm" | "md" | "lg";
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
    className?: string;
}

export default function StarRating({
    rating,
    maxRating = 5,
    size = "md",
    interactive = false,
    onRatingChange,
    className,
}: StarRatingProps) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    const sizeClasses = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-6 w-6",
    };

    const handleStarClick = (index: number) => {
        if (interactive && onRatingChange) {
            onRatingChange(index + 1);
        }
    };

    for (let i = 0; i < maxRating; i++) {
        if (i < fullStars) {
            stars.push(
                <Star
                    key={i}
                    className={cn(
                        "fill-yellow-400 text-yellow-400 transition-colors",
                        sizeClasses[size],
                        interactive && "cursor-pointer hover:scale-110"
                    )}
                    onClick={() => handleStarClick(i)}
                />
            );
        } else if (i === fullStars && hasHalfStar) {
            stars.push(
                <div key={i} className="relative">
                    <Star
                        className={cn(
                            "text-muted-foreground/30",
                            sizeClasses[size],
                            interactive && "cursor-pointer"
                        )}
                        onClick={() => handleStarClick(i)}
                    />
                    <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                        <Star
                            className={cn(
                                "fill-yellow-400 text-yellow-400",
                                sizeClasses[size]
                            )}
                        />
                    </div>
                </div>
            );
        } else {
            stars.push(
                <Star
                    key={i}
                    className={cn(
                        "text-muted-foreground/30",
                        sizeClasses[size],
                        interactive && "cursor-pointer hover:text-yellow-200"
                    )}
                    onClick={() => handleStarClick(i)}
                />
            );
        }
    }

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {stars}
        </div>
    );
}
