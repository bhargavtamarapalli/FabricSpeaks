/**
 * Cart Hooks
 * 
 * React hooks for cart operations with:
 * - Server-side cart storage (guests + authenticated)
 * - Optimistic updates
 * - Real-time inventory sync
 * - User-friendly error handling
 * 
 * @module hooks/useCart
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { getSessionId, clearGuestSession } from "@/lib/guestCart";
import { CartConfig } from "../../../shared/config/cart.config";
import { useToast } from "@/hooks/use-toast";

// ============================================================================
// Types
// ============================================================================

export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string | null;
  unit_price: number | string;
  quantity: number;
  size?: string | null;
  colour?: string | null;
  // Extended fields from server join
  product_name?: string;
  product_images?: string[];
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  success?: boolean;
  message?: string;
}

export interface CartError {
  code: string;
  message: string;
  userAction?: string | null;
  details?: Record<string, any>;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get session headers for API requests
 */
function getCartHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const sessionId = getSessionId();
  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }
  return headers;
}

/**
 * Parse API error into user-friendly message
 */
function parseCartError(error: any): CartError {
  // Server returned structured error
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Error message from API client
  if (error?.message) {
    return {
      code: 'UNKNOWN',
      message: error.message,
      userAction: 'Please try again.'
    };
  }
  
  return {
    code: 'UNKNOWN',
    message: 'Something went wrong.',
    userAction: 'Please try again.'
  };
}

// ============================================================================
// useCart - Fetch cart
// ============================================================================

/**
 * Fetches the current user's cart
 * Supports both authenticated users and guest users (via session ID)
 */
