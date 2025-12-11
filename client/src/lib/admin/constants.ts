/**
 * Admin Panel Constants
 * 
 * Centralized constants used across the admin panel.
 * Includes navigation, status options, permissions, and configuration values.
 */

import type { Permission, OrderStatus, ProductStatus } from '@/types/admin';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Bell,
  Settings,
  Boxes,
  Shield,
  Award,
  FileText,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Navigation
// ============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  badge?: string;
  children?: NavItem[];
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: 'view_dashboard',
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
    permission: 'manage_products',
  },
  {
    label: 'Signature Collection',
    href: '/admin/signature-products',
    icon: Award,
    permission: 'manage_products',
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    permission: 'manage_orders',
  },
  {
    label: 'Inventory',
    href: '/admin/inventory',
    icon: Boxes,
    permission: 'manage_inventory',
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: Users,
    permission: 'manage_customers',
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    permission: 'view_analytics',
  },
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    permission: 'manage_notifications',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'manage_settings',
  },
  {
    label: 'Content',
    href: '/admin/content',
    icon: FileText,
    permission: 'manage_settings',
  },
  {
    label: 'Team',
    href: '/admin/team',
    icon: Shield,
    permission: 'manage_admins',
  },
];

// ============================================================================
// Status Options
// ============================================================================

export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'processing', label: 'Processing', color: 'purple' },
  { value: 'shipped', label: 'Shipped', color: 'indigo' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'orange' },
];

export const PRODUCT_STATUSES: { value: ProductStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'archived', label: 'Archived', color: 'red' },
];

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'orange' },
];

export const STOCK_STATUSES = [
  { value: 'in-stock', label: 'In Stock', color: 'green' },
  { value: 'low-stock', label: 'Low Stock', color: 'yellow' },
  { value: 'out-of-stock', label: 'Out of Stock', color: 'red' },
];

export const CUSTOMER_SEGMENTS = [
  { value: 'vip', label: 'VIP', color: 'purple' },
  { value: 'regular', label: 'Regular', color: 'blue' },
  { value: 'at-risk', label: 'At Risk', color: 'orange' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
];

// ============================================================================
// Permissions
// ============================================================================

export const PERMISSIONS: { value: Permission; label: string; description: string }[] = [
  {
    value: 'view_dashboard',
    label: 'View Dashboard',
    description: 'Access to dashboard and statistics',
  },
  {
    value: 'manage_products',
    label: 'Manage Products',
    description: 'Create, edit, and delete products',
  },
  {
    value: 'manage_orders',
    label: 'Manage Orders',
    description: 'View and process orders',
  },
  {
    value: 'view_customers',
    label: 'View Customers',
    description: 'View customer accounts and data',
  },
  {
    value: 'manage_customers',
    label: 'Manage Customers',
    description: 'Create, edit, and manage customer accounts',
  },
  {
    value: 'manage_inventory',
    label: 'Manage Inventory',
    description: 'Adjust stock levels and view inventory',
  },
  {
    value: 'view_analytics',
    label: 'View Analytics',
    description: 'Access to reports and analytics',
  },
  {
    value: 'manage_notifications',
    label: 'Manage Notifications',
    description: 'Configure and send notifications',
  },
  {
    value: 'manage_settings',
    label: 'Manage Settings',
    description: 'Configure system settings',
  },
  {
    value: 'manage_admins',
    label: 'Manage Admins',
    description: 'Add and remove admin users',
  },
];

// ============================================================================
// Role Permissions
// ============================================================================

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    'view_dashboard',
    'manage_products',
    'manage_orders',
    'view_customers',
    'manage_customers',
    'manage_inventory',
    'view_analytics',
    'manage_notifications',
    'manage_settings',
    'manage_admins',
  ],
  admin: [
    'view_dashboard',
    'manage_products',
    'manage_orders',
    'view_customers',
    'manage_customers',
    'manage_inventory',
    'view_analytics',
    'view_analytics',
    'manage_notifications',
    'manage_settings',
  ],
  manager: [
    'view_dashboard',
    'manage_products',
    'manage_orders',
    'view_customers',
    'manage_inventory',
    'view_analytics',
  ],
  analyst: [
    'view_dashboard',
    'view_customers',
    'view_analytics',
  ],
};

// ============================================================================
// Chart Colors
// ============================================================================

export const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#ec4899',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
  cyan: '#06b6d4',
};

export const CHART_COLOR_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
  CHART_COLORS.cyan,
];

