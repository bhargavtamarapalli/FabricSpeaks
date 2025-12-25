import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Contact() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return (
    <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
      <main className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-amber-600 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
              Get in Touch
            </span>
            <h1 className="font-display text-5xl md:text-7xl mb-6 dark:text-white">
              Contact Us
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-light text-lg max-w-2xl mx-auto">
              We're here to assist you with any inquiries about our collections, sizing, or your order.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-8 h-full border-none shadow-none bg-stone-50 dark:bg-neutral-900 flex flex-col items-center text-center hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors duration-300">
                <Mail className="h-8 w-8 mb-6 text-amber-600" />
                <h3 className="font-display text-xl mb-2 dark:text-white">Email</h3>
                <p className="text-stone-600 dark:text-neutral-400 font-light">contact@fabricspeaks.com</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-8 h-full border-none shadow-none bg-stone-50 dark:bg-neutral-900 flex flex-col items-center text-center hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors duration-300">
                <Phone className="h-8 w-8 mb-6 text-amber-600" />
                <h3 className="font-display text-xl mb-2 dark:text-white">Phone</h3>
                <p className="text-stone-600 dark:text-neutral-400 font-light">+1 (212) 555-0123</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-8 h-full border-none shadow-none bg-stone-50 dark:bg-neutral-900 flex flex-col items-center text-center hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors duration-300">
                <MapPin className="h-8 w-8 mb-6 text-amber-600" />
                <h3 className="font-display text-xl mb-2 dark:text-white">Address</h3>
                <p className="text-stone-600 dark:text-neutral-400 font-light">123 Silk Road, Textile District<br />New York, NY 10013</p>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-8 md:p-12 border-none shadow-none bg-stone-50 dark:bg-neutral-900">
              <h2 className="font-display text-3xl mb-8 dark:text-white text-center">Send us a message</h2>
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('name');
                const email = formData.get('email');

                if (!name || !email) {
                  toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all required fields." });
                  return;
                }

                try {
                  await api.post('/api/contact', Object.fromEntries(formData));
                  toast({ title: "Message sent!", description: "We will get back to you soon." });
                  (e.target as HTMLFormElement).reset();
                } catch (err) {
                  console.error(err);
                  toast({ variant: "destructive", title: "Failed to send", description: "Please try again later." });
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Name</Label>
                    <Input id="name" name="name" data-testid="input-contact-name" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Email</Label>
                    <Input id="email" name="email" type="email" data-testid="input-contact-email" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Subject</Label>
                  <Input id="subject" name="subject" data-testid="input-contact-subject" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Message</Label>
                  <Textarea id="message" name="message" rows={6} data-testid="input-contact-message" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600 resize-none" required />
                </div>
                <Button type="submit" className="w-full md:w-auto px-8 py-6 bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200 transition-all duration-200 uppercase tracking-wider text-sm font-medium" data-testid="button-send-message">
                  Send Message
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>
    </PageLayout>
  );
}
