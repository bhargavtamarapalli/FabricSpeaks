import { motion } from "framer-motion";

export default function MarqueeBridge() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="bg-black text-white py-4 overflow-hidden border-t border-white/10 border-b border-black relative z-20"
    >
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="flex whitespace-nowrap gap-12 items-center"
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-12">
            <span className="text-sm uppercase tracking-[0.3em] font-medium text-neutral-400">Sustainable Luxury</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-sm uppercase tracking-[0.3em] font-medium text-neutral-400">Handcrafted in Italy</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-sm uppercase tracking-[0.3em] font-medium text-neutral-400">Timeless Design</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-sm uppercase tracking-[0.3em] font-medium text-neutral-400">Premium Materials</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
