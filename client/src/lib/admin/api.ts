/**
 * Admin API Client
 * 
 * Centralized API client for all admin panel operations with comprehensive security.
 * 
 * Security Features:
 * - Automatic token management with refresh
 * - CSRF protection on state-changing requests
 * - Request cancellation support
 * - Exponential backoff retry logic
 * - Comprehensive error handling
 * - Structured logging
 * - No hard window redirects
 * 
 * @module lib/admin/api
 */

import type {
  DashboardStats,
  AdminProduct,
  ProductFilters,
  AdminOrder,
  OrderFilters,
  InventoryItem,
  StockAdjustment,
  StockAdjustmentFormData,
  AdminCustomer,
  CustomerFilters,
  SalesAnalytics,
  NotificationRecipient,
  NotificationPreferences,
  NotificationHistory,
  AdminSettings,
  ApiResponse,
  ApiError,
} from '@/types/admin';

// Import security utilities
import { getTokenManager } from '@/lib/security/auth-token-manager';
import { injectCSRFToken, validateCSRFToken, getCSRFToken } from '@/lib/security/csrf';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Base API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000; // ms
const MAX_RETRY_DELAY = 10000; // ms

// ============================================================================
// Request Management
// ============================================================================

/**
 * Active request controllers for cancellation
 */
const requestControllers = new Map<string, AbortController>();

/**
 * Creates abort signal for request cancellation
 * 
 * @param requestId - Unique request identifier
 * @returns AbortSignal for the request
 */
function createAbortSignal(requestId?: string): AbortSignal | undefined {
  if (!requestId) return undefined;
  
  // Cancel existing request with same ID
  const existing = requestControllers.get(requestId);
  if (existing) {
    existing.abort();
    logger.debug('Cancelled existing request', { requestId });
  }
  
  // Create new controller
  const controller = new AbortController();
  requestControllers.set(requestId, controller);
  
  return controller.signal;
}

/**
 * Cancels request by ID
 * 
 * @param requestId - Request identifier to cancel
 */
export function cancelRequest(requestId: string): void {
  const controller = requestControllers.get(requestId);
  if (controller) {
    controller.abort();
    requestControllers.delete(requestId);
    logger.info('Request cancelled', { requestId });
  }
}

/**
 * Cancels all active requests
 */
