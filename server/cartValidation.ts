/**
 * Cart Validation Routes
 * Handles validation of cart items against current inventory
 */

import { Router, Request, Response } from "express";
import { db } from "./db/supabase";
import { products } from "../shared/schema";
import { inArray, eq } from "drizzle-orm";
import {
  CartValidationResult,
  CartValidationError,
  CartValidationWarning,
} from "./types/cartValidation";

const router = Router();

/**
 * POST /api/cart/validate-item-addition
 * Pre-validates if an item can be added to the cart before adding
 */
router.post("/validate-item-addition", async (req: Request, res: Response) => {
  try {
    const { product_id, variant_id, quantity, size } = req.body;

    console.log(`[CART] Validating item addition: product_id=${product_id}, variant_id=${variant_id}, quantity=${quantity}`);

    if (!product_id || !quantity || quantity < 1) {
      return res.status(400).json({
        valid: false,
        message: "Invalid product_id or quantity",
      });
    }

    // If variant_id is provided, validate against variant stock
    if (variant_id) {
      const { data: variantData, error: variantError } = await supabase
        .from("product_variants")
        .select("id, stock_quantity, status, product_id")
        .eq("id", variant_id)
        .single();
      
      const variant = variantData as any;

      if (variantError || !variant) {
        console.log(`[CART] Variant not found: ${variant_id}`);
        return res.json({
          valid: false,
          message: "Selected variant not found",
        });
      }

      if (variant.status !== "active") {
        return res.json({
          valid: false,
          message: "Selected variant is not available",
        });
      }

      if ((variant.stock_quantity || 0) < quantity) {
        return res.json({
          valid: false,
          message: `Only ${variant.stock_quantity || 0} item(s) available`,
          availableQuantity: variant.stock_quantity || 0,
        });
      }

      console.log(`[CART] Variant validation passed: stock=${variant.stock_quantity}`);
      return res.json({
        valid: true,
        message: "Item can be added",
        availableQuantity: variant.stock_quantity,
      });
    }

    // Fallback to product-level validation
    const { data: productData, error } = await supabase
      .from("products")
      .select("id, name, stock_quantity, status")
      .eq("id", product_id)
      .single();
    
    const product = productData as any;

    if (error || !product) {
      console.log(`[CART] Product not found: ${product_id}, error: ${error?.message}`);
      return res.json({
        valid: false,
        message: "Product not found",
      });
    }

    if (product.status !== "active") {
      return res.json({
        valid: false,
        message: `${product.name} is not available`,
      });
    }

    if (product.stock_quantity <= 0) {
      return res.json({
        valid: false,
        message: `${product.name} is out of stock`,
      });
    }

    if (quantity > product.stock_quantity) {
      return res.json({
        valid: false,
        message: `Only ${product.stock_quantity} item(s) available for ${product.name}`,
        availableQuantity: product.stock_quantity,
      });
    }

    res.json({
      valid: true,
      message: "Item can be added",
      availableQuantity: product.stock_quantity,
    });
  } catch (error: any) {
    console.error("Item addition validation error:", error);
    res.status(500).json({
      valid: false,
      message: error.message || "Validation failed",
    });
  }
});

/**
 * POST /api/cart/validate-quantity
 * Validates if a quantity update is allowed for a cart item
 */
router.post("/validate-quantity", async (req: Request, res: Response) => {
  try {
    const { id, quantity } = req.body;

    if (!id || !quantity || quantity < 1) {
      return res.status(400).json({
        valid: false,
        message: "Invalid cart item id or quantity",
      });
    }

    // Get cart item to find product
    const cartId = (req as any).user?.cartId || (req as any).headers['x-cart-id'];
    
    if (!cartId) {
      return res.status(401).json({
        valid: false,
        message: "Cart not found",
      });
    }

    // Note: For a production app, you'd fetch the cart item from DB
    // For now, we'll just validate the quantity against product inventory
    // This assumes the product_id is passed or we can fetch it from context
    
    // As a simplified approach, validate quantity is positive
    if (quantity < 1) {
      return res.json({
        valid: false,
        message: "Quantity must be at least 1",
      });
    }

    if (quantity > 100) {
      return res.json({
        valid: false,
        message: "Quantity cannot exceed 100",
      });
    }

    // If quantity is reasonable, it's valid
    res.json({
      valid: true,
      message: "Quantity is valid",
      adjustedQuantity: quantity,
    });
  } catch (error: any) {
    console.error("Quantity validation error:", error);
    res.status(500).json({
      valid: false,
      message: error.message || "Validation failed",
    });
  }
});

/**
 * POST /api/cart/validate
 * Validates entire cart against current inventory
 * Returns validation errors and warnings
 */
