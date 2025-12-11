/**
 * Admin Dashboard Statistics Hook
 * 
 * Custom hook for fetching and managing dashboard statistics.
 * Features:
 * - Fetch dashboard stats with caching
 * - Real-time updates
 * - Error handling
 * - Loading states
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin/api';
import type { DashboardStats } from '@/types/admin';
import { API_CONFIG } from '@/lib/admin/constants';

export interface UseAdminStatsOptions {
  period?: 'day' | 'week' | 'month' | 'year';
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to fetch dashboard statistics
 */
export function useAdminStats(
  options: UseAdminStatsOptions = {}
): UseQueryResult<DashboardStats, Error> {
  const {
    period = 'month',
    enabled = true,
    refetchInterval,
  } = options;

  return useQuery({
    queryKey: ['admin', 'stats', period],
    queryFn: () => adminApi.dashboard.getStats(period),
    enabled,
    staleTime: API_CONFIG.staleTime,
    gcTime: API_CONFIG.cacheTime,
    refetchInterval,
    retry: API_CONFIG.retryAttempts,
  });
}

/**
 * Hook to get specific metric from dashboard stats
 */
export function useAdminMetric<K extends keyof DashboardStats>(
  metric: K,
  options: UseAdminStatsOptions = {}
): DashboardStats[K] | undefined {
  const { data } = useAdminStats(options);
  return data?.[metric];
}

/**
 * Hook to get revenue data
 */
export function useRevenueData(options: UseAdminStatsOptions = {}) {
  const { data, isLoading, error } = useAdminStats(options);

  return {
    revenue: data?.revenue,
    isLoading,
    error,
  };
}

/**
 * Hook to get orders data
 */
export function useOrdersData(options: UseAdminStatsOptions = {}) {
  const { data, isLoading, error } = useAdminStats(options);

  return {
    orders: data?.orders,
    isLoading,
    error,
  };
}

/**
 * Hook to get customers data
 */
export function useCustomersData(options: UseAdminStatsOptions = {}) {
  const { data, isLoading, error } = useAdminStats(options);

  return {
    customers: data?.customers,
    isLoading,
    error,
  };
}

/**
 * Hook to get products data
 */
export function useProductsData(options: UseAdminStatsOptions = {}) {
  const { data, isLoading, error } = useAdminStats(options);

  return {
    products: data?.products,
    isLoading,
    error,
  };
}
