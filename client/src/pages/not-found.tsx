import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-black transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="pt-6 text-center">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="w-20 h-20 bg-stone-100 dark:bg-neutral-900 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-stone-400 dark:text-neutral-500" />
              </div>
            </motion.div>

            <h1 className="font-display text-4xl md:text-5xl mb-4 text-stone-900 dark:text-white">
              Page Not Found
            </h1>

            <p className="text-stone-500 dark:text-neutral-400 mb-8 font-light text-lg">
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>

            <Button asChild className="bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200 px-8 py-6 text-lg font-light">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" /> Return Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
