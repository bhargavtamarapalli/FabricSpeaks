# Product Requirements Document (PRD) - E-commerce Admin Panel

**Generated Date:** 2025-12-02
**Source Analysis:** Deep Dive into Server Logic (PostgreSQL/Drizzle/Express/Supabase Auth)

---

## 1. Executive Summary
The E-commerce Admin Panel is a comprehensive management interface for a fashion e-commerce platform. It is built on a **PostgreSQL** database (managed via Drizzle ORM) and uses **Supabase Auth** for identity management. The system supports complex product variants, inventory tracking, order processing with Razorpay integration, and a robust notification system via WhatsApp.

---

## 2. User Roles & Authentication

### 2.1. Authentication Architecture
*   **Provider**: Supabase Auth (Email/Password).
*   **Mobile Support**: Custom logic handles mobile-only sign-ups by generating proxy emails (`{mobile}@fabric-speaks.local`).
*   **Security**:
    *   **Password Policy**: Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
    *   **Brute Force Protection**: Tracks `login_attempts`. Triggers a **WhatsApp Security Alert** to admins after 5 failed attempts in 15 minutes.
    *   **Session**: Stateless JWT (Bearer Token) flow.

### 2.2. Roles
*   **Super Admin**: Can invite other admins, revoke invitations, and manage system-wide settings.
*   **Admin**: Full access to `/admin/*` routes (Products, Orders, Inventory, Analytics, Settings).
*   **User**: Storefront access only.
*   **Permissions**: Enforced via `requireAdmin` middleware.

### 2.3. Admin Invitation System
**Note**: The backend logic for invitations is fully implemented in `server/adminInvitations.ts` but is **NOT currently exposed via API routes** in `server/routes.ts`. This is a critical gap for Phase 7 deployment.

*   **Workflow (Implemented Logic)**:
    1.  **Invite**: Super Admin generates a secure, 7-day valid token for an email address.
    2.  **Accept**: New admin accepts the invitation via a link, linking their Supabase account to the Admin role.
    3.  **Revoke**: Super Admins can revoke pending invitations.
*   **Security**: Tokens are cryptographically secure (`crypto.randomBytes(32)`).

---

## 3. Functional Requirements

### 3.1. Product Management
**Endpoint**: `/api/admin/products`
*   **Core Data**: Name, Slug (auto-generated), SKU, Description (Rich Text), Brand, Imported From.
*   **Pricing**:
    *   `price`: Regular selling price.
    *   `sale_price`: Discounted price (optional).
    *   `cost_price`: Internal cost for margin calculations.
*   **Categorization**: Hierarchical categories, Premium Segment flag, Signature Collection flag.
*   **Variants**:
    *   Supports **Size** and **Color** combinations.
    *   Each variant has its own `stock_quantity` and `sku`.
*   **Media**:
    *   **Color Gallery**: Upload up to 5 images specific to a color variant.
    *   Images are stored in `uploads/` (served statically) or cloud storage (if configured).
*   **SEO & Details**: Fields for Fabric Quality, Wash Care, Returns Policy.
*   **Bulk Actions**:
    *   **Status Update**: Bulk set products to Active/Inactive.
    *   **Import**: CSV import functionality via `/api/admin/products/import` (handled by `server/admin.ts`).

### 3.2. Inventory Management
**Endpoint**: `/api/admin/inventory`
*   **Stock Tracking**: Real-time tracking of stock at the **Variant** level.
*   **Status Logic**:
    *   **Out of Stock**: Quantity = 0.
    *   **Low Stock**: Quantity <= `low_stock_threshold` (default 10).
    *   **In Stock**: Quantity > Threshold.
*   **Adjustments**:
    *   Admins can manually adjust stock (+/- quantity).
    *   **Audit Trail**: All manual adjustments are logged in `inventory_logs` with a reason.
    *   **Validation**: Stock cannot be negative.

### 3.3. Order Management
**Endpoint**: `/api/admin/orders`
*   **Lifecycle**:
    1.  **Pending**: Order created, payment pending.
    2.  **Processing**: Payment confirmed (Razorpay), inventory deducted.
    3.  **Shipped**: Tracking number added.
    4.  **Delivered**: Final state.
    5.  **Cancelled**: User/Admin cancelled, inventory restored, refund initiated.
*   **Payment Integration (Razorpay)**:
    *   **Verification**: Server validates Razorpay signature (`HMAC SHA256`).
    *   **Inventory Sync**: Stock is deducted *only* after successful payment verification.
    *   **Refunds**: Auto-triggers Razorpay refund API when an order is cancelled.
*   **Admin Actions**:
    *   **Bulk Status Update**: Update multiple orders at once -> Triggers Email Notification.
    *   **Bulk Tracking Update**: Add tracking numbers -> Triggers "Shipped" Email.