router.post("/validate", async (req: Request, res: Response) => {
  console.log('[CART_VALIDATE] Received request:', JSON.stringify(req.body, null, 2).slice(0, 500));
  
  try {
    const { cart } = req.body;

    // Handle missing or empty cart gracefully
    if (!cart || !cart.items) {
      console.log('[CART_VALIDATE] No cart or cart.items, returning valid');
      return res.json({
        isValid: true,
        errors: [],
        warnings: [],
        totalInvalidItems: 0,
      });
    }

    if (!Array.isArray(cart.items) || cart.items.length === 0) {
      console.log('[CART_VALIDATE] cart.items empty or not array, returning valid');
      return res.json({
        isValid: true,
        errors: [],
        warnings: [],
        totalInvalidItems: 0,
      });
    }

    console.log(`[CART_VALIDATE] Validating ${cart.items.length} items`);

    const errors: CartValidationError[] = [];
    const warnings: CartValidationWarning[] = [];
    let adjustedCart = { ...cart, items: [...cart.items] };

    // Fetch all products referenced in cart
    const productIds = cart.items
      .map((item: any) => item.product_id)
      .filter((id: any) => id);
    
    console.log('[CART_VALIDATE] Product IDs to validate:', productIds);
      
    // No valid product IDs to validate
    if (productIds.length === 0) {
      console.log('[CART_VALIDATE] No valid product IDs found');
      return res.json({
        isValid: true,
        errors: [],
        warnings: [],
        totalInvalidItems: 0,
      });
    }
    
    // Use Drizzle (service role) instead of Supabase client (RLS restricted)
    const productsList = await db.select({
      id: products.id,
      name: products.name,
      price: products.price,
      sale_price: products.sale_price,
      stock_quantity: products.stock_quantity,
      low_stock_threshold: products.low_stock_threshold
    })
    .from(products)
    .where(inArray(products.id, productIds));
    
    console.log(`[CART_VALIDATE] Found ${productsList.length} products in DB`);

    // Validate each cart item
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      const product = productsList.find((p: any) => p.id === item.product_id);

      // Check if product still exists
      if (!product) {
        errors.push({
          item_id: item.id,
          product_id: item.product_id,
          type: "product_deleted",
          message: "Product no longer exists",
          requested_quantity: item.quantity,
        });
        // Remove from adjusted cart
        adjustedCart.items = adjustedCart.items.filter(
          (cartItem: any) => cartItem.id !== item.id
        );
        continue;
      }

      // Check stock availability
      if (product.stock_quantity <= 0) {
        errors.push({
          item_id: item.id,
          product_id: item.product_id,
          type: "out_of_stock",
          message: `${product.name} is out of stock`,
          available_quantity: 0,
          requested_quantity: item.quantity,
        });
        // Remove from adjusted cart
        adjustedCart.items = adjustedCart.items.filter(
          (cartItem: any) => cartItem.id !== item.id
        );
        continue;
      }

      // Check if quantity exceeds available stock
      if (item.quantity > product.stock_quantity) {
        errors.push({
          item_id: item.id,
          product_id: item.product_id,
          type: "quantity_exceeded",
          message: `Not enough stock available for ${product.name}`,
          available_quantity: product.stock_quantity,
          requested_quantity: item.quantity,
        });
        // Adjust quantity to available stock
        const itemIndex = adjustedCart.items.findIndex(
          (cartItem: any) => cartItem.id === item.id
        );
        if (itemIndex >= 0) {
          adjustedCart.items[itemIndex].quantity = product.stock_quantity;
        }
        continue;
      }

      // Check for low stock warning
      if (
        product.stock_quantity <= product.low_stock_threshold &&
        product.stock_quantity > 0
      ) {
        warnings.push({
          item_id: item.id,
          product_id: item.product_id,
          type: "low_stock",
          message: `Only ${product.stock_quantity} item(s) in stock`,
          current_value: product.stock_quantity,
        });
      }

      // Check for price changes
      const currentPrice = product.sale_price || product.price;
      if (item.unit_price !== currentPrice) {
        warnings.push({
          item_id: item.id,
          product_id: item.product_id,
          type: "price_changed",
          message: `Price has changed from ${item.unit_price} to ${currentPrice}`,
          previous_value: item.unit_price,
          current_value: currentPrice,
        });
      }
    }

    // Recalculate cart totals if items were removed or adjusted
    if (adjustedCart.items.length !== cart.items.length) {
      adjustedCart.subtotal = adjustedCart.items.reduce(
        (sum: number, item: any) => sum + item.unit_price * item.quantity,
        0
      );
    }

    const result: CartValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      adjustedCart: adjustedCart.items.length !== cart.items.length ? adjustedCart : undefined,
      totalInvalidItems: errors.filter((e) => e.type !== "quantity_exceeded").length,
    };

    res.json(result);
  } catch (error: any) {
    console.error("Cart validation error:", error);
    res.status(500).json({ error: error.message || "Cart validation failed" });
  }
});

