import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart, useCartTotals } from "@/hooks/useCart";
import { useCheckout, useVerifyPayment } from "@/hooks/useOrders";
import { useCartValidation } from "@/hooks/useCartValidation";
import { useAddresses, useMe } from "@/hooks/useProfile";
import { CartValidationBanner } from "@/components/CartValidation";
import CouponInput, { AppliedCoupon } from "@/components/CouponInput";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, Plus, MapPin, Loader2, Package, Truck, Gift, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

declare const window: any;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const cartQuery = useCart();
  const checkout = useCheckout();
  const validationQuery = useCartValidation(cartQuery.data);
  const totals = useCartTotals();
  const meQuery = useMe();
  const { list: addressesQuery } = useAddresses();
  const verifyPayment = useVerifyPayment();

  // Cart items with proper product names and images
  const cartItems = (cartQuery.data?.items || []).map(i => ({
    id: i.id,
    name: i.product_name || 'Unnamed Product',
    size: i.size || '',
    colour: i.colour || '',
    quantity: i.quantity,
    price: typeof i.unit_price === 'string' ? parseFloat(i.unit_price) : i.unit_price,
    image: i.product_images?.[0] || '/placeholder-image.jpg'
  }));

  const hasValidationErrors = validationQuery.data?.errors && validationQuery.data.errors.length > 0;
  const isProcessing = checkout.isPending || verifyPayment.isPending;

  // Address State
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Delivery Options
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');
  const [giftMessage, setGiftMessage] = useState("");
  const [showGiftMessage, setShowGiftMessage] = useState(false);

  // Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Form State for new address / guest
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India"
  });

  // Pre-fill user data
  useEffect(() => {
    if (meQuery.data) {
      const nameParts = (meQuery.data.full_name || '').split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || prev.firstName,
        lastName: nameParts.slice(1).join(' ') || prev.lastName,
        email: meQuery.data.email || prev.email,
        phone: meQuery.data.phone || prev.phone
      }));
    }
  }, [meQuery.data]);

  // Auto-select default address
  useEffect(() => {
    if (addressesQuery.data && addressesQuery.data.length > 0 && !selectedAddressId) {
      const defaultAddr = addressesQuery.data.find((a: any) => a.is_default);
      setSelectedAddressId(defaultAddr?.id || addressesQuery.data[0].id);
    }
  }, [addressesQuery.data, selectedAddressId]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartQuery.isLoading && cartItems.length === 0) {
      toast({ title: "Your cart is empty", description: "Add some items before checkout." });
      setLocation('/');
    }
  }, [cartQuery.isLoading, cartItems.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const getSelectedAddress = () => {
    if (!selectedAddressId || !addressesQuery.data) return null;
    return addressesQuery.data.find((a: any) => a.id === selectedAddressId);
  };

  // Calculate final total
  const expressDeliveryFee = deliveryOption === 'express' ? 99 : 0;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const finalTotal = totals.total + expressDeliveryFee - couponDiscount;

  // Estimated delivery dates
  const today = new Date();
  const standardDelivery = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
  const expressDelivery = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  const handlePlaceOrder = async () => {
    // Validation
    if (cartItems.length === 0) {
      toast({ variant: "destructive", title: "Cart is empty" });
      return;
    }

    if (hasValidationErrors) {
      toast({ variant: "destructive", title: "Please fix cart issues first" });
      return;
    }

    // Address validation
    const selectedAddress = getSelectedAddress();
    if (user && !selectedAddress && !showNewAddressForm) {
      toast({ variant: "destructive", title: "Please select a shipping address" });
      return;
    }

    if (!user || showNewAddressForm) {
      if (!formData.address || !formData.city || !formData.zip) {
        toast({ variant: "destructive", title: "Please fill in address details" });
        return;
      }
      if (!user && (!formData.email || !formData.phone)) {
        toast({ variant: "destructive", title: "Email and Phone are required for guest checkout" });
        return;
      }
    }

    try {
      const shippingAddress = selectedAddress ? {
        name: selectedAddress.name || `${formData.firstName} ${formData.lastName}`,
        line1: selectedAddress.line1,
        line2: selectedAddress.line2,
        city: selectedAddress.city,
        state: selectedAddress.region,
        postal_code: selectedAddress.postalCode,
        country: selectedAddress.country,
        phone: selectedAddress.phone
      } : {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        line1: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.zip,
        country: formData.country,
        phone: formData.phone
      };

      const payload: any = {
        cart: cartQuery.data,
        shipping_address: shippingAddress,
        delivery_option: deliveryOption,
        gift_message: showGiftMessage ? giftMessage : undefined,
        coupon_code: appliedCoupon?.code,
        guest_email: user ? undefined : formData.email,
        guest_phone: user ? undefined : formData.phone
      };

      const res: any = await checkout.mutateAsync(payload);
      const razorpayOrder = res.razorpayOrder;

      // DEBUG: Log Razorpay key and order
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;


      if (!razorpayKeyId) {
        toast({
          title: "Configuration Error",
          description: "Payment gateway not configured. Please contact support.",
          variant: "destructive"
        });
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Fabric Speaks",
        description: `Order - ${cartItems.length} item(s)`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {

          const data = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            shipping_address: shippingAddress,
            delivery_option: deliveryOption,
            gift_message: showGiftMessage ? giftMessage : undefined,
            coupon_code: appliedCoupon?.code,
            guest_email: user ? undefined : formData.email,
            guest_phone: user ? undefined : formData.phone
          };

          await verifyPayment.mutateAsync(data);
          setLocation('/orders');
          toast({ title: "Order placed successfully!", description: "Thank you for your purchase." });
        },
        prefill: {
          name: selectedAddress?.name || `${formData.firstName} ${formData.lastName}`.trim() || "Guest",
          email: user?.email || formData.email,
          contact: selectedAddress?.phone || formData.phone || "",
        },
        theme: {
          color: "#78716c", // stone-500
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('[Checkout] Payment failed:', response.error);
        toast({ variant: "destructive", title: "Payment failed", description: response.error.description });
      });
      rzp.open();

    } catch (e: any) {
      console.error('[Checkout] Error:', e);
      toast({ variant: "destructive", title: "Checkout failed", description: e.message || "Please try again." });
    }
  };

  if (cartQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <PageLayout className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
      <main className="flex-1 py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <span className="text-amber-600 font-bold uppercase text-sm mb-3 block tracking-[0.2em]">
              Secure Checkout
            </span>
            <h1 className="font-display text-3xl md:text-4xl mb-3 dark:text-white">Finalize Your Order</h1>
            <p className="text-stone-500 dark:text-neutral-400 font-light flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" /> Encrypted & Secure Transaction
            </p>
          </motion.div>

          {/* Validation Banner */}
          {validationQuery.data && (
            <div className="mb-6">
              <CartValidationBanner
                errors={validationQuery.data.errors || []}
                warnings={validationQuery.data.warnings || []}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Forms */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3 space-y-6"
            >
              {/* Shipping Address */}
              <Card className="p-6 border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl dark:text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-600" /> Shipping Address
                  </h2>
                  {user && addressesQuery.data && addressesQuery.data.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {showNewAddressForm ? 'Use Saved' : 'New Address'}
                    </Button>
                  )}
                </div>

                {/* Saved Addresses for logged-in users */}
                {user && addressesQuery.data && addressesQuery.data.length > 0 && !showNewAddressForm ? (
                  <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId}>
                    <div className="space-y-3">
                      {addressesQuery.data.map((addr: any) => (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${selectedAddressId === addr.id
                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-stone-200 dark:border-neutral-700 hover:border-stone-300'
                            }`}
                        >
                          <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium dark:text-white">{addr.name || addr.label || 'Address'}</span>
                              {addr.is_default && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Default</span>
                              )}
                            </div>
                            <p className="text-sm text-stone-600 dark:text-neutral-400 mt-1">
                              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                            </p>
                            <p className="text-sm text-stone-600 dark:text-neutral-400">
                              {addr.city}, {addr.region} {addr.postalCode}
                            </p>
                            {addr.phone && (
                              <p className="text-sm text-stone-500 dark:text-neutral-500 mt-1">📞 {addr.phone}</p>
                            )}
                          </div>
                          {selectedAddressId === addr.id && (
                            <Check className="h-5 w-5 text-amber-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  /* New Address Form / Guest Form */
                  <div className="space-y-4">
                    {/* Login Option for Guests */}
                    {!user && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-amber-900 dark:text-amber-200">Already have an account?</p>
                            <p className="text-sm text-amber-700 dark:text-amber-400">Sign in for faster checkout and order tracking</p>
                          </div>
                          <Button
                            variant="outline"
                            className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-900/30"
                            onClick={() => document.dispatchEvent(new Event('open-auth'))}
                          >
                            Login
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-xs uppercase tracking-wider text-stone-500">First Name</Label>
                        <Input id="firstName" value={formData.firstName} onChange={handleInputChange} className="bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-xs uppercase tracking-wider text-stone-500">Last Name</Label>
                        <Input id="lastName" value={formData.lastName} onChange={handleInputChange} className="bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700" />
                      </div>
                    </div>
                    {!user && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-xs uppercase tracking-wider text-stone-500">Email *</Label>
                          <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-stone-500">Phone *</Label>
                          <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="9876543210" className="bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700" />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-xs uppercase tracking-wider text-stone-500">Street Address *</Label>
                      <Input id="address" value={formData.address} onChange={handleInputChange} className="bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-xs uppercase tracking-wider text-stone-500">City *</Label>
                        <Input id="city" value={formData.city} onChange={handleInputChange} className="bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-xs uppercase tracking-wider text-stone-500">State</Label>
                        <Input id="state" value={formData.state} onChange={handleInputChange} className="bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zip" className="text-xs uppercase tracking-wider text-stone-500">PIN Code *</Label>
                        <Input id="zip" value={formData.zip} onChange={handleInputChange} className="bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-xs uppercase tracking-wider text-stone-500">Country</Label>
                        <Input id="country" value={formData.country} onChange={handleInputChange} disabled className="bg-stone-100 dark:bg-neutral-900 border-stone-200 dark:border-neutral-700" />
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Delivery Options */}
              <Card className="p-6 border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <h2 className="font-display text-xl mb-4 dark:text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-amber-600" /> Delivery Options
                </h2>
                <RadioGroup value={deliveryOption} onValueChange={(v) => setDeliveryOption(v as any)}>
                  <div className="space-y-3">
                    <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${deliveryOption === 'standard' ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'border-stone-200 dark:border-neutral-700'
                      }`}>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="standard" id="standard" />
                        <div>
                          <p className="font-medium dark:text-white">Standard Delivery</p>
                          <p className="text-sm text-stone-500">Arrives by {formatDate(standardDelivery)}</p>
                        </div>
                      </div>
                      <span className="font-medium text-green-600">{totals.shipping === 0 ? 'FREE' : `₹${totals.shipping}`}</span>
                    </label>
                    <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${deliveryOption === 'express' ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'border-stone-200 dark:border-neutral-700'
                      }`}>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="express" id="express" />
                        <div>
                          <p className="font-medium dark:text-white">Express Delivery</p>
                          <p className="text-sm text-stone-500">Arrives by {formatDate(expressDelivery)}</p>
                        </div>
                      </div>
                      <span className="font-medium dark:text-white">₹99</span>
                    </label>
                  </div>
                </RadioGroup>
              </Card>

              {/* Gift Message */}
              <Card className="p-6 border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <button
                  onClick={() => setShowGiftMessage(!showGiftMessage)}
                  className="w-full flex items-center justify-between"
                >
                  <h2 className="font-display text-xl dark:text-white flex items-center gap-2">
                    <Gift className="h-5 w-5 text-amber-600" /> Add Gift Message
                  </h2>
                  {showGiftMessage ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                {showGiftMessage && (
                  <div className="mt-4">
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Write your message here..."
                      className="w-full p-3 rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                      maxLength={200}
                    />
                    <p className="text-xs text-stone-400 mt-1 text-right">{giftMessage.length}/200</p>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Right Column - Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="p-6 sticky top-24 border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg dark:shadow-none">
                <h2 className="font-display text-xl mb-6 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-600" /> Order Summary
                </h2>

                {/* Cart Items with Images */}
                <div className="space-y-4 mb-6 max-h-[280px] overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 py-2 border-b border-stone-100 dark:border-neutral-800 last:border-0">
                      <div className="w-16 h-20 rounded-md overflow-hidden bg-stone-100 dark:bg-neutral-800 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-stone-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-stone-500 dark:text-neutral-400 mt-0.5">
                          {item.colour && item.size
                            ? `${item.colour} · Size: ${item.size}`
                            : item.colour
                              ? item.colour
                              : item.size
                                ? `Size: ${item.size}`
                                : ''
                          } × {item.quantity}
                        </p>
                        <p className="text-sm font-medium text-stone-900 dark:text-white mt-1">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code */}
                <CouponInput
                  orderTotal={totals.subtotal}
                  appliedCoupon={appliedCoupon}
                  onCouponApplied={setAppliedCoupon}
                  onCouponRemoved={() => setAppliedCoupon(null)}
                  className="mb-4"
                />

                <Separator className="my-4 bg-stone-200 dark:bg-neutral-800" />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-neutral-400">Subtotal</span>
                    <span className="font-medium dark:text-white">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-neutral-400">Shipping</span>
                    <span className="font-medium dark:text-white">
                      {totals.shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${totals.shipping}`}
                    </span>
                  </div>
                  {deliveryOption === 'express' && (
                    <div className="flex justify-between">
                      <span className="text-stone-600 dark:text-neutral-400">Express Delivery</span>
                      <span className="font-medium dark:text-white">₹99</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-neutral-400">Tax (GST)</span>
                    <span className="font-medium dark:text-white">₹{totals.tax.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4 bg-stone-200 dark:bg-neutral-800" />

                <div className="flex justify-between text-lg font-display mb-6 dark:text-white">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full py-6 text-base bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200 transition-all duration-300"
                  onClick={handlePlaceOrder}
                  disabled={hasValidationErrors || cartItems.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                    </>
                  ) : hasValidationErrors ? (
                    "Fix Cart Issues First"
                  ) : (
                    "Place Order"
                  )}
                </Button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400 dark:text-neutral-500">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  Secure checkout powered by Razorpay
                </div>

                <p className="text-xs text-center text-stone-400 dark:text-neutral-500 mt-3">
                  By placing this order, you agree to our Terms of Service and Privacy Policy.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
