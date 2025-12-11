
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { Product } from "../../../shared/schema";
import { createClient } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

/**
 * Fetches a paginated list of products with robust error handling, timeout, and real-time updates.
 */
export interface UseProductsParams {
  limit?: number;
  offset?: number;
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  fabric?: string;
  size?: string;
  colour?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'name_asc';
  isSignature?: boolean;
}

/**
 * Fetches a paginated list of products with robust error handling, timeout, and real-time updates.
 */
export function useProducts(params?: UseProductsParams) {
  const key = ["products", params];
  
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.offset) q.set("offset", String(params.offset));
      if (params?.categoryId) q.set("categoryId", params.categoryId);
      if (params?.categorySlug) q.set("categorySlug", params.categorySlug);
      if (params?.search) q.set("search", params.search);
      if (params?.fabric) q.set("fabric", params.fabric);
      if (params?.size) q.set("size", params.size);
      if (params?.colour) q.set("colour", params.colour);
      if (params?.minPrice) q.set("minPrice", String(params.minPrice));
      if (params?.maxPrice) q.set("maxPrice", String(params.maxPrice));
      if (params?.sortBy) q.set("sortBy", params.sortBy);
      if (params?.isSignature) q.set("isSignature", "true");
      
      try {
        return await api.get<{ items: Product[]; total: number }>(`/api/products${q.size ? `?${q}` : ""}`, undefined, 10000);
      } catch (e: any) {
        throw new Error(e?.message || "Failed to fetch products");
      }
    },
  });

  return query;
}


/**
 * Fetches a single product by id or slug with robust error handling and timeout.
 * Subscribes to real-time updates for this specific product.
 */
export function useProduct(idOrSlug: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!idOrSlug) return;

    // Only subscribe if it looks like a UUID or ID (not strictly checking slug vs ID here, but simple filtered listener is safe)
    // If idOrSlug is a slug, we might not readily catch updates by ID unless we know the ID.
    // For now, assuming we want updates. If it's a slug, this filter `id=eq.${idOrSlug}` might fail if idOrSlug is not a UUID.
    // However, the backend normally handles ID lookup.
    // To be safe, we only subscribe if we have the actual data ID from the query, OR we subscribe to table changes generally? 
    // No, that brings us back to square one.
    // Let's subscribe to *row* changes where `id` equals the loaded product ID.
    
    // We can't know the ID until data is loaded if idOrSlug is a slug.
    // But we can rely on `query.data?.id`.
    
    return; // Subscribing inside the component body below data check
  }, [idOrSlug]);

  const query = useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: async () => {
      try {
        return await api.get<Product>(`/api/products/${idOrSlug}`, undefined, 10000);
      } catch (e: any) {
        throw new Error(e?.message || "Failed to fetch product");
      }
    },
    enabled: Boolean(idOrSlug),
  });

  // Real-time subscription for this specific product
  useEffect(() => {
    if (!query.data?.id) return;

    const productId = query.data.id;
    const channel = supabase
      .channel(`product_${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        (payload) => {
          console.log('Real-time product update:', payload);
          queryClient.invalidateQueries({ queryKey: ["product", idOrSlug] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query.data?.id, idOrSlug, queryClient]);

  return query;
}


