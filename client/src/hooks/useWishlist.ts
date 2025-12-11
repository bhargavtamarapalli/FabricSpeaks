/**
 * Wishlist Hooks
 * 
 * React Query hooks for wishlist management with optimistic updates,
 * caching, and real-time synchronization.
 * 
 * @module client/src/hooks/useWishlist
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Wishlist, WishlistItem, InsertWishlistItem } from "../../../shared/schema";

/**
 * Extended wishlist item with product details
 */
export interface WishlistItemWithProduct extends WishlistItem {
  product: {
    id: string;
    name: string;
    price: string;
    sale_price: string | null;
    images: any;
    stock_quantity: number;
    status: string;
  } | null;
  variant: {
    id: string;
    size: string | null;
    colour: string | null;
    stock_quantity: number;
    price_adjustment: string;
  } | null;
}

/**
 * Wishlist with item count
 */
export interface WishlistWithCount extends Wishlist {
  item_count: number;
}

/**
 * Wishlist with items
 */
export interface WishlistWithItems extends Wishlist {
  items: WishlistItemWithProduct[];
}

/**
 * Hook to fetch all wishlists for the current user
 * 
 * @returns Query result with wishlists array
 */
export function useWishlists() {
  return useQuery<WishlistWithCount[]>({
    queryKey: ["wishlists"],
    queryFn: async () => {
      try {
        return await api.get<WishlistWithCount[]>("/api/wishlists");
      } catch (error: any) {
        throw new Error(error?.message || "Failed to fetch wishlists");
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a specific wishlist with all items
 * 
 * @param wishlistId - Wishlist ID
 * @returns Query result with wishlist and items
 */
export function useWishlist(wishlistId: string | undefined) {
  return useQuery<WishlistWithItems>({
    queryKey: ["wishlist", wishlistId],
    queryFn: async () => {
      if (!wishlistId) throw new Error("Wishlist ID is required");
      
      try {
        return await api.get<WishlistWithItems>(`/api/wishlists/${wishlistId}`);
      } catch (error: any) {
        throw new Error(error?.message || "Failed to fetch wishlist");
      }
    },
    enabled: Boolean(wishlistId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get the default wishlist
 * Creates one if it doesn't exist
 * 
 * @returns Query result with default wishlist
 */
export function useDefaultWishlist() {
  return useQuery<Wishlist>({
    queryKey: ["wishlist", "default"],
    queryFn: async () => {
      try {
        return await api.get<Wishlist>("/api/wishlists/default");
      } catch (error: any) {
        throw new Error(error?.message || "Failed to fetch default wishlist");
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new wishlist
 * 
 * @returns Mutation for creating wishlists
 */
export function useCreateWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; is_default?: boolean }) => {
      try {
        return await api.post<Wishlist>("/api/wishlists", data);
      } catch (error: any) {
        throw new Error(error?.message || "Failed to create wishlist");
      }
    },
    onSuccess: () => {
      // Invalidate wishlists query to refetch
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });
}

/**
 * Hook to update a wishlist
 * 
 * @returns Mutation for updating wishlists
 */
export function useUpdateWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; is_default?: boolean };
    }) => {
      try {
        return await api.put<Wishlist>(`/api/wishlists/${id}`, data);
      } catch (error: any) {
        throw new Error(error?.message || "Failed to update wishlist");
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate specific wishlist and list
      queryClient.invalidateQueries({ queryKey: ["wishlist", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });
}

/**
 * Hook to delete a wishlist
 * 
 * @returns Mutation for deleting wishlists
 */
export function useDeleteWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await api.delete<{ success: boolean }>(`/api/wishlists/${id}`);
      } catch (error: any) {
        throw new Error(error?.message || "Failed to delete wishlist");
      }
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["wishlist", id] });
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });
}

/**
 * Hook to add an item to a wishlist
 * 
 * @returns Mutation for adding wishlist items
 */
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      wishlistId,
      productId,
      variantId,
      notes,
    }: {
      wishlistId: string;
      productId: string;
      variantId?: string | null;
      notes?: string;
    }) => {
      try {
        return await api.post<WishlistItem>(`/api/wishlists/${wishlistId}/items`, {
          product_id: productId,
          variant_id: variantId,
          notes,
        });
      } catch (error: any) {
        throw new Error(error?.message || "Failed to add item to wishlist");
      }
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["wishlist", variables.wishlistId] });

      // Snapshot previous value
      const previousWishlist = queryClient.getQueryData<WishlistWithItems>([
        "wishlist",
        variables.wishlistId,
      ]);

      // Optimistically update
      if (previousWishlist) {
        queryClient.setQueryData<WishlistWithItems>(
          ["wishlist", variables.wishlistId],
          {
            ...previousWishlist,
            items: [
              ...previousWishlist.items,
              {
                id: "temp-" + Date.now(),
                wishlist_id: variables.wishlistId,
                product_id: variables.productId,
                variant_id: variables.variantId || null,
                added_at: new Date(),
                notes: variables.notes || null,
                product: null,
                variant: null,
              } as WishlistItemWithProduct,
            ],
          }
        );
      }

      return { previousWishlist };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(
          ["wishlist", variables.wishlistId],
          context.previousWishlist
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate to get fresh data with product details
      queryClient.invalidateQueries({ queryKey: ["wishlist", variables.wishlistId] });
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });
}

/**
 * Hook to remove an item from a wishlist
 * 
 * @returns Mutation for removing wishlist items
 */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      wishlistId,
      itemId,
    }: {
      wishlistId: string;
      itemId: string;
    }) => {
      try {
        return await api.delete<{ success: boolean }>(
          `/api/wishlists/${wishlistId}/items/${itemId}`
        );
      } catch (error: any) {
        throw new Error(error?.message || "Failed to remove item from wishlist");
      }
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["wishlist", variables.wishlistId] });

      // Snapshot previous value
      const previousWishlist = queryClient.getQueryData<WishlistWithItems>([
        "wishlist",
        variables.wishlistId,
      ]);

      // Optimistically update
      if (previousWishlist) {
        queryClient.setQueryData<WishlistWithItems>(
          ["wishlist", variables.wishlistId],
          {
            ...previousWishlist,
            items: previousWishlist.items.filter((item) => item.id !== variables.itemId),
          }
        );
      }

      return { previousWishlist };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(
          ["wishlist", variables.wishlistId],
          context.previousWishlist
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["wishlist", variables.wishlistId] });
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });
}

/**
 * Hook to check if an item is in any wishlist
 * 
 * @param productId - Product ID to check
 * @param variantId - Optional variant ID
 * @returns Boolean indicating if item is in wishlist
 */
export function useIsInWishlist(productId: string, variantId?: string | null) {
  const { data: wishlists } = useWishlists();
  const { data: defaultWishlist } = useDefaultWishlist();

  // Check if item is in default wishlist
  const { data: wishlistData } = useWishlist(defaultWishlist?.id);

  if (!wishlistData?.items) return false;

  return wishlistData.items.some(
    (item) =>
      item.product_id === productId &&
      (variantId ? item.variant_id === variantId : item.variant_id === null)
  );
}