/**
 * POST /api/products/validate-stock
 * Validates if a specific product quantity can be added to cart
 */
router.post("/products/validate-stock", async (req: Request, res: Response) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity < 1) {
      return res.status(400).json({ error: "Invalid product_id or quantity" });
    }

    // Fetch product stock
    const { data: productData, error } = await supabase
      .from("products")
      .select("id, name, stock_quantity, low_stock_threshold")
      .eq("id", product_id)
      .single();
    
    const product = productData as any;

    if (error) throw error;

    if (!product) {
      return res.status(404).json({
        canAdd: false,
        availableQuantity: 0,
        message: "Product not found",
      });
    }

    if (product.stock_quantity <= 0) {
      return res.json({
        canAdd: false,
        availableQuantity: 0,
        message: `${product.name} is out of stock`,
      });
    }

    const canAdd = quantity <= product.stock_quantity;

    res.json({
      canAdd,
      availableQuantity: product.stock_quantity,
      message: canAdd
        ? `You can add up to ${product.stock_quantity} item(s)`
        : `Only ${product.stock_quantity} item(s) available. You requested ${quantity}`,
    });
  } catch (error: any) {
    console.error("Stock validation error:", error);
    res
      .status(500)
      .json({ error: error.message || "Stock validation failed" });
  }
});

/**
 * GET /api/products/:id/stock
 * Get stock information for a product
 */
router.get("/products/:id/stock", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: productData, error } = await supabase
      .from("products")
      .select(
        "id, stock_quantity, low_stock_threshold, status"
      )
      .eq("id", id)
      .single();

    const product = productData as any;

    if (error) throw error;

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      product_id: product.id,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold || 5,
      is_available:
        product.status === "active" && product.stock_quantity > 0,
    });
  } catch (error: any) {
    console.error("Get product stock error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch stock info" });
  }
});

/**
 * POST /api/cart/validate-for-checkout
 * Comprehensive validation for checkout - stock, price, availability
 * Returns detailed validation errors that prevent checkout
 */
router.post("/validate-for-checkout", async (req: Request, res: Response) => {
  try {
    const { cart } = req.body;

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.json({
        isValid: false,
        errors: [{ message: "Cart is empty" }],
        warnings: [],
      });
    }

    const errors: any[] = [];
    const warnings: any[] = [];

    const productIds = cart.items.map((item: any) => item.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, price, sale_price, stock_quantity, status, name");

    const productsMap = new Map((products as any[])?.map((p: any) => [p.id, p]) || []);

    let total = 0;

    for (const item of cart.items) {
      const product = productsMap.get(item.product_id);

      if (!product) {
        errors.push({
          product_id: item.product_id,
          type: "product_deleted",
          message: `Product not found. It may have been removed.`,
        });
        continue;
      }

      if (product.status !== "active") {
        errors.push({
          product_id: item.product_id,
          product_name: product.name,
          type: "product_unavailable",
          message: `${product.name} is no longer available for purchase.`,
        });
        continue;
      }

      if (product.stock_quantity <= 0) {
        errors.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity_requested: item.quantity,
          available_quantity: 0,
          type: "out_of_stock",
          message: `${product.name} is out of stock.`,
        });
        continue;
      }

      if (product.stock_quantity < item.quantity) {
        errors.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity_requested: item.quantity,
          available_quantity: product.stock_quantity,
          type: "insufficient_stock",
          message: `Only ${product.stock_quantity} of ${product.name} available. You have ${item.quantity} in cart.`,
        });
        continue;
      }

      const currentPrice = product.sale_price || product.price;
      if (Math.abs(Number(currentPrice) - Number(item.unit_price)) > 0.01) {
        warnings.push({
          product_id: item.product_id,
          product_name: product.name,
          type: "price_changed",
          old_price: item.unit_price,
          new_price: currentPrice,
          message: `Price of ${product.name} changed from ₹${item.unit_price} to ₹${currentPrice}`,
        });
      }

      if (product.stock_quantity < 5) {
        warnings.push({
          product_id: item.product_id,
          product_name: product.name,
          type: "low_stock",
          available_quantity: product.stock_quantity,
          message: `Only ${product.stock_quantity} of ${product.name} left in stock.`,
        });
      }

      total += Number(currentPrice) * item.quantity;
    }

    res.json({
      isValid: errors.length === 0,
      errors,
      warnings,
      recalculatedTotal: total,
    });
  } catch (error: any) {
    console.error("Checkout validation error:", error);
    res.status(500).json({
      isValid: false,
      errors: [{ message: error.message || "Validation failed" }],
      warnings: [],
    });
  }
});

export default router;
