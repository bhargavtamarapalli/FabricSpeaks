/**
 * Product Reviews Hooks
 * 
 * Custom hooks for managing product reviews and ratings.
 * Utilizes React Query for caching, optimistic updates, and background refetching.
 * 
 * @module client/src/hooks/useReviews
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ProductReview, InsertProductReview } from "../../../shared/schema";

// Extended review type with user vote status
export interface ReviewWithUserVote extends ProductReview {
  user_has_voted: boolean;
  helpful_count: number | null;
  user?: {
    first_name: string;
    last_name: string;
  };
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Hook to fetch reviews for a product
 */
export function useProductReviews(productId: string, limit = 10, offset = 0) {
  return useQuery<ReviewWithUserVote[]>({
    queryKey: ["reviews", productId, { limit, offset }],
    queryFn: async () => {
      if (!productId) return [];
      return api.get(`/api/products/${productId}/reviews?limit=${limit}&offset=${offset}`);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch review statistics for a product
 */
export function useProductReviewStats(productId: string) {
  return useQuery<ReviewStats>({
    queryKey: ["reviews-stats", productId],
    queryFn: async () => {
      if (!productId) return { average_rating: 0, total_reviews: 0, rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
      return api.get(`/api/products/${productId}/reviews/stats`);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a new review
 */
export function useCreateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<InsertProductReview, "user_id" | "verified_purchase">) => {
      return api.post<ProductReview>(`/api/products/${data.product_id}/reviews`, data);
    },
    onSuccess: (data, variables) => {
      // Invalidate reviews and stats to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["reviews-stats", variables.product_id] });
      
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to update an existing review
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProductReview> }) => {
      return api.put<ProductReview>(`/api/reviews/${id}`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", data.product_id] });
      queryClient.invalidateQueries({ queryKey: ["reviews-stats", data.product_id] });
      
      toast({
        title: "Review Updated",
        description: "Your review has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update review",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete a review
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      return api.delete(`/api/reviews/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["reviews-stats", variables.productId] });
      
      toast({
        title: "Review Deleted",
        description: "Your review has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to vote a review as helpful
 */
export function useVoteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, productId }: { reviewId: string; productId: string }) => {
      return api.post(`/api/reviews/${reviewId}/vote`);
    },
    onMutate: async ({ reviewId, productId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["reviews", productId] });

      // Snapshot previous value
      const previousReviews = queryClient.getQueryData(["reviews", productId]);

      // Optimistically update
      queryClient.setQueryData(["reviews", productId], (old: any) => {
        if (!old) return [];
        return old.map((review: ReviewWithUserVote) => {
          if (review.id === reviewId) {
            return {
              ...review,
              helpful_count: (review.helpful_count || 0) + 1,
              user_has_voted: true,
            };
          }
          return review;
        });
      });

      return { previousReviews };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousReviews) {
        queryClient.setQueryData(["reviews", variables.productId], context.previousReviews);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.productId] });
    },
  });
}

/**
 * Hook to remove a helpful vote
 */
export function useRemoveVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, productId }: { reviewId: string; productId: string }) => {
      return api.delete(`/api/reviews/${reviewId}/vote`);
    },
    onMutate: async ({ reviewId, productId }) => {
      await queryClient.cancelQueries({ queryKey: ["reviews", productId] });
      const previousReviews = queryClient.getQueryData(["reviews", productId]);

      queryClient.setQueryData(["reviews", productId], (old: any) => {
        if (!old) return [];
        return old.map((review: ReviewWithUserVote) => {
          if (review.id === reviewId) {
            return {
              ...review,
              helpful_count: Math.max(0, (review.helpful_count || 0) - 1),
              user_has_voted: false,
            };
          }
          return review;
        });
      });

      return { previousReviews };
    },
    onError: (_err, variables, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(["reviews", variables.productId], context.previousReviews);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.productId] });
    },
  });
}
