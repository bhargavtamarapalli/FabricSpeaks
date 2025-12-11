import { motion } from "framer-motion";
import FabricSpeaksLogoV4 from "./FabricSpeaksLogoV4";

interface LoadingProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export default function Loading({ size = "md", className = "" }: LoadingProps) {
    const sizeClasses = {
        sm: "w-24 h-24", // Increased by 50% from original (was w-16)
        md: "w-48 h-48", // Increased by 50% from original (was w-32)
        lg: "w-72 h-72"  // Increased by 50% from original (was w-48)
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <motion.div
                className={`relative ${sizeClasses[size]}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <FabricSpeaksLogoV4 className="w-full h-full" />
            </motion.div>
            <motion.p
                className="mt-4 text-muted-foreground font-light tracking-widest uppercase text-sm"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
            >
                Fabric Speaks
            </motion.p>
        </div>
    );
}
