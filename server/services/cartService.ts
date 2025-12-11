/**
 * Cart Service
 * 
 * Centralized business logic for cart operations.
 * Handles price lookups, stock validation, and cart manipulation.
 * 
 * @module services/cartService
 */

import { db, supabase } from '../db/supabase';
import { products, productVariants } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { CartError } from '../utils/cartErrors';
import { CartConfig } from '../../shared/config/cart.config';

/**
 * Result of price lookup
 */
export interface PriceLookupResult {
  price: number;
  salePrice: number | null;
  currentPrice: number;
  productName: string;
  productStatus: string;
}

/**
 * Result of stock lookup
 */
export interface StockLookupResult {
  available: number;
  isInStock: boolean;
  lowStockThreshold: number;
  isLowStock: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: CartError;
  data?: {
    currentPrice: number;
    availableStock: number;
    productName: string;
  };
}

/**
 * Cart Service - Centralized cart business logic
 */
export class CartService {
  
  /**
   * Look up current price for a product/variant
   * ALWAYS use this instead of trusting client-provided prices
   * 
   * @param productId - Product UUID
   * @param variantId - Optional variant UUID
   * @returns Current price information
   * @throws CartError if product/variant not found
   */
  async lookupPrice(productId: string, variantId?: string | null): Promise<PriceLookupResult> {
    // If variant is specified, get variant price adjustment
    let priceAdjustment = 0;
    
    if (variantId) {
      const variant = await db
        .select({
          priceAdjustment: productVariants.price_adjustment,
          status: productVariants.status
        })
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);

      if (variant.length === 0) {
        throw new CartError('VARIANT_NOT_FOUND');
      }

      if (variant[0].status !== 'active') {
        throw new CartError('VARIANT_NOT_FOUND');
      }

      priceAdjustment = Number(variant[0].priceAdjustment) || 0;
    }

    // Get product price
    const product = await db
      .select({
        name: products.name,
        price: products.price,
        salePrice: products.sale_price,
        status: products.status
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      throw new CartError('PRODUCT_NOT_FOUND');
    }

    if (product[0].status !== 'active') {
      throw new CartError('PRODUCT_INACTIVE');
    }

    const basePrice = Number(product[0].price);
    const salePrice = product[0].salePrice ? Number(product[0].salePrice) : null;
    const effectiveBasePrice = salePrice || basePrice;
    const currentPrice = effectiveBasePrice + priceAdjustment;

    return {
      price: basePrice,
      salePrice,
      currentPrice,
      productName: product[0].name,
      productStatus: product[0].status
    };
  }

  /**
   * Look up current stock for a product/variant
   * 
   * @param productId - Product UUID
   * @param variantId - Optional variant UUID
   * @returns Stock information
   */
  async lookupStock(productId: string, variantId?: string | null): Promise<StockLookupResult> {
    let available: number;
    let lowStockThreshold: number = 10;

    if (variantId) {
      // Check variant stock
      const variant = await db
        .select({
          stockQuantity: productVariants.stock_quantity,
          status: productVariants.status
        })
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);

      if (variant.length === 0) {
        throw new CartError('VARIANT_NOT_FOUND');
      }

      available = variant[0].stockQuantity || 0;
    } else {
      // Check product stock
      const product = await db
        .select({
          stockQuantity: products.stock_quantity,
          lowStockThreshold: products.low_stock_threshold
        })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (product.length === 0) {
        throw new CartError('PRODUCT_NOT_FOUND');
      }

      available = product[0].stockQuantity || 0;
      lowStockThreshold = product[0].lowStockThreshold || 10;
    }

