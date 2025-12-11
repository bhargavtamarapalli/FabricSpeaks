Comprehensive Product Requirements Document (PRD)

E-commerce Admin Panel (Core + Advanced Phase)

Field

Value

Project Name

E-commerce Admin Panel

Version

2.1 (Updated)

Status

Approved for Development & QA

Tech Stack

Supabase PostgreSQL (Drizzle ORM), Express.js, Supabase Auth, Razorpay

1. Executive Summary

The E-commerce Admin Panel is the central nervous system for the fashion e-commerce platform. This document defines the requirements for Phase 1 (Core Operations) and Phase 2 (Growth & Automation). It serves as the single source of truth for Developers, Product Managers, and QA Engineers.

Primary Goals:

Operational Efficiency: Streamline product listing, inventory management, and order fulfillment.

Growth Automation: Implement tools for customer engagement (Polls, Cart Recovery).

Reliability: Ensure 99.9% data integrity in stock and payments.

2. User Authentication & Roles

2.1. Feature Description

Secure access control using Supabase Auth. The system must support role-based access and store user-specific application settings.

2.2. Functional Requirements

REQ-AUTH-01: Users must log in via Email/Password.

REQ-AUTH-02: System must enforce a strong password policy (Min 8 chars, 1 Upper, 1 Special).

REQ-AUTH-03: Brute Force Protection: Account is temporarily flagged/admin notified after 5 failed attempts in 15 minutes.

REQ-AUTH-04: Role Management:

Super Admin: Can manage other admins and system configs.

Admin: Full access to Products, Orders, Inventory.

Store Manager: Read-only access to reports, Write access to Orders.

2.3. QA & Automation Specifications

ID

Test Scenario

Type

Expected Result

TC-AUTH-01

Verify login with valid credentials

Positive

User redirected to Dashboard; JWT token stored.

TC-AUTH-02

Verify login with invalid password

Negative

Error message "Invalid credentials"; Attempt counter increments.

TC-AUTH-03

Verify Brute Force Lockout

Security

After 5th failure, 6th attempt fails even with valid password (for lockout duration).

3. Product Management (Core)

3.1. Feature Description

A robust interface to manage the product catalog, including complex variants (Size/Color), SEO metadata, and media capability.

3.2. Functional Requirements

REQ-PROD-01: CRUD operations for Products (Title, Description, SKU, Base Price).

REQ-PROD-02: Variant Support: Ability to add multiple variants (e.g., Red/M, Red/L) with distinct SKUs and Stock levels.

REQ-PROD-03: Media: Upload up to 5 images per color variant (Stored in Supabase Storage).

REQ-PROD-04: SEO Control: Editable fields for meta_title and meta_description.

REQ-PROD-05: Bulk Actions: CSV Import/Export for mass product updates.

3.3. QA & Automation Specifications

ID

Test Scenario

Type

Expected Result

TC-PROD-01

Create Product with Variants

Positive

Product and related rows in product_variants table are created successfully.

TC-PROD-02

Duplicate SKU Check

Negative

System prevents saving a product if SKU already exists in DB.

TC-PROD-04

CSV Import Validation

Integration

Uploading CSV with malformed headers returns line-specific error report.

4. Inventory Management (Core)

4.1. Feature Description

Real-time tracking of stock levels to prevent overselling.

4.2. Functional Requirements

REQ-INV-01: Real-time stock display on Admin Dashboard via Supabase Realtime.

REQ-INV-02: Low Stock Alerts: Highlight variants with Quantity <= 10.

REQ-INV-03: Manual Adjustment: Admins can manually +/- stock. Must require a "Reason" note (e.g., "Damaged", "Return").

REQ-INV-04: Reservation System (Race Condition Fix): When a customer initiates checkout, stock is "Reserved" for 10 minutes. If payment fails, stock is released.

3.3. QA & Automation Specifications

ID

Test Scenario

Type

Expected Result

TC-INV-01

Verify Stock Deduction

Positive

Paid order of Qty 2 reduces Inventory from 10 to 8 immediately.

TC-INV-03

Race Condition Simulation

Stress

2 concurrent requests for the last 1 item result in 1 Success, 1 Failure.

5. Order Management & Notifications (Core)

5.1. Feature Description

Centralized processing of customer orders and a configurable notification system for Admins.

5.2. Functional Requirements

REQ-ORD-01: List view of all orders with Status Filters (Pending, Processing, Shipped, Delivered, Cancelled).

REQ-ORD-02: Status Workflow: Updates trigger notifications to Customer (Email) and Admin (WhatsApp - based on preference).

REQ-ORD-03: Auto-Refund: Marking an order "Cancelled" automatically triggers Razorpay Refund API.

REQ-NOTIF-01: Admin Notification Preferences: A settings page where Admins can toggle WhatsApp alerts for:

New Order Received

Order Cancelled/Refunded

Low Stock Alerts

Shipping Updates

REQ-NOTIF-02: Delivery Logic: The backend must check the admin_preferences table before sending a WhatsApp message to a specific Admin.

5.3. QA & Automation Specifications

ID

Test Scenario

Type

Expected Result

TC-ORD-01

Order Status Transition

Flow

Changing status to "Shipped" requires input of Tracking Number.

TC-NOTIF-01

Preference Toggle OFF

Functional

Admin disables "New Order" alerts; Place order; Admin receives NO WhatsApp msg.

TC-NOTIF-02

Preference Toggle ON

Functional

Admin enables "Low Stock" alerts; Stock drops to 5; Admin receives WhatsApp msg.

6. Advanced Features (Phase 2 - Growth)

6.1. Smart Marketing & Cart Recovery

REQ-MKT-01: Abandoned Cart Tracker: Identify carts inactive for > 1 hour.

REQ-MKT-02: Auto-Recovery: Send automated WhatsApp/Email with a 5% discount code to abandoned users.

REQ-MKT-03: Banner Manager: CMS interface to upload Homepage Hero Banners and set "Active Dates" for campaigns.

6.2. Engagement Polls

REQ-POLL-01: Admin interface to create Polls (Question + Options).

REQ-POLL-02: Real-time stats view showing vote distribution.

REQ-POLL-03: Toggle functionality to set a poll as "Active" on the storefront.

REQ-POLL-04: User Voting: Logged-in users can vote once per poll. Results are aggregated in real-time.

REQ-POLL-05: Poll Widget: Frontend component to display active poll and results.

6.3. QA & Automation Specifications

ID

Test Scenario

Type

Expected Result

TC-MKT-01

Cart Abandonment Trigger

Cron Job

Script identifies carts modified > 60 mins ago and inserts into notification queue.

TC-POLL-01

Poll Creation

Functional

Created poll appears in DB; Active flag defaults to False.

TC-POLL-02

User Voting Logic

Functional

User can vote once; Second attempt returns error; Results update immediately.

TC-MKT-02

Banner Scheduling

Functional

Banner with start_date > now is NOT visible via API. Banner with valid date range IS visible.

7. Technical Architecture Specifications

Database: Supabase PostgreSQL (v14+).

ORM: Drizzle ORM (Schema migration management required).

Authentication: Supabase Auth (JWT Bearer Tokens).

Payment Gateway: Razorpay (Webhooks enabled for payment_captured, refund_processed).

Notification Service: WhatsApp Business API (Integrated with user preference logic).

8. Success Metrics (KPIs)

Order Processing Time: Reduce time from "Pending" to "Shipped" by 20%.

Notification Relevance: Admins report 90% satisfaction with alert frequency (due to preference settings).

System Uptime: Maintain 99.9% uptime during peak sale events.