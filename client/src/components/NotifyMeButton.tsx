/**
 * NotifyMeButton Component
 * Allows users to request notifications when out-of-stock products are back in stock
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NotifyMeButtonProps {
    productId: string;
    productName: string;
    variantId?: string;
    isOutOfStock: boolean;
    className?: string;
}

export default function NotifyMeButton({
    productId,
    productName,
    variantId,
    isOutOfStock,
    className,
}: NotifyMeButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const { toast } = useToast();

    if (!isOutOfStock) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post("/api/stock-notifications", {
                productId,
                variantId: variantId || null,
                email,
            });

            setIsSubscribed(true);
            toast({
                title: "Success! 🎉",
                description: "You'll be notified when this product is back in stock",
            });

            setTimeout(() => {
                setIsOpen(false);
                setEmail("");
            }, 1500);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to subscribe to notifications",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={className}
                    disabled={isSubscribed}
                >
                    {isSubscribed ? (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Subscribed
                        </>
                    ) : (
                        <>
                            <Bell className="mr-2 h-4 w-4" />
                            Notify Me
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Get Notified</DialogTitle>
                    <DialogDescription>
                        Enter your email to receive a notification when <strong>{productName}</strong> is back in stock.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Subscribing...
                                </>
                            ) : (
                                "Notify Me"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