### 3.4. Reporting & Analytics
**Endpoint**: `/api/admin/analytics` & `/api/admin/stats`
*   **Dashboard Stats**:
    *   **Revenue**: Total revenue from 'paid' orders.
    *   **Orders**: Counts by status (Pending, Processing, Delivered, Cancelled).
    *   **Products**: Active count, Low Stock count, Out of Stock count.
    *   **Customers**: Total registered users.
    *   **AOV**: Average Order Value calculation.
*   **Detailed Reports**:
    *   **Revenue Analytics**: Daily revenue & order count for the last 30 days.
    *   **Top Products**: Top 5 products by quantity sold.
    *   **Customer Growth**: Daily new user registrations.
    *   **Sales by Region**: Top 5 Cities by total revenue.
*   **Export**: Support for CSV/PDF export of reports.

### 3.5. Notification System (WhatsApp)
**Endpoint**: `/api/admin/notifications`
*   **Architecture**:
    *   **Provider**: WhatsApp Business API (via `graph.facebook.com`).
    *   **Service**: `WhatsAppNotificationService` handles formatting, batching, and sending.
    *   **Dev Mode**: Logs messages to console if API keys are missing.
*   **Recipient Logic**:
    *   **Admins Only**: Notifications are sent to configured *Admin Recipients* (`notificationRecipients` table).
    *   **Filtering**: Recipients can filter by Type (Order, Inventory, etc.) and Priority (Info, Important, Critical).
    *   **Quiet Hours**: Supports "Do Not Disturb" windows per recipient.
*   **Triggers**:
    *   **New Order**: Sent to Admins (High Value template if > ₹5000).
    *   **Payment Received**: Sent to Admins.
    *   **Payment Failed**: Sent to Admins (debug/alert).
    *   **Order Cancelled**: Sent to Admins.
    *   **Security Alert**: Sent on repeated failed logins (Brute Force detection).
*   **Management**:
    *   **Recipients**: CRUD interface to manage who receives WhatsApp alerts.
    *   **History**: Log of all sent notifications with delivery status.

### 3.6. Coupon Management
**Endpoint**: `/api/admin/coupons`
*   **Types**: Percentage or Fixed Amount.
*   **Constraints**: Minimum Order Value, Maximum Discount Amount, Usage Limit, Validity Dates.
*   **Targeting**: Can be user-specific (linked to a `user_id`).
*   **Stats**: Tracks usage count and total discount given.

---

## 4. Technical Implementation Details

### 4.1. Database Schema (PostgreSQL)
*   **ORM**: Drizzle ORM.
*   **Key Tables**:
    *   `products`, `product_variants` (One-to-Many).
    *   `orders`, `order_items` (One-to-Many).
    *   `profiles` (Users).
    *   `inventory_logs` (Audit).
    *   `admin_notifications`, `notification_recipients` (System Alerts).
    *   `coupons`, `coupon_usage` (Discounts).
    *   `admin_invitations` (Security).

### 4.2. API Architecture
*   **Framework**: Express.js.
*   **Security Middleware**:
    *   `requireAuth`: Validates Bearer token.
    *   `requireAdmin`: Checks `user.role === 'admin'`.
    *   `csurf`: CSRF protection for state-changing requests.
*   **Error Handling**: Centralized `handleRouteError` utility.

### 4.3. Third-Party Integrations
*   **Auth**: Supabase Auth.
*   **Payments**: Razorpay (Orders API, Refunds API).
*   **Notifications**: WhatsApp Business API (via custom service wrapper).

---

## 5. Identified Gaps & Recommendations

### 5.1. Critical Gaps
*   **Admin Invitation Routes Missing**: The logic exists in `adminInvitations.ts` but is **not wired up** in `routes.ts`. Admins currently cannot invite other admins via API.
*   **Customer WhatsApp Notifications**: The current implementation **only sends WhatsApp alerts to Admins**. There is no integration to send order updates (Shipped, Delivered) to Customers via WhatsApp, only Email.
*   **Real-time Dashboard**: The Admin Dashboard relies on page refreshes.
    *   *Recommendation*: Implement polling (e.g., every 30s) or Server-Sent Events (SSE) for the "Recent Orders" widget.
*   **Inventory Race Conditions**: While stock is checked before checkout, there is a small window between "Check" and "Payment Success" where stock could be depleted.
    *   *Recommendation*: Implement temporary stock reservation (e.g., 10 mins) when the payment page is initialized.
*   **Refund Failure Handling**: If the Razorpay refund API fails during cancellation, the system logs it but still marks the order as cancelled.
    *   *Recommendation*: Implement a "Refund Retry" queue or manual refund status flag.

### 5.2. UX Improvements
*   **Pagination**: `listOrdersHandler` supports pagination, but verify the frontend `Orders.tsx` implements it correctly for large datasets.
*   **Search**: Order search is limited. Consider adding search by "Phone Number" or "Email" to `listOrdersHandler`.

### 5.3. Security Enhancements
*   **Rate Limiting**: Ensure `express-rate-limit` is strictly applied to the `/api/auth/login` endpoint to complement the manual login attempt tracking.
