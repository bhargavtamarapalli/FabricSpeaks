import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { Order } from "../../../shared/schema";
import { supabase } from "@/lib/supabase";


/**
 * Fetches the current user's orders with robust error handling, timeout, and real-time updates.
 */
export function useOrders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      try {
        return await api.get<Order[]>("/api/orders", undefined, 10000);
      } catch (e: any) {
        throw new Error(e?.message || "Failed to fetch orders");
      }
    },
  });

  // Set up real-time subscription for products table changes to invalidate orders
  useEffect(() => {
    const channel = supabase
      .channel('orders_products_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Real-time product change for orders:', payload);
          // Invalidate orders queries on product changes to reflect stock updates
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}


/**
 * Performs checkout and creates an order with robust error handling and timeout.
 */
export function useVerifyPayment() {
  return useMutation({
    mutationFn: async (payload: any) => {
      try {
        return await api.post<{ order: Order }>("/api/orders/verify", payload, undefined, 10000);
      } catch (e: any) {
        throw new Error(e?.message || "Payment verification failed");
      }
    },
  });
}

/**
 * Initiates checkout (creates Razorpay order on server)
 */
export function useCheckout() {
  return useMutation({
    mutationFn: async (payload: any) => {
      try {
        if (!payload.cart || payload.cart.items.length === 0) {
          throw new Error("Cart is empty");
        }

        const validationResponse = await api.post<any>(
          "/api/cart/validate-for-checkout",
          { cart: payload.cart },
          undefined,
          10000
        );

        if (!validationResponse.isValid) {
          const errorMessages = validationResponse.errors
            .map((e: any) => e.message)
            .join("; ");
          throw new Error(`Cart validation failed: ${errorMessages}`);
        }

        return await api.post<any>("/api/orders/checkout", payload, undefined, 10000);
      } catch (e: any) {
        throw new Error(e?.message || "Checkout failed");
      }
    }
  });
}