export function useCart() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cart"],
    queryFn: async (): Promise<Cart> => {
      const sessionId = getSessionId();
      const authToken = localStorage.getItem('auth_token');
      
      // Fresh guest with no session - return empty cart
      if (!sessionId && !authToken) {
        return { id: 'new-guest', items: [], subtotal: 0 };
      }
      
      try {
        const response = await api.get<Cart>("/api/cart", getCartHeaders(), CartConfig.CART_OPERATION_TIMEOUT_MS);
        return response;
      } catch (e: any) {
        // Unauthorized - return empty cart
        if (e?.status === 401 || e?.message?.includes('401')) {
          return { id: 'guest', items: [], subtotal: 0 };
        }
        throw e;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Get product IDs for targeted real-time subscription
  const productIds = useMemo(() => 
    query.data?.items?.map(item => item.product_id) || [],
    [query.data?.items]
  );

  // Single real-time subscription for cart-related products
  useEffect(() => {
    if (productIds.length === 0) return;

    const channel = supabase
      .channel('cart_inventory_sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
        },
        (payload: any) => {
          // Only invalidate if it affects cart products
          if (productIds.includes(payload.new?.id)) {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.invalidateQueries({ queryKey: ["cart-validation"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productIds.join(','), queryClient]);

  return query;
}

// ============================================================================
// useAddToCart - Add item to cart
// ============================================================================

export interface AddToCartInput {
  product_id: string;
  variant_id?: string;
  quantity: number;
  size?: string;
}

/**
 * Adds an item to the cart
 * Server validates stock and looks up current price
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: AddToCartInput): Promise<Cart> => {
      const response = await api.post<Cart>(
        "/api/cart/items",
        {
          product_id: input.product_id,
          variant_id: input.variant_id,
          quantity: input.quantity,
          size: input.size,
        },
        getCartHeaders(),
        CartConfig.CART_OPERATION_TIMEOUT_MS
      );
      return response;
    },
    
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<Cart>(["cart"]);
      
      // Optimistic update
      if (previousCart) {
        const tempId = `temp_${Date.now()}`;
        const optimisticCart: Cart = {
          ...previousCart,
          items: [
            ...previousCart.items,
            {
              id: tempId,
              product_id: input.product_id,
              variant_id: input.variant_id || null,
              unit_price: 0, // Will be set by server
              quantity: input.quantity,
              size: input.size || null,
            }
          ],
        };
        queryClient.setQueryData(["cart"], optimisticCart);
      }
      
      return { previousCart };
    },
    
    onError: (error: any, _input, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
      
      const cartError = parseCartError(error);
      toast({
        variant: "destructive",
        title: cartError.message,
        description: cartError.userAction,
      });
    },
    
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      if (data.message) {
        toast({
          title: data.message,
        });
      }
    },
  });
}

// ============================================================================
// useUpdateCartItem - Update item quantity
// ============================================================================

export interface UpdateCartItemInput {
  id: string;
  quantity: number;
}

/**
 * Updates a cart item's quantity
 * Server validates stock availability
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateCartItemInput): Promise<Cart> => {
      return await api.put<Cart>(
        `/api/cart/items/${input.id}`,
        { quantity: input.quantity },
        getCartHeaders(),
        CartConfig.CART_OPERATION_TIMEOUT_MS
      );
    },
    
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<Cart>(["cart"]);
      
      // Optimistic update
      if (previousCart) {
        const optimisticCart: Cart = {
          ...previousCart,
          items: previousCart.items.map(item =>
            item.id === input.id
              ? { ...item, quantity: input.quantity }
              : item
          ),
        };
        queryClient.setQueryData(["cart"], optimisticCart);
      }
      
      return { previousCart };
    },
    
    onError: (error: any, _input, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
      
      const cartError = parseCartError(error);
      toast({
        variant: "destructive",
        title: cartError.message,
        description: cartError.userAction,
      });
    },
    
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });
}

// ============================================================================
// useRemoveCartItem - Remove item from cart
// ============================================================================

/**
 * Removes an item from the cart
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<Cart> => {
      return await api.delete<Cart>(
        `/api/cart/items/${id}`,
        getCartHeaders(),
        CartConfig.CART_OPERATION_TIMEOUT_MS
      );
    },
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<Cart>(["cart"]);
      
      // Optimistic update
      if (previousCart) {
        const optimisticCart: Cart = {
          ...previousCart,
          items: previousCart.items.filter(item => item.id !== id),
        };
        queryClient.setQueryData(["cart"], optimisticCart);
      }
      
      return { previousCart };
    },
    
    onError: (error: any, _id, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
      
      const cartError = parseCartError(error);
      toast({
        variant: "destructive",
        title: cartError.message,
        description: cartError.userAction,
      });
    },
    
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      toast({
        title: "Item removed from cart",
      });
    },
  });
}

// ============================================================================
// useMergeGuestCart - Merge guest cart on login
// ============================================================================

/**
 * Merges guest cart into user cart on login/registration
 */
export function useMergeGuestCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Cart | null> => {
      const sessionId = getSessionId();
      if (!sessionId) {
        return null;
      }
      
      try {
        const result = await api.post<Cart>(
          "/api/cart/merge",
          { session_id: sessionId },
          undefined,
          CartConfig.CART_OPERATION_TIMEOUT_MS
        );
        
        // Clear guest session after successful merge
        clearGuestSession();
        
        return result;
      } catch (e) {
        console.error('[Cart] Merge failed:', e);
        return null;
      }
    },
    
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(["cart"], data);
      }
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

// ============================================================================
// useCartTotals - Calculate cart totals
// ============================================================================

/**
 * Calculates cart totals using shared config
 */
export function useCartTotals() {
  const { data: cart } = useCart();
  
  return useMemo(() => {
    const items = cart?.items || [];
    
    const subtotal = items.reduce((sum, item) => {
      const price = typeof item.unit_price === 'string'
        ? parseFloat(item.unit_price)
        : item.unit_price;
      return sum + (price * item.quantity);
    }, 0);
    
    const shipping = subtotal >= CartConfig.FREE_SHIPPING_THRESHOLD
      ? 0
      : CartConfig.DEFAULT_SHIPPING_COST;
    
    const tax = Math.round(subtotal * CartConfig.TAX_RATE * 100) / 100;
    const total = subtotal + shipping + tax;
    
    return {
      subtotal,
      shipping,
      tax,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      freeShippingThreshold: CartConfig.FREE_SHIPPING_THRESHOLD,
      amountToFreeShipping: Math.max(0, CartConfig.FREE_SHIPPING_THRESHOLD - subtotal),
      currencySymbol: CartConfig.CURRENCY_SYMBOL,
    };
  }, [cart?.items]);
}