export function cancelAllRequests(): void {
  requestControllers.forEach((controller, requestId) => {
    controller.abort();
    logger.debug('Request cancelled', { requestId });
  });
  requestControllers.clear();
  logger.info('All requests cancelled');
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Custom error class for API errors
 */
export class AdminApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

/**
 * Unauthorized callback - set by App.tsx
 */
let onUnauthorized: (() => void) | null = null;

/**
 * Sets callback for unauthorized errors
 * Used to navigate to login without hard redirects
 * 
 * @param callback - Function to call on 401
 */
export function setUnauthorizedHandler(callback: () => void): void {
  onUnauthorized = callback;
  logger.debug('Unauthorized handler registered');
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

/**
 * Sleep utility with jitter for retry logic
 * 
 * @param ms - Base milliseconds to sleep
 * @param addJitter - Whether to add random jitter
 */
async function sleep(ms: number, addJitter = true): Promise<void> {
  const jitter = addJitter ? Math.random() * 0.3 * ms : 0;
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

/**
 * Calculates retry delay with exponential backoff
 * 
 * @param attempt - Current retry attempt (0-based)
 * @param retryAfter - Optional Retry-After header value
 * @returns Delay in milliseconds
 */
function getRetryDelay(attempt: number, retryAfter?: number): number {
  // Use Retry-After header if provided
  if (retryAfter) {
    return Math.min(retryAfter * 1000, MAX_RETRY_DELAY);
  }
  
  // Exponential backoff: 1s, 2s, 4s
  const exponentialDelay = BASE_RETRY_DELAY * Math.pow(2, attempt);
  return Math.min(exponentialDelay, MAX_RETRY_DELAY);
}

// ============================================================================
// Fetch Wrapper with Security
// ============================================================================

/**
 * Generic fetch wrapper with retry logic, security, and error handling
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @param retries - Number of retries remaining
 * @param requestId - Optional request ID for cancellation
 * @returns Promise resolving to typed response
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES,
  requestId?: string
): Promise<T> {
  const method = options.method || 'GET';
  const attemptNumber = MAX_RETRIES - retries;
  
  try {
    // Get fresh access token (auto-refreshes if needed)
    const tokenManager = getTokenManager();
    const token = await tokenManager.getAccessToken();
    
    // Prepare headers
    let headers = new Headers(options.headers);
    
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Validate and inject CSRF token for state-changing requests
    try {
      validateCSRFToken(method);
      headers = new Headers(injectCSRFToken(headers, method));
    } catch (csrfError) {
      logger.error('CSRF validation failed', {
        method,
        url,
        error: csrfError instanceof Error ? csrfError.message : 'Unknown error',
      });
      throw csrfError;
    }
    
    // Create abort signal if requestId provided
    const signal = createAbortSignal(requestId);
    
    logger.debug('API request', {
      method,
      url,
      attempt: attemptNumber + 1,
      requestId,
    });
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      signal,
      credentials: 'include', // Important for cookies
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: ApiError;
      
      if (isJson) {
        errorData = await response.json();
      } else {
        errorData = {
          code: 'UNKNOWN_ERROR',
          message: response.statusText || 'An unknown error occurred',
        };
      }

      // Handle specific status codes
      if (response.status === 401) {
        logger.warn('Unauthorized request', { method, url });
        
        // Call unauthorized callback instead of hard redirect
        if (onUnauthorized) {
          onUnauthorized();
        }
        
        throw new AdminApiError(
          'UNAUTHORIZED',
          'Session expired. Please login again.',
          401
        );
      }

      if (response.status === 403) {
        logger.warn('Forbidden request', { method, url, errorCode: errorData.code });
        
        throw new AdminApiError(
          errorData.code || 'FORBIDDEN',
          errorData.message || 'You do not have permission to perform this action',
          403,
          errorData.details
        );
      }

      // Retry on server errors (5xx) with exponential backoff
      if (response.status >= 500 && retries > 0) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = getRetryDelay(
          attemptNumber,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
        
        logger.warn('Server error, retrying', {
          method,
          url,
          status: response.status,
          attempt: attemptNumber + 1,
          retriesLeft: retries,
          retryIn: `${delay}ms`,
        });
        
        await sleep(delay);
        return fetchWithRetry<T>(url, options, retries - 1, requestId);
      }

      logger.error('API request failed', {
        method,
        url,
        status: response.status,
        errorCode: errorData.code,
        errorMessage: errorData.message,
      });

      throw new AdminApiError(
        errorData.code || 'API_ERROR',
        errorData.message || 'An error occurred',
        response.status,
        errorData.details
      );
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      logger.debug('API request successful (no content)', { method, url });
      return {} as T;
    }

    // Clean up request controller
    if (requestId) {
      requestControllers.delete(requestId);
    }

    if (!isJson) {
      throw new AdminApiError(
        'INVALID_RESPONSE',
        'Server returned non-JSON response',
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AdminApiError) {
      throw error;
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (retries > 0) {
        console.warn(`[Admin API] Network error, retrying... (${retries} attempts left)`);
        await sleep(BASE_RETRY_DELAY);
        return fetchWithRetry<T>(url, options, retries - 1);
      }
      throw new AdminApiError(
        'NETWORK_ERROR',
        'Network error. Please check your connection.',
        0
      );
    }

    throw new AdminApiError(
      'UNKNOWN_ERROR',
      error instanceof Error ? error.message : 'An unknown error occurred',
      0
    );
  }
}

// ============================================================================
// Dashboard APIs
// ============================================================================

export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  async getStats(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<DashboardStats> {
    return fetchWithRetry<DashboardStats>(`/admin/stats?period=${period}`);
  },
};

// ============================================================================
// Product APIs
// ============================================================================

/**
 * Transform product data from frontend format (camelCase) to backend format (snake_case)
 */
function transformProductData(data: any): any {
  const transformed: any = {};
  
  // Direct mappings
  if (data.name !== undefined) transformed.name = data.name;
  if (data.slug !== undefined) transformed.slug = data.slug;
  if (data.description !== undefined) transformed.description = data.description;
  if (data.sku !== undefined) transformed.sku = data.sku;
  if (data.price !== undefined) transformed.price = String(data.price);
  if (data.status !== undefined) transformed.status = data.status;
  if (data.brand !== undefined) transformed.brand = data.brand;
  if (data.size !== undefined) transformed.size = data.size;
  if (data.colour !== undefined) transformed.colour = data.colour;
  if (data.fabric !== undefined) transformed.fabric = data.fabric;
  if (data.images !== undefined) transformed.images = data.images;
  if (data.is_on_sale !== undefined) transformed.is_on_sale = data.is_on_sale;
  if (data.is_signature !== undefined) transformed.is_signature = data.is_signature;
  if (data.premium_segment !== undefined) transformed.premium_segment = data.premium_segment;
  if (data.returns_policy !== undefined) transformed.returns_policy = data.returns_policy;
  if (data.shipping_info !== undefined) transformed.shipping_info = data.shipping_info;
  if (data.signature_details !== undefined) transformed.signature_details = data.signature_details;
  if (data.imported_from !== undefined) transformed.imported_from = data.imported_from;
  
  // CamelCase to snake_case mappings - check BOTH formats
  if (data.categoryId !== undefined) transformed.category_id = data.categoryId;
  if (data.category_id !== undefined) transformed.category_id = data.category_id;
  
  if (data.salePrice !== undefined) transformed.sale_price = data.salePrice ? String(data.salePrice) : null;
  if (data.sale_price !== undefined) transformed.sale_price = data.sale_price ? String(data.sale_price) : null;
  
  if (data.stockQuantity !== undefined) transformed.stock_quantity = data.stockQuantity;
  if (data.stock_quantity !== undefined) transformed.stock_quantity = data.stock_quantity;
  
  if (data.lowStockThreshold !== undefined) transformed.low_stock_threshold = data.lowStockThreshold;
  if (data.low_stock_threshold !== undefined) transformed.low_stock_threshold = data.low_stock_threshold;
  
  if (data.fabricQuality !== undefined) transformed.fabric_quality = data.fabricQuality;
  if (data.fabric_quality !== undefined) transformed.fabric_quality = data.fabric_quality;
  
  if (data.washCare !== undefined) transformed.wash_care = data.washCare;
  if (data.wash_care !== undefined) transformed.wash_care = data.wash_care;
  
  if (data.costPrice !== undefined) transformed.cost_price = data.costPrice ? String(data.costPrice) : null;
  if (data.cost_price !== undefined) transformed.cost_price = data.cost_price ? String(data.cost_price) : null;
  
  // New Fabric & Apparel Attributes - handle both camelCase and snake_case
  if (data.isImported !== undefined) transformed.is_imported = data.isImported;
  if (data.is_imported !== undefined) transformed.is_imported = data.is_imported;
  
  if (data.gsm !== undefined) transformed.gsm = data.gsm ? Number(data.gsm) : null;
  
  if (data.weave !== undefined) transformed.weave = data.weave;
  
  if (data.occasion !== undefined) transformed.occasion = data.occasion;
  
  if (data.pattern !== undefined) transformed.pattern = data.pattern;
  
  if (data.fit !== undefined) transformed.fit = data.fit;
  
  if (data.relatedProductIds !== undefined) transformed.related_product_ids = data.relatedProductIds;
  if (data.related_product_ids !== undefined) transformed.related_product_ids = data.related_product_ids;
  
  if (data.isSignature !== undefined) transformed.is_signature = data.isSignature;
  if (data.is_signature !== undefined) transformed.is_signature = data.is_signature;
  
  if (data.signatureDetails !== undefined) transformed.signature_details = data.signatureDetails;
  if (data.signature_details !== undefined) transformed.signature_details = data.signature_details;
  
  // Pass variants through if present
  if (data.variants !== undefined) transformed.variants = data.variants;
  
  // Color Images - handle both camelCase and snake_case
  if (data.colorImages !== undefined) transformed.color_images = data.colorImages;
  if (data.color_images !== undefined) transformed.color_images = data.color_images;
  
  // Main Image - handle both camelCase and snake_case
  if (data.mainImage !== undefined) transformed.main_image = data.mainImage;
  if (data.main_image !== undefined) transformed.main_image = data.main_image;
  
  console.log('[transformProductData] Input (new attrs):', { 
    isImported: data.isImported,
    is_imported: data.is_imported,
    gsm: data.gsm,
    weave: data.weave,
    occasion: data.occasion,
    pattern: data.pattern,
    fit: data.fit,
  });
  console.log('[transformProductData] Output:', transformed);
  
  return transformed;
}

export const productApi = {
  /**
   * Get all products with filters
   */
  async getProducts(filters?: ProductFilters): Promise<ApiResponse<AdminProduct[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    return fetchWithRetry<ApiResponse<AdminProduct[]>>(
      `/admin/products${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get single product by ID
   */
  async getProduct(id: string): Promise<AdminProduct> {
    return fetchWithRetry<AdminProduct>(`/admin/products/${id}`);
  },

  /**
   * Create new product
   */
  async createProduct(data: Partial<AdminProduct>): Promise<AdminProduct> {
    const transformedData = transformProductData(data);
    console.log('[Product API] Creating product:', { original: data, transformed: transformedData });
    return fetchWithRetry<AdminProduct>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(transformedData),
    });
  },

  /**
   * Update existing product
   */
  async updateProduct(id: string, data: Partial<AdminProduct>): Promise<AdminProduct> {
    const transformedData = transformProductData(data);
    console.log('[Product API] Transforming data:', { original: data, transformed: transformedData });
    return fetchWithRetry<AdminProduct>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformedData),
    });
  },

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    return fetchWithRetry<void>(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Bulk update product status
   */
  async bulkUpdateStatus(
    productIds: string[],
    status: 'active' | 'draft' | 'archived'
  ): Promise<void> {
    return fetchWithRetry<void>('/admin/products/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ productIds, status }),
    });
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/categories');
  },

  /**
   * Create new category
   */
  async createCategory(data: { name: string; parentId?: string }): Promise<any> {
    return fetchWithRetry<any>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// Order APIs
// ============================================================================

export const orderApi = {
  /**
   * Get all orders with filters
   */
  async getOrders(filters?: OrderFilters): Promise<ApiResponse<AdminOrder[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    return fetchWithRetry<ApiResponse<AdminOrder[]>>(
      `/admin/orders${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get single order by ID
   */
  async getOrder(id: string): Promise<AdminOrder> {
    return fetchWithRetry<AdminOrder>(`/admin/orders/${id}`);
  },

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<AdminOrder> {
    return fetchWithRetry<AdminOrder>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  /**
   * Update shipping information
   */
  async updateShipping(
    id: string,
    trackingNumber: string,
    carrier?: string
  ): Promise<AdminOrder> {
    return fetchWithRetry<AdminOrder>(`/admin/orders/${id}/shipping`, {
      method: 'PATCH',
      body: JSON.stringify({ trackingNumber, carrier }),
    });
  },

  /**
   * Cancel order
   */
  async cancelOrder(id: string, reason: string): Promise<AdminOrder> {
    return fetchWithRetry<AdminOrder>(`/admin/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Process refund
   */
  async refundOrder(id: string, amount: number, reason: string): Promise<AdminOrder> {
    return fetchWithRetry<AdminOrder>(`/admin/orders/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  },
};

// ============================================================================
// Inventory APIs
// ============================================================================

export const inventoryApi = {
  /**
   * Get inventory overview
   */
  async getInventory(filters?: {
    status?: 'in-stock' | 'low-stock' | 'out-of-stock';
    search?: string;
  }): Promise<ApiResponse<InventoryItem[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    return fetchWithRetry<ApiResponse<InventoryItem[]>>(
      `/admin/inventory${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Adjust stock quantity
   */
  async adjustStock(data: StockAdjustmentFormData): Promise<StockAdjustment> {
    return fetchWithRetry<StockAdjustment>('/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get stock adjustment history
   */
  async getAdjustmentHistory(productId: string): Promise<StockAdjustment[]> {
    return fetchWithRetry<StockAdjustment[]>(
      `/admin/inventory/history/${productId}`
    );
  },
};

// ============================================================================
// Customer APIs
// ============================================================================

export const customerApi = {
  /**
   * Get all customers with filters
   */
  async getCustomers(filters?: CustomerFilters): Promise<ApiResponse<AdminCustomer[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    return fetchWithRetry<ApiResponse<AdminCustomer[]>>(
      `/admin/customers${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get single customer by ID
   */
  async getCustomer(id: string): Promise<AdminCustomer> {
    return fetchWithRetry<AdminCustomer>(`/admin/customers/${id}`);
  },

  /**
   * Update customer status
   */
  async updateCustomerStatus(
    id: string,
    status: 'active' | 'inactive' | 'blocked'
  ): Promise<AdminCustomer> {
    return fetchWithRetry<AdminCustomer>(`/admin/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Get VIP customers
   */
  async getVIPs(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/customers/vip');
  },
};

// ============================================================================
// Analytics APIs
// ============================================================================

export const analyticsApi = {
  /**
   * Get revenue analytics
   */
  async getRevenue(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/analytics/revenue');
  },

  /**
   * Get top products
   */
  async getTopProducts(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/analytics/top-products');
  },

  /**
   * Get customer growth
   */
  async getCustomerGrowth(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/analytics/customer-growth');
  },

  /**
   * Get sales by region
   */
  async getSalesByRegion(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/analytics/sales-by-region');
  },

  /**
   * Get sales by category
   */
  async getSalesByCategory(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/analytics/sales-by-category');
  },

  /**
   * Get sales analytics (Legacy/General)
   */
  async getSalesAnalytics(
    period: 'day' | 'week' | 'month' | 'year',
    startDate?: string,
    endDate?: string
  ): Promise<SalesAnalytics> {
    const params = new URLSearchParams({ period });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return fetchWithRetry<SalesAnalytics>(
      `/admin/analytics/sales?${params.toString()}`
    );
  },

  /**
   * Export report
   */
  async exportReport(
    type: 'sales' | 'products' | 'customers' | 'inventory',
    format: 'csv' | 'pdf',
    filters?: any
  ): Promise<Blob> {
    const params = new URLSearchParams({ type, format });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const tokenManager = getTokenManager();
    const token = await tokenManager.getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/analytics/export?${params.toString()}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    if (!response.ok) {
      throw new AdminApiError('EXPORT_FAILED', 'Failed to export report', response.status);
    }

    return response.blob();
  },
};

// ============================================================================
// Notification APIs
// ============================================================================

export const notificationApi = {
  /**
   * Get notification recipients
   */
  async getRecipients(): Promise<NotificationRecipient[]> {
    return fetchWithRetry<NotificationRecipient[]>('/admin/notifications/recipients');
  },

  /**
   * Create notification recipient
   */
  async createRecipient(data: Partial<NotificationRecipient>): Promise<NotificationRecipient> {

    return fetchWithRetry<NotificationRecipient>('/admin/notifications/recipients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update notification recipient
   */
  async updateRecipient(
    id: string,
    data: Partial<NotificationRecipient>
  ): Promise<NotificationRecipient> {
    return fetchWithRetry<NotificationRecipient>(`/admin/notifications/recipients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete notification recipient
   */
  async deleteRecipient(id: string): Promise<void> {
    return fetchWithRetry<void>(`/admin/notifications/recipients/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle recipient active status
   */
  async toggleRecipient(id: string, active: boolean): Promise<NotificationRecipient> {
    return fetchWithRetry<NotificationRecipient>(`/admin/notifications/recipients/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  },

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    return fetchWithRetry<NotificationPreferences>('/admin/notifications/preferences');
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return fetchWithRetry<NotificationPreferences>('/admin/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get notification history
   */
  async getHistory(filters?: any): Promise<ApiResponse<NotificationHistory[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return fetchWithRetry<ApiResponse<NotificationHistory[]>>(
      `/admin/notifications/history?${params.toString()}`
    );
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    return fetchWithRetry<void>(`/admin/notifications/history/${id}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Get notification stats
   */
  async getStats(): Promise<any> {
    return fetchWithRetry<any>('/admin/notifications/stats');
  },

  /**
   * Send test notification
   */
  async sendTest(phoneNumber: string): Promise<void> {
    return fetchWithRetry<void>('/admin/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  },
};

// ============================================================================
// Invitation APIs
// ============================================================================

export const invitationApi = {
  /**
   * List all invitations
   */
  async listInvitations(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/invitations');
  },

  /**
   * Invite a new admin
   */
  async inviteAdmin(email: string, role: string): Promise<any> {
    return fetchWithRetry<any>('/admin/invitations', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  },

  /**
   * Revoke an invitation
   */
  async revokeInvitation(id: string): Promise<void> {
    return fetchWithRetry<void>(`/admin/invitations/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// User APIs
// ============================================================================

export const userApi = {
  async listUsers(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/users');
  },
  async updateUserRole(id: string, role: string): Promise<any> {
    return fetchWithRetry<any>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
  async deleteUser(id: string): Promise<void> {
    return fetchWithRetry<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }
};


// ============================================================================
// Settings APIs
// ============================================================================

export const settingsApi = {
  /**
   * Get all settings
   */
  async getSettings(): Promise<AdminSettings> {
    return fetchWithRetry<AdminSettings>('/admin/settings');
  },

  /**
   * Update settings
   */
  async updateSettings(data: Partial<AdminSettings>): Promise<AdminSettings> {
    return fetchWithRetry<AdminSettings>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// Upload APIs
// ============================================================================

export const uploadApi = {
  /**
   * Upload image
   */
  async uploadImage(file: File): Promise<{ url: string; width: number; height: number; format: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const tokenManager = getTokenManager();
    const token = await tokenManager.getAccessToken();
    const csrfToken = getCSRFToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AdminApiError(
        error.code || 'UPLOAD_FAILED',
        error.message || 'Failed to upload image',
        response.status
      );
    }

    const data = await response.json();
    console.log('[DEBUG] Upload API response:', data);
    console.log('[DEBUG] Upload API data.image:', data.image);
    
    // Extract URL from image object - use 'large' for product images
    const imageUrl = data.image?.large || data.image?.original || data.image?.url;
    console.log('[DEBUG] Extracted image URL:', imageUrl);
    
    return {
      url: imageUrl,
      width: data.image?.width,
      height: data.image?.height,
      format: data.image?.format
    };
  },

  /**
   * Upload multiple images
   */
  async uploadImages(files: File[]): Promise<{ urls: string[] }> {
    const uploadPromises = files.map(file => this.uploadImage(file));
    const results = await Promise.all(uploadPromises);
    return { urls: results.map(r => r.url) };
  },
};

export const supplierApi = {
  async list(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/suppliers');
  },
  async create(data: any): Promise<any> {
    return fetchWithRetry<any>('/admin/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const marketingApi = {
  async list(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/marketing');
  },
  async create(data: any): Promise<any> {
    return fetchWithRetry<any>('/admin/marketing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const contentApi = {
  async list(): Promise<any[]> {
    return fetchWithRetry<any[]>('/admin/content');
  },
  async create(data: any): Promise<any> {
    return fetchWithRetry<any>('/admin/content', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async update(id: string, data: any): Promise<any> {
    return fetchWithRetry<any>(`/admin/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async delete(id: string): Promise<void> {
    return fetchWithRetry<void>(`/admin/content/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Export all APIs as a single object
 */
export const adminApi = {
  dashboard: dashboardApi,
  products: productApi,
  orders: orderApi,
  inventory: inventoryApi,
  customers: customerApi,
  analytics: analyticsApi,
  notifications: notificationApi,
  settings: settingsApi,
  upload: uploadApi,
  users: userApi,
  suppliers: supplierApi,
  marketing: marketingApi,
  content: contentApi,
  invitations: {
    async getInvitations(): Promise<any[]> {
      return fetchWithRetry<any[]>('/admin/invitations');
    },
    async inviteUser(email: string, role: string): Promise<any> {
      return fetchWithRetry<any>('/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
    },
    async revokeInvitation(id: string): Promise<void> {
      return fetchWithRetry<void>(`/admin/invitations/${id}`, {
        method: 'DELETE',
      });
    },
    async acceptInvitation(token: string, password: string): Promise<any> {
      return fetchWithRetry<any>('/admin/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
    }
  },
};

export default adminApi;