// ============================================================================
// Pagination
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ============================================================================
// Date Ranges
// ============================================================================

export const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

// ============================================================================
// Stock Adjustment Reasons
// ============================================================================

export const STOCK_ADJUSTMENT_REASONS = [
  { value: 'restock', label: 'Restock', icon: '📦' },
  { value: 'damage', label: 'Damaged', icon: '💔' },
  { value: 'theft', label: 'Theft/Loss', icon: '🚨' },
  { value: 'return', label: 'Customer Return', icon: '↩️' },
  { value: 'correction', label: 'Inventory Correction', icon: '✏️' },
  { value: 'other', label: 'Other', icon: '📝' },
];

// ============================================================================
// Notification Types
// ============================================================================

export const NOTIFICATION_TYPES = [
  { value: 'order', label: 'Order Alerts', icon: '🛒' },
  { value: 'inventory', label: 'Inventory Alerts', icon: '📦' },
  { value: 'customer', label: 'Customer Alerts', icon: '👤' },
  { value: 'system', label: 'System Alerts', icon: '⚙️' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
];

export const NOTIFICATION_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
];

export const NOTIFICATION_CHANNELS = [
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'sms', label: 'SMS', icon: '📱' },
];

// ============================================================================
// Export Formats
// ============================================================================

export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', icon: '📄' },
  { value: 'pdf', label: 'PDF', icon: '📕' },
  { value: 'excel', label: 'Excel', icon: '📊' },
  { value: 'json', label: 'JSON', icon: '{ }' },
];

// ============================================================================
// Currency & Locale
// ============================================================================

export const CURRENCIES = [
  { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
];

export const LOCALES = [
  { value: 'en-IN', label: 'English (India)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'hi-IN', label: 'Hindi (India)' },
];

export const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
];

// ============================================================================
// Image Upload
// ============================================================================

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_IMAGES_PER_PRODUCT = 10;

// ============================================================================
// Validation Rules
// ============================================================================

export const VALIDATION_RULES = {
  product: {
    nameMinLength: 3,
    nameMaxLength: 200,
    descriptionMinLength: 10,
    descriptionMaxLength: 5000,
    priceMin: 0,
    priceMax: 1000000,
    stockMin: 0,
    stockMax: 100000,
    skuMinLength: 3,
    skuMaxLength: 50,
  },
  customer: {
    usernameMinLength: 3,
    usernameMaxLength: 50,
    phoneLength: 10,
  },
  order: {
    notesMaxLength: 1000,
  },
};

// ============================================================================
// Dashboard Metrics
// ============================================================================

export const METRIC_PERIODS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

// ============================================================================
// Table Settings
// ============================================================================

export const TABLE_SETTINGS = {
  defaultPageSize: DEFAULT_PAGE_SIZE,
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  stickyHeader: true,
  stripedRows: true,
  hoverEffect: true,
  showRowSelection: true,
  showColumnVisibility: true,
  showGlobalFilter: true,
  showPagination: true,
};

// ============================================================================
// Theme
// ============================================================================

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

// ============================================================================
// Quick Actions
// ============================================================================

export const QUICK_ACTIONS = [
  {
    label: 'Add Product',
    href: '/admin/products/new',
    icon: Package,
    color: 'primary',
    permission: 'manage_products' as Permission,
  },
  {
    label: 'View Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    color: 'secondary',
    permission: 'manage_orders' as Permission,
  },
  {
    label: 'Send Notification',
    href: '/admin/notifications',
    icon: Bell,
    color: 'success',
    permission: 'manage_notifications' as Permission,
  },
  {
    label: 'View Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    color: 'info',
    permission: 'view_analytics' as Permission,
  },
];

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  cacheTime: 5 * 60 * 1000, // 5 minutes
  staleTime: 1 * 60 * 1000, // 1 minute
};

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURES = {
  enableAnalytics: true,
  enableNotifications: true,
  enableBulkOperations: true,
  enableExport: true,
  enableAdvancedFilters: true,
  enableRealTimeUpdates: false, // Future feature
  enableMultiCurrency: false, // Future feature
  enableMultiLanguage: false, // Future feature
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
};

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  ORDER_UPDATED: 'Order updated successfully',
  INVENTORY_ADJUSTED: 'Inventory adjusted successfully',
  NOTIFICATION_SENT: 'Notification sent successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  EXPORT_COMPLETE: 'Export completed successfully',
};
