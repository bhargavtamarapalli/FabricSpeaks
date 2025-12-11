/**
 * Infinite Scroll Hook using React Query
 * Implements cursor-based pagination for optimal performance
 * @module hooks/useInfiniteProducts
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

/**
 * Product interface
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  description: string | null;
  images: string[] | null;
  brand: string;
  category_id: string | null;
  status: string;
  created_at: Date;
  [key: string]: any;
}

/**
 * Paginated response interface
 */
interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Product filter options
 */
export interface ProductFilters {
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'name_asc';
}

/**
 * Hook options
 */
interface UseInfiniteProductsOptions {
  limit?: number;
  filters?: ProductFilters;
  enabled?: boolean;
}

/**
 * Fetch products with pagination
 */
async function fetchProducts(
  cursor: string | undefined,
  limit: number,
  filters: ProductFilters = {}
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  
  params.append('limit', limit.toString());
  if (cursor) params.append('cursor', cursor);
  
  // Add filters
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.categorySlug) params.append('categorySlug', filters.categorySlug);
  if (filters.search) params.append('search', filters.search);
  if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);

  const response = await fetch(`/api/products?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await response.json();
  
  // Handle both cursor and offset pagination responses
  if ('nextCursor' in data) {
    return data as PaginatedResponse<Product>;
  } else {
    // Convert offset-based response to cursor-based format
    return {
      items: data.items || [],
      nextCursor: null,
      hasMore: false,
      total: data.total,
    };
  }
}

/**
 * Custom hook for infinite scroll with cursor-based pagination
 * @param options - Configuration options
 * @returns React Query infinite query result with additional utilities
 */
export function useInfiniteProducts(options: UseInfiniteProductsOptions = {}) {
  const { limit = 20, filters = {}, enabled = true } = options;
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);

  const query = useInfiniteQuery({
    queryKey: ['products', 'infinite', limit, filters],
    queryFn: ({ pageParam }) => fetchProducts(pageParam, limit, filters),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });

  // Extract total from first page if available
  useEffect(() => {
    if (query.data?.pages[0]?.total !== undefined) {
      setTotalCount(query.data.pages[0].total);
    }
  }, [query.data]);

  // Flatten all pages into single array
  const allProducts = query.data?.pages.flatMap((page) => page.items) || [];

  return {
    ...query,
    products: allProducts,
    totalCount,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
  };
}

/**
 * Intersection Observer hook for auto-loading on scroll
 * @param callback - Function to call when element is visible
 * @param options - Intersection observer options
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, callback, options]);

  return setNode;
}
