import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useCheckout, useVerifyPayment } from "@/hooks/useOrders";
import { useCartValidation } from "@/hooks/useCartValidation";
import { CartValidationBanner } from "@/components/CartValidation";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, CreditCard } from "lucide-react";


declare const window: any;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const cartQuery = useCart();
  const checkout = useCheckout();
  const validationQuery = useCartValidation(cartQuery.data);
  const cartItems = (cartQuery.data?.items || []).map(i => ({ id: i.id, name: 'Item', size: i.size || '', quantity: i.quantity, price: i.unit_price }));
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const shipping = 20;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  const verifyPayment = useVerifyPayment();

  const hasValidationErrors = validationQuery.data?.errors && validationQuery.data.errors.length > 0;

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePlaceOrder = async () => {
    // Pre-checkout validation
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (hasValidationErrors) {
      alert("Please fix the items in your cart before checkout");
      return;
    }

    // Guest Validation
    if (!user) {
      if (!formData.email || !formData.phone) {
        alert("Please provide Email and Phone Number for guest checkout.");
        return;
      }
    }

    try {
      const payload: any = {
        cart: cartQuery.data, // Required by useCheckout hook
        guest_email: user ? undefined : formData.email,
        guest_phone: user ? undefined : formData.phone
      };

      const res: any = await checkout.mutateAsync(payload);
      const razorpayOrder = res.razorpayOrder;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Fabric Speaks",
        description: "Test Transaction",
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          const data = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            // Pass guest info again for verification handler to create user/order if needed
            guest_email: user ? undefined : formData.email,
            guest_phone: user ? undefined : formData.phone
          };

          await verifyPayment.mutateAsync(data);

          setLocation('/checkout-success');
        },
        prefill: {
          name: user?.username || `${formData.firstName} ${formData.lastName}`.trim() || "Guest",
          email: user ? (user.username + "@fabric-speaks.local") : formData.email,
          contact: user ? "9999999999" : formData.phone, // TODO: Get actual phone from user profile
        },
        notes: {
          address: "Razorpay Corporate Office",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (e: any) {
      alert(e.message || "Checkout failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-300">
      <Header cartItemCount={cartItems.length} />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-center"
          >
            <span className="text-amber-600 font-bold uppercase text-sm mb-4 block tracking-[0.2em]">
              Secure Checkout
            </span>
            <h1 className="font-display text-4xl md:text-5xl mb-4 dark:text-white">Finalize Your Order</h1>
            <p className="text-stone-500 dark:text-neutral-400 font-light text-lg flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" /> Encrypted & Secure Transaction
            </p>
          </motion.div>

          {/* Validation Banner */}
          {validationQuery.data && (
            <div className="mb-8">
              <CartValidationBanner
                errors={validationQuery.data.errors || []}
                warnings={validationQuery.data.warnings || []}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              <Card className="p-8 border-none shadow-none bg-stone-50 dark:bg-neutral-900">
                <h2 className="font-display text-2xl mb-6 dark:text-white">Shipping Information</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">First Name</Label>
                      <Input id="firstName" value={formData.firstName} onChange={handleInputChange} data-testid="input-checkout-firstname" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Last Name</Label>
                      <Input id="lastName" value={formData.lastName} onChange={handleInputChange} data-testid="input-checkout-lastname" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Email {user ? '(Logged In)' : '(Required for Guest)'}</Label>
                    <Input id="email" type="email" value={user ? (user.email || user.username + "@fabric-speaks.local") : formData.email} onChange={handleInputChange} disabled={!!user} data-testid="input-checkout-email" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Phone {user ? '(Logged In)' : '(Required for Guest)'}</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="e.g. 9876543210" data-testid="input-checkout-phone" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Address</Label>
                    <Input id="address" value={formData.address} onChange={handleInputChange} data-testid="input-checkout-address" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">City</Label>
                      <Input id="city" value={formData.city} onChange={handleInputChange} data-testid="input-checkout-city" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">ZIP Code</Label>
                      <Input id="zip" value={formData.zip} onChange={handleInputChange} data-testid="input-checkout-zip" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-none shadow-none bg-stone-50 dark:bg-neutral-900">
                <h2 className="font-display text-2xl mb-6 dark:text-white flex items-center gap-2">
                  Payment Information <CreditCard className="h-5 w-5 text-stone-400" />
                </h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Card Number</Label>
                    <Input id="cardNumber" value={formData.cardNumber} onChange={handleInputChange} placeholder="1234 5678 9012 3456" data-testid="input-checkout-card" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="expiry" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Expiry Date</Label>
                      <Input id="expiry" value={formData.expiry} onChange={handleInputChange} placeholder="MM/YY" data-testid="input-checkout-expiry" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">CVV</Label>
                      <Input id="cvv" value={formData.cvv} onChange={handleInputChange} placeholder="123" data-testid="input-checkout-cvv" className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-neutral-400 mt-4">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    Payments are processed securely by Razorpay
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="p-8 sticky top-24 border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg dark:shadow-none">
                <h2 className="font-display text-2xl mb-6 dark:text-white">Order Summary</h2>

                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-2 border-b border-stone-100 dark:border-neutral-800 last:border-0">
                      <div>
                        <p className="font-medium text-stone-900 dark:text-white">{item.name}</p>
                        <p className="text-stone-500 dark:text-neutral-400">Size: {item.size} × {item.quantity}</p>
                      </div>
                      <p className="font-medium text-stone-900 dark:text-white">₹{item.price}</p>
                    </div>
                  ))}
                </div>

                <Separator className="my-6 bg-stone-200 dark:bg-neutral-800" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-neutral-400">Subtotal</span>
                    <span data-testid="text-checkout-subtotal" className="font-medium dark:text-white">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-neutral-400">Shipping</span>
                    <span data-testid="text-checkout-shipping" className="font-medium dark:text-white">₹{shipping}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-neutral-400">Tax</span>
                    <span data-testid="text-checkout-tax" className="font-medium dark:text-white">₹{tax}</span>
                  </div>
                </div>

                <Separator className="my-6 bg-stone-200 dark:bg-neutral-800" />

                <div className="flex justify-between text-xl font-display mb-8 dark:text-white">
                  <span>Total</span>
                  <span data-testid="text-checkout-total">₹{total}</span>
                </div>

                <Button
                  className="w-full py-6 text-lg bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200 transition-all duration-300"
                  onClick={handlePlaceOrder}
                  disabled={hasValidationErrors || cartItems.length === 0}
                  data-testid="button-place-order"
                >
                  {hasValidationErrors ? "Fix Cart Issues First" : "Place Order"}
                </Button>

                <p className="text-xs text-center text-stone-400 dark:text-neutral-500 mt-4">
                  By placing this order, you agree to our Terms of Service and Privacy Policy.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
