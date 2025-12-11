/**
 * CouponInput Component
 * Allows users to enter and apply coupon codes
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Tag, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface CouponInputProps {
    orderTotal: number;
    onCouponApplied: (coupon: AppliedCoupon) => void;
    onCouponRemoved: () => void;
    appliedCoupon?: AppliedCoupon | null;
    className?: string;
}

export interface AppliedCoupon {
    id: string;
    code: string;
    description?: string;
    discountAmount: number;
    discountType: string;
    discountValue: string;
}

export default function CouponInput({
    orderTotal,
    onCouponApplied,
    onCouponRemoved,
    appliedCoupon,
    className,
}: CouponInputProps) {
    const [code, setCode] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const { toast } = useToast();

    const handleApplyCoupon = async () => {
        if (!code || code.trim().length === 0) {
            toast({
                title: "Invalid Code",
                description: "Please enter a coupon code",
                variant: "destructive",
            });
            return;
        }

        setIsValidating(true);

        try {
            const response = await api.post("/api/coupons/validate", {
                code: code.trim().toUpperCase(),
                orderTotal,
            });

            if (response.valid) {
                onCouponApplied({
                    id: response.coupon.id,
                    code: response.coupon.code,
                    description: response.coupon.description,
                    discountAmount: response.discountAmount,
                    discountType: response.coupon.discount_type,
                    discountValue: response.coupon.discount_value,
                });

                toast({
                    title: "Coupon Applied! 🎉",
                    description: `You saved ₹${response.discountAmount.toFixed(2)}`,
                });

                setCode("");
            }
        } catch (error: any) {
            toast({
                title: "Invalid Coupon",
                description: error?.error || error?.message || "This coupon code is not valid",
                variant: "destructive",
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemoveCoupon = () => {
        onCouponRemoved();
        setCode("");
        toast({
            title: "Coupon Removed",
            description: "The coupon has been removed from your order",
        });
    };

    if (appliedCoupon) {
        return (
            <div className={`flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg ${className}`}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-green-900 dark:text-green-100">
                                {appliedCoupon.code}
                            </span>
                            <span className="text-sm text-green-700 dark:text-green-300">
                                applied
                            </span>
                        </div>
                        {appliedCoupon.description && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                                {appliedCoupon.description}
                            </p>
                        )}
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            Discount: ₹{appliedCoupon.discountAmount.toFixed(2)}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCoupon}
                    className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Have a coupon code?
            </label>
            <div className="flex gap-2">
                <Input
                    type="text"
                    placeholder="Enter coupon code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => {
                        if (e.key === "Enter") {
                            handleApplyCoupon();
                        }
                    }}
                    disabled={isValidating}
                    className="flex-1"
                />
                <Button
                    onClick={handleApplyCoupon}
                    disabled={isValidating || !code}
                    variant="outline"
                >
                    {isValidating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Applying...
                        </>
                    ) : (
                        "Apply"
                    )}
                </Button>
            </div>
        </div>
    );
}
