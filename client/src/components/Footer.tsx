import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Instagram, Facebook, Twitter, MessageCircle, Send, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!email) return;

    setIsLoading(true);
    try {
      await api.post("/api/newsletter/subscribe", { email });
      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-stone-50 dark:bg-neutral-900 border-t border-stone-200 dark:border-neutral-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/">
              <span className="font-display text-2xl font-bold tracking-tighter text-stone-900 dark:text-white cursor-pointer">
                FABRIC SPEAKS
              </span>
            </Link>
            <p className="mt-4 text-stone-600 dark:text-neutral-400 font-light leading-relaxed max-w-sm">
              Crafting timeless elegance through premium fabrics and expert tailoring. Designed for the modern connoisseur.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg mb-6 text-stone-900 dark:text-white">Shop</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/clothing">
                  <span className="text-stone-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-200 cursor-pointer">Clothing</span>
                </Link>
              </li>
              <li>
                <Link href="/accessories">
                  <span className="text-stone-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-200 cursor-pointer">Accessories</span>
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals">
                  <span className="text-stone-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-200 cursor-pointer">New Arrivals</span>
                </Link>
              </li>
              <li>
                <Link href="/sale">
                  <span className="text-stone-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-200 cursor-pointer">Sale</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg mb-6 text-stone-900 dark:text-white">About</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/about">
                  <span className="text-stone-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-200 cursor-pointer">Our Story</span>
                </Link>
              </li>
              <li>
                <Link href="/fabrics">
                  <span className="text-stone-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-200 cursor-pointer">Our Fabrics</span>
                </Link>
              </li>
              <li>
                <Link href="/sustainability">
                  <span className="text-stone-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-200 cursor-pointer">Sustainability</span>
                </Link>
              </li>
              <li>
                <Link href="/press">
                  <span className="text-stone-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-200 cursor-pointer">Press</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg mb-6 text-stone-900 dark:text-white">Newsletter</h3>
            <p className="text-sm text-stone-600 dark:text-neutral-400 mb-4 font-light">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <div className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-neutral-500 focus-visible:ring-amber-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Button
                className="w-full bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200 transition-colors"
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-stone-200 dark:border-neutral-800 gap-6">
          <p className="text-sm text-stone-500 dark:text-neutral-500 font-light">
            © 2025 Fabric Speaks. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" className="text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-transparent">
              <Instagram className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-transparent">
              <Facebook className="h-5 w-5" />
            </Button>
            <a href="https://chat.whatsapp.com/G7wQ8qJ9xKj1L2m3n4o5p6" target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-transparent">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </a>
            <a href="https://t.me/fabricspeaks" target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-transparent">
                <Send className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
