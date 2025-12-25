/**
 * Admin Panel Type Definitions
 * 
 * This file contains all TypeScript types and interfaces used across the admin panel.
 * Ensures type safety and better IDE support.
 */

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  revenue: {
    total: number;
    trend: number; // Percentage change from previous period
    previousPeriod: number;
  };
  orders: {
    total: number;
    trend: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  customers: {
    total: number;
    trend: number;
    new: number;
    returning: number;
    retentionRate: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  averageOrderValue: {
    value: number;
    trend: number;
  };
  conversionRate: {
    value: number;
    trend: number;
  };
  inventoryValue: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface SalesByCategoryData {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface TopProduct {
  id: string;
  name: string;
  image: string;
  sales: number;
  revenue: number;
  trend: number[];
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  total: number;
  status: OrderStatus;
  createdAt: string;
}

// ============================================================================
// Product Types
// ============================================================================

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  salePrice: string | null;
  sku: string;
  status: ProductStatus;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  images: string[];
  imageUrl: string | null;
  main_image?: string | null;
  color_images?: Record<string, string[]> | null;
  fabricQuality: string | null;
  washCare: string | null;
  createdAt: string;
  updatedAt: string;
  variants?: {
    id: string;
    product_id: string;
    size: string | null;
    colour: string | null;
    stock_quantity: number;
    sku: string | null;
    price_adjustment: string | null;
    status: string | null;
    images?: string[] | null;
  }[];
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  sku: string;
  status: ProductStatus;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId?: string;
  images: File[];
  imageUrl?: string;
  fabricQuality?: string;
  washCare?: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string; // Changed from 'category' to match backend
  status?: ProductStatus;
  stockStatus?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  sortBy?: 'name' | 'price' | 'stock' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================================================
// Order Types
// ============================================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface AdminOrder {
  id: string;
  orderNumber: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  status: OrderStatus;
  total: string;
  subtotal: string;
  tax: string;
  shippingCost: string;
  discount: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    imageUrl: string | null;
    sku: string;
  };
  variantId: string | null;
  variant?: {
    id: string;
    size: string;
    color: string;
  };
  quantity: number;
  price: string;
  total: string;
}

export interface Address {
  id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created' | 'total' | 'customer';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  performedBy?: string;
  timestamp: string;
}

// Keep for backward compatibility if needed
export type OrderTimeline = OrderTimelineEvent;

// ============================================================================
// Inventory Types
// ============================================================================

export interface InventoryItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    imageUrl: string | null;
  };
  variantId: string | null;
  variant?: {
    id: string;
    size: string;
    color: string;
  };
  stockQuantity: number;
  lowStockThreshold: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastRestocked?: string;
  value: number;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  variantId: string | null;
  quantityChange: number;
  reason: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface StockAdjustmentFormData {
  productId: string;
  variantId?: string;
  quantityChange: number;
  reason: 'restock' | 'damage' | 'theft' | 'return' | 'correction' | 'other';
  notes?: string;
}

// ============================================================================
// Customer Types
// ============================================================================

export interface AdminCustomer {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
  updatedAt: string;
  stats: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: string | null;
    lifetimeValue: number;
  };
  segment: 'vip' | 'regular' | 'at-risk' | 'inactive';
  name?: string; // Fallback for components expect names
}

export interface CustomerFilters {
  search?: string;
  segment?: 'vip' | 'regular' | 'at-risk' | 'inactive';
  status?: 'active' | 'inactive' | 'blocked';
  sortBy?: 'name' | 'orders' | 'spent' | 'created';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface SalesAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  data: {
    date: string;
    revenue: number;
    orders: number;
    customers: number;
  }[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    growthRate: number;
  };
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  sales: number;
  revenue: number;
  profit: number;
  conversionRate: number;
  returnRate: number;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  revenue: number;
  averageOrderValue: number;
  retentionRate: number;
}

// ============================================================================
// Notification Types (extending existing)
// ============================================================================

export interface AdminNotification {
  id: string;
  type: 'order' | 'inventory' | 'customer' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationRecipient {
  id: string;
  name: string;
  whatsappNumber: string;
  email: string | null;
  role: 'admin' | 'manager' | 'analyst';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  orderAlerts: boolean;
  inventoryAlerts: boolean;
  customerAlerts: boolean;
  systemAlerts: boolean;
  marketingAlerts: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
}

export interface NotificationHistory {
  id: string;
  type: 'order' | 'inventory' | 'customer' | 'system' | 'marketing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  channel: 'email' | 'whatsapp' | 'sms';
  recipientId: string;
  recipient?: NotificationRecipient;
  status: 'pending' | 'sent' | 'failed' | 'read';
  sentAt: string | null;
  readAt: string | null;
  error: string | null;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface AdminSettings {
  general: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    supportPhone: string;
    currency: string;
    locale: string;
    timezone: string;
  };
  tax: {
    enabled: boolean;
    rate: number;
    includeInPrice: boolean;
  };
  shipping: {
    freeShippingThreshold: number;
    defaultShippingCost: number;
    zones: ShippingZone[];
  };
  payments: {
    razorpay: {
      enabled: boolean;
      keyId: string;
      keySecret: string;
    };
  };
  notifications: {
    email: {
      enabled: boolean;
      provider: string;
      apiKey: string;
    };
    whatsapp: {
      enabled: boolean;
      apiKey: string;
      phoneNumberId: string;
    };
  };
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states: string[];
  cost: number;
  estimatedDays: number;
}

// ============================================================================
// UI Component Types
// ============================================================================

export interface TableColumn<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  cell?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export type Permission =
  | 'manage_products'
  | 'manage_orders'
  | 'manage_customers'
  | 'manage_inventory'
  | 'manage_notifications'
  | 'view_analytics'
  | 'manage_settings'
  | 'manage_team';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'analyst';
  permissions: Permission[];
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

// ============================================================================
// Chart Types
// ============================================================================

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut';

export interface ChartConfig {
  type: ChartType;
  data: ChartDataPoint[];
  xAxisKey: string;
  yAxisKey: string;
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}
