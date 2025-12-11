import { motion } from "framer-motion";
import FabricSpeaksLogoV4 from "./FabricSpeaksLogoV4";

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-72 h-72"
            >
                <FabricSpeaksLogoV4 className="w-full h-full" />
            </motion.div>
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mt-8 text-muted-foreground font-light tracking-widest uppercase text-sm"
            >
                Fabric Speaks
            </motion.p>
        </div>
    );
}