    return {
      available,
      isInStock: available > 0,
      lowStockThreshold,
      isLowStock: available > 0 && available <= lowStockThreshold
    };
  }

  /**
   * Validate if an item can be added to cart
   * Combines price lookup and stock check
   * 
   * @param productId - Product UUID
   * @param variantId - Optional variant UUID
   * @param quantity - Quantity to add
   * @returns Validation result with current price and stock
   */
  async validateItemAddition(
    productId: string, 
    variantId: string | null, 
    quantity: number
  ): Promise<ValidationResult> {
    // Validate quantity
    if (quantity < CartConfig.MIN_QUANTITY_PER_ITEM) {
      return { valid: false, error: new CartError('INVALID_QUANTITY') };
    }

    if (quantity > CartConfig.MAX_QUANTITY_PER_ITEM) {
      return { valid: false, error: new CartError('MAX_QUANTITY_EXCEEDED') };
    }

    try {
      // Get price (validates product/variant exists and is active)
      const priceResult = await this.lookupPrice(productId, variantId);

      // Get stock
      const stockResult = await this.lookupStock(productId, variantId);

      // Check stock availability
      if (!stockResult.isInStock) {
        return { 
          valid: false, 
          error: new CartError('OUT_OF_STOCK') 
        };
      }

      if (quantity > stockResult.available) {
        return { 
          valid: false, 
          error: new CartError('INSUFFICIENT_STOCK', { available: stockResult.available }) 
        };
      }

      return {
        valid: true,
        data: {
          currentPrice: priceResult.currentPrice,
          availableStock: stockResult.available,
          productName: priceResult.productName
        }
      };
    } catch (error) {
      if (error instanceof CartError) {
        return { valid: false, error };
      }
      throw error;
    }
  }

  /**
   * Validate quantity update for existing cart item
   * 
   * @param productId - Product UUID
   * @param variantId - Optional variant UUID
   * @param newQuantity - New quantity
   * @param currentQuantity - Current quantity in cart
   * @returns Validation result
   */
  async validateQuantityUpdate(
    productId: string,
    variantId: string | null,
    newQuantity: number,
    currentQuantity: number
  ): Promise<ValidationResult> {
    if (newQuantity < CartConfig.MIN_QUANTITY_PER_ITEM) {
      return { valid: false, error: new CartError('INVALID_QUANTITY') };
    }

    if (newQuantity > CartConfig.MAX_QUANTITY_PER_ITEM) {
      return { valid: false, error: new CartError('MAX_QUANTITY_EXCEEDED') };
    }

    // Only check stock if increasing quantity
    if (newQuantity > currentQuantity) {
      const stockResult = await this.lookupStock(productId, variantId);
      
      if (newQuantity > stockResult.available) {
        return {
          valid: false,
          error: new CartError('INSUFFICIENT_STOCK', { available: stockResult.available })
        };
      }
    }

    const priceResult = await this.lookupPrice(productId, variantId);

    return {
      valid: true,
      data: {
        currentPrice: priceResult.currentPrice,
        availableStock: 0, // Not needed for update
        productName: priceResult.productName
      }
    };
  }

  /**
   * Calculate cart totals
   * 
   * @param items - Cart items with quantity and unit_price
   * @returns Calculated totals
   */
  calculateTotals(items: Array<{ quantity: number; unit_price: number | string }>) {
    const subtotal = items.reduce((sum, item) => {
      const price = typeof item.unit_price === 'string' 
        ? parseFloat(item.unit_price) 
        : item.unit_price;
      return sum + (price * item.quantity);
    }, 0);

    const shipping = subtotal >= CartConfig.FREE_SHIPPING_THRESHOLD 
      ? 0 
      : CartConfig.DEFAULT_SHIPPING_COST;

    const tax = Math.round(subtotal * CartConfig.TAX_RATE * 100) / 100;
    const total = subtotal + shipping + tax;

    return {
      subtotal,
      shipping,
      tax,
      total,
      freeShippingThreshold: CartConfig.FREE_SHIPPING_THRESHOLD,
      amountToFreeShipping: Math.max(0, CartConfig.FREE_SHIPPING_THRESHOLD - subtotal)
    };
  }
}

// Singleton instance
export const cartService = new CartService();
