# Admin Product Management Guide

This guide explains the structure of the Product Management page in the Admin Panel and provides instructions on how to manage your catalog effectively.

## Product Form Overview

The product creation/editing form is divided into four main tabs to organize information logically.

### 1. General Information
**Purpose:** Defines the core identity of the product.

*   **Product Name:** The public title of the product.
    *   *Importance:* Used for search, SEO, and display. Should be descriptive and unique.
*   **Description:** Detailed information about the product.
    *   *Importance:* Crucial for customer decision-making and SEO. Use the rich text editor to format with bullets, bold text, etc.
*   **Status:** Controls visibility.
    *   `Draft`: Saved but not visible to customers.
    *   `Active`: Visible and purchasable.
    *   `Archived`: Hidden but preserved for records.
*   **Category:** The classification of the product (e.g., Clothing, Accessories).
    *   *Importance:* Helps customers find products via navigation and filters.

### 2. Inventory & Variants
**Purpose:** Manages pricing, stock levels, and product variations (sizes/colors).

*   **Pricing:**
    *   **Regular Price (₹):** The standard selling price.
    *   **Sale Price (₹):** (Optional) The discounted price. If set, the product will show as "On Sale".
*   **Inventory:**
    *   **SKU (Stock Keeping Unit):** A unique code for the product.
        *   *Importance:* Essential for inventory tracking and order management.
    *   **Low Stock Alert:** The threshold at which the system warns you that stock is running low.
*   **Variants (Crucial for Stock Management):**
    *   This section allows you to define different versions of the product (e.g., "Red / M", "Blue / L").
    *   **How to Update Stock:**
        1.  If the product has variants (e.g., sizes), you **MUST** add them here.
        2.  Click "Add Variant".
        3.  Select/Enter **Size** and **Color**.
        4.  Enter the **Stock** quantity for that specific combination.
        5.  **Note:** The total product stock is automatically calculated from these variants.

### 3. Media
**Purpose:** Manages product images.

*   **Default Images:** If no variants are defined, upload images here.
*   **Color Gallery:** If variants exist, this section organizes images by **Color**.
    *   *Importance:* Customers want to see the specific color they are selecting. Uploading red images for the "Red" variant ensures the image changes when they select "Red".
*   **Main Image:** Click the **Star Icon** on any uploaded image to set it as the primary thumbnail used in grids and search results.

### 4. SEO & Organization
**Purpose:** Additional details for search engines and internal organization.

*   **Fabric Quality:** (e.g., "100% Cotton", "Premium Silk").
    *   *Importance:* displayed in the "Product Details" section for customers.
*   **Wash Care:** (e.g., "Machine wash cold", "Dry clean only").
    *   *Importance:* Helps customers care for the product, reducing returns.

---

## How to Update Stock (Step-by-Step)

### Scenario A: Simple Product (No Variants)
1.  Go to the **Inventory & Variants** tab.
2.  Since there are no variants, the system might use a default "base" stock (if implemented) or require at least one variant.
    *   *Recommendation:* Always create at least one variant (e.g., "One Size" / "Default Color") for consistent tracking.

### Scenario B: Product with Variants (Sizes/Colors)
1.  Navigate to the **Inventory & Variants** tab.
2.  Scroll down to the **Variants** section.
3.  **To Add New Stock:**
    *   Click "Add Variant".
    *   Enter the Size (e.g., "M"), Color (e.g., "Navy"), and Quantity (e.g., "50").
    *   Click "Add".
4.  **To Update Existing Stock:**
    *   Find the variant in the list (e.g., "S / Red").
    *   Click the **Edit (Pencil)** icon next to it.
    *   Update the **Stock** number.
    *   Click "Update".
5.  **Save Changes:** Click the **"Save Product"** button at the bottom right of the page to apply changes to the database.
