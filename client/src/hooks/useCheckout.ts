import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/useCart";
import { useCheckout as usePlaceOrder, useVerifyPayment } from "@/hooks/useOrders";
import { useCartValidation } from "@/hooks/useCartValidation";
import type {
  CheckoutStep,
  CheckoutState,
  ShippingInfo,
  BillingInfo,
  PaymentInfo,
  OrderSummary
} from "@/types/checkout";
import {
  shippingInfoSchema,
  billingInfoSchema,
  paymentInfoSchema,
  checkoutFormSchema
} from "@/types/checkout";
import {
  calculateOrderTotals,
  canProceedToCheckout,
  getCheckoutValidationSummary,
  sanitizeAddressForAPI
} from "@/lib/checkout-utils";
import { api } from "@/lib/api";

const STEPS: CheckoutStep[] = ["shipping", "payment", "review"];

export function useCheckout() {
  const [, setLocation] = useLocation();
  const cartQuery = useCart();
  const cartValidation = useCartValidation(cartQuery.data);
  const placeOrderMutation = usePlaceOrder();
  const verifyPaymentMutation = useVerifyPayment();

  // Checkout state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(new Set());
  const [shippingData, setShippingData] = useState<Partial<ShippingInfo>>({});
  const [billingData, setBillingData] = useState<Partial<BillingInfo>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Razorpay window reference
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);

  // Forms
  const shippingForm = useForm<ShippingInfo>({
    resolver: zodResolver(shippingInfoSchema),
    mode: "onChange",
    defaultValues: {}
  });

  const billingForm = useForm<BillingInfo>({
    resolver: zodResolver(billingInfoSchema),
    mode: "onChange",
    defaultValues: {}
  });

  // Computed values
  const cartItems = cartQuery.data?.items || [];
  const orderSummary = useMemo(
    () => calculateOrderTotals(cartItems),
    [cartItems]
  );

  const validationSummary = useMemo(
    () => getCheckoutValidationSummary(cartValidation.data, {}, {}),
    [cartValidation.data]
  );

  const canProceed = useMemo(
    () => canProceedToCheckout(cartItems, validationSummary),
    [cartItems, validationSummary]
  );

  const isShippingValid = shippingForm.formState.isValid;
  const isBillingValid = billingForm.formState.isValid;

  // Actions
  const updateShipping = useCallback((data: Partial<ShippingInfo>) => {
    setShippingData(prev => ({ ...prev, ...data }));
  }, []);

  const updateBilling = useCallback((data: Partial<BillingInfo>) => {
    setBillingData(prev => ({ ...prev, ...data }));
  }, []);

  const validateStep = useCallback((step: CheckoutStep): boolean => {
    switch (step) {
      case "shipping":
        return isShippingValid;
      case "payment":
        return true; // Razorpay integration is handled separately
      case "review":
        return isShippingValid && canProceed;
      default:
        return false;
    }
  }, [isShippingValid, canProceed]);

  const nextStep = useCallback(async () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex >= STEPS.length - 1) return;

    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
      setErrors(["Please complete all required fields before proceeding."]);
      return;
    }

    // Mark current step as completed
    setCompletedSteps(prev => new Set(prev).add(currentStep));

    // Move to next step
    const nextStep = STEPS[currentIndex + 1];
    setCurrentStep(nextStep);
    setErrors([]);
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex <= 0) return;

    const prevStep = STEPS[currentIndex - 1];
    setCurrentStep(prevStep);
  }, [currentStep]);

  const placeOrder = useCallback(async () => {
    if (!canProceed) {
      setErrors(["Cannot proceed with checkout. Please review your cart."]);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors([]);

      // Create Razorpay order
      const response = await placeOrderMutation.mutateAsync({ cart: cartQuery.data });
      const order = response.razorpayOrder;
      setRazorpayOrder(order);

      // Check if Razorpay is loaded
      if (!(window as any).Razorpay) {
        throw new Error("Razorpay SDK not loaded. Please check your internet connection.");
      }

      // Initialize Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Fabric Speaks",
        description: "Purchase",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verifyData = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            };

            await verifyPaymentMutation.mutateAsync(verifyData);
            setLocation("/orders");
          } catch (verifyError: any) {
            console.error("Payment verification failed:", verifyError);
            setErrors([verifyError?.message || "Payment verification failed"]);
          }
        },
        prefill: {
          name: shippingData.firstName + " " + shippingData.lastName,
          email: shippingData.email,
          contact: shippingData.phone,
        },
        notes: {
          address: `${shippingData.addressLine1}, ${shippingData.city}, ${shippingData.state} ${shippingData.postalCode}`,
        },
        theme: {
          color: "#000",
        },
        modal: {
          ondismiss: function() {
            setErrors(["Payment was cancelled. You can try again."]);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error("Checkout error:", error);
      setErrors([error?.message || "Failed to process checkout. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  }, [canProceed, placeOrderMutation, cartQuery.data, shippingData, verifyPaymentMutation, setLocation]);

  const reset = useCallback(() => {
    setCurrentStep("shipping");
    setCompletedSteps(new Set());
    setShippingData({});
    setBillingData({});
    setIsSubmitting(false);
    setErrors([]);
    shippingForm.reset();
    billingForm.reset();
  }, [shippingForm, billingForm]);

  // Handle shipping form submission
  const handleShippingSubmit = useCallback((data: ShippingInfo) => {
    updateShipping(data);

    // If same as billing is checked, copy shipping to billing
    if (data.sameAsBilling) {
      const billingFromShipping = {
        firstName: data.firstName,
        lastName: data.lastName,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || "",
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
      };
      setBillingData(billingFromShipping);
      billingForm.reset(billingFromShipping);
    }

    nextStep();
  }, [updateShipping, setBillingData, billingForm, nextStep]);

  // Effect to pre-populate forms with existing data
  useEffect(() => {
    if (shippingData.firstName) {
      shippingForm.reset(shippingData);
    }
    if (billingData.firstName) {
      billingForm.reset(billingData);
    }
  }, [shippingData, billingData, shippingForm, billingForm]);

  // Complete state object
  const state: CheckoutState = {
    currentStep,
    shipping: shippingData,
    billing: billingData,
    payment: { method: "razorpay" },
    orderSummary,
    isValid: {
      shipping: isShippingValid,
      payment: true,
      review: isShippingValid && canProceed
    },
    isSubmitting,
    errors
  };

  return {
    state,
    forms: {
      shipping: shippingForm,
      billing: billingForm
    },
    actions: {
      updateShipping,
      updateBilling,
      validateStep,
      nextStep,
      prevStep,
      placeOrder,
      reset,
      handleShippingSubmit
    },
    validation: validationSummary,
    canProceed,
    isLoading: cartQuery.isLoading || cartValidation.isLoading
  };
}
