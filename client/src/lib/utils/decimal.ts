/**
 * Decimal Precision Utilities
 * 
 * Safe decimal/currency calculations to prevent precision loss.
 * Uses string-based arithmetic for financial data.
 * 
 * **IMPORTANT:** Always use these utilities for money calculations!
 * JavaScript numbers lose precision for currency values.
 * 
 * @module lib/utils/decimal
 */

import { logger } from './logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Decimal value represented as string to prevent precision loss
 */
export type DecimalString = string;

/**
 * Currency code (ISO 4217)
 */
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default decimal precision for currency
 */
const DEFAULT_PRECISION = 2;

/**
 * Currency symbols
 */
const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates if string is a valid decimal number
 * 
 * @param value - Value to validate
 * @returns True if valid decimal string
 */
export function isValidDecimal(value: string): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  // Allow: digits, optional decimal point, optional sign
  const decimalRegex = /^-?\d+(\.\d+)?$/;
  return decimalRegex.test(value);
}

/**
 * Sanitizes decimal input
 * 
 * @param value - Raw value (string or number)
 * @returns Sanitized decimal string
 */
export function sanitizeDecimal(value: string | number): DecimalString {
  if (typeof value === 'number') {
    // Convert number to string with full precision
    return value.toFixed(DEFAULT_PRECISION);
  }
  
  if (typeof value !== 'string') {
    logger.warn('Invalid decimal value type', { type: typeof value });
    return '0.00';
  }
  
  // Remove whitespace
  const cleaned = value.trim();
  
  // Validate
  if (!isValidDecimal(cleaned)) {
    logger.warn('Invalid decimal format', { value });
    return '0.00';
  }
  
  // Ensure proper precision
  const parts = cleaned.split('.');
  if (parts.length === 1) {
    return `${parts[0]}.00`;
  }
  
  // Pad or trim decimal places
  const decimals = parts[1].padEnd(DEFAULT_PRECISION, '0').slice(0, DEFAULT_PRECISION);
  return `${parts[0]}.${decimals}`;
}

// ============================================================================
// Arithmetic Operations
// ============================================================================

/**
 * Adds two decimal numbers
 * 
 * @param a - First decimal
 * @param b - Second decimal
 * @returns Sum as decimal string
 */
export function addDecimal(a: DecimalString, b: DecimalString): DecimalString {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  
  if (isNaN(numA) || isNaN(numB)) {
    logger.error('Invalid decimal addition', { a, b });
    return '0.00';
  }
  
  // Use integer arithmetic to avoid precision loss
  const multiplier = Math.pow(10, DEFAULT_PRECISION);
  const intA = Math.round(numA * multiplier);
  const intB = Math.round(numB * multiplier);
  const sum = intA + intB;
  
  return (sum / multiplier).toFixed(DEFAULT_PRECISION);
}

/**
 * Subtracts two decimal numbers
 * 
 * @param a - First decimal
 * @param b - Second decimal (subtracted from a)
 * @returns Difference as decimal string
 */
export function subtractDecimal(a: DecimalString, b: DecimalString): DecimalString {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  
  if (isNaN(numA) || isNaN(numB)) {
    logger.error('Invalid decimal subtraction', { a, b });
    return '0.00';
  }
  
  const multiplier = Math.pow(10, DEFAULT_PRECISION);
  const intA = Math.round(numA * multiplier);
  const intB = Math.round(numB * multiplier);
  const diff = intA - intB;
  
  return (diff / multiplier).toFixed(DEFAULT_PRECISION);
}

/**
 * Multiplies two decimal numbers
 * 
 * @param a - First decimal
 * @param b - Second decimal
 * @returns Product as decimal string
 */
export function multiplyDecimal(a: DecimalString, b: DecimalString): DecimalString {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  
  if (isNaN(numA) || isNaN(numB)) {
    logger.error('Invalid decimal multiplication', { a, b });
    return '0.00';
  }
  
  const multiplier = Math.pow(10, DEFAULT_PRECISION);
  const intA = Math.round(numA * multiplier);
  const intB = Math.round(numB * multiplier);
  const product = intA * intB;
  
  // Divide by multiplier twice (once for each operand)
  return (product / (multiplier * multiplier)).toFixed(DEFAULT_PRECISION);
}

/**
 * Divides two decimal numbers
 * 
 * @param a - Dividend
 * @param b - Divisor
 * @returns Quotient as decimal string
 */
export function divideDecimal(a: DecimalString, b: DecimalString): DecimalString {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  
  if (isNaN(numA) || isNaN(numB)) {
    logger.error('Invalid decimal division', { a, b });
    return '0.00';
  }
  
  if (numB === 0) {
    logger.error('Division by zero', { a, b });
    return '0.00';
  }
  
  const multiplier = Math.pow(10, DEFAULT_PRECISION);
  const intA = Math.round(numA * multiplier);
  const intB = Math.round(numB * multiplier);
  
  // Multiply by multiplier to maintain precision
  const quotient = (intA * multiplier) / intB;
  
  return (quotient / multiplier).toFixed(DEFAULT_PRECISION);
}

// ============================================================================
// Comparison Operations
// ============================================================================

/**
 * Compares two decimal numbers
 * 
 * @param a - First decimal
 * @param b - Second decimal
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareDecimal(a: DecimalString, b: DecimalString): -1 | 0 | 1 {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  
  if (isNaN(numA) || isNaN(numB)) {
    logger.error('Invalid decimal comparison', { a, b });
    return 0;
  }
  
  const multiplier = Math.pow(10, DEFAULT_PRECISION);
  const intA = Math.round(numA * multiplier);
  const intB = Math.round(numB * multiplier);
  
  if (intA < intB) return -1;
  if (intA > intB) return 1;
  return 0;
}

/**
 * Checks if first decimal is greater than second
 * 
 * @param a - First decimal
 * @param b - Second decimal
 * @returns True if a > b
 */
export function isGreaterThan(a: DecimalString, b: DecimalString): boolean {
  return compareDecimal(a, b) === 1;
}

/**
 * Checks if first decimal is less than second
 * 
 * @param a - First decimal
 * @param b - Second decimal
 * @returns True if a < b
 */
export function isLessThan(a: DecimalString, b: DecimalString): boolean {
  return compareDecimal(a, b) === -1;
}

/**
 * Checks if decimals are equal
 * 
 * @param a - First decimal
 * @param b - Second decimal
 * @returns True if a === b
 */
export function isEqual(a: DecimalString, b: DecimalString): boolean {
  return compareDecimal(a, b) === 0;
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Formats decimal as currency
 * 
 * @param value - Decimal value
 * @param currency - Currency code
 * @param showSymbol - Whether to show currency symbol
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: DecimalString,
  currency: CurrencyCode = 'INR',
  showSymbol = true
): string {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    logger.warn('Invalid currency value', { value });
    return showSymbol ? `${CURRENCY_SYMBOLS[currency]}0.00` : '0.00';
  }
  
  const formatted = Math.abs(num).toFixed(DEFAULT_PRECISION);
  const symbol = showSymbol ? CURRENCY_SYMBOLS[currency] : '';
  const sign = num < 0 ? '-' : '';
  
  // Add thousands separators for INR (Indian numbering system)
  if (currency === 'INR') {
    const parts = formatted.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Indian numbering: 1,00,000 not 100,000
    let formattedInteger = '';
    const lastThree = integerPart.slice(-3);
    const remaining = integerPart.slice(0, -3);
    
    if (remaining) {
      formattedInteger = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    } else {
      formattedInteger = lastThree;
    }
    
    return `${sign}${symbol}${formattedInteger}.${decimalPart}`;
  }
  
  // Standard thousands separator for other currencies
  const parts = formatted.split('.');
  const formattedInteger = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${sign}${symbol}${formattedInteger}.${parts[1]}`;
}

/**
 * Formats decimal as percentage
 * 
 * @param value - Decimal value (0.15 = 15%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: DecimalString, decimals = 2): string {
  const num = parseFloat(value) * 100;
  
  if (isNaN(num)) {
    logger.warn('Invalid percentage value', { value });
    return '0.00%';
  }
  
  return `${num.toFixed(decimals)}%`;
}

// ============================================================================
// Calculation Helpers
// ============================================================================

/**
 * Calculates discount amount
 * 
 * @param price - Original price
 * @param discountPercent - Discount percentage (e.g., "15" for 15%)
 * @returns Discount amount
 */
export function calculateDiscount(
  price: DecimalString,
  discountPercent: DecimalString
): DecimalString {
  const discountDecimal = divideDecimal(discountPercent, '100');
  return multiplyDecimal(price, discountDecimal);
}

/**
 * Calculates final price after discount
 * 
 * @param price - Original price
 * @param discountPercent - Discount percentage
 * @returns Final price after discount
 */
export function calculateDiscountedPrice(
  price: DecimalString,
  discountPercent: DecimalString
): DecimalString {
  const discount = calculateDiscount(price, discountPercent);
  return subtractDecimal(price, discount);
}

/**
 * Calculates tax amount
 * 
 * @param price - Base price
 * @param taxPercent - Tax percentage (e.g., "18" for 18% GST)
 * @returns Tax amount
 */
export function calculateTax(
  price: DecimalString,
  taxPercent: DecimalString
): DecimalString {
  const taxDecimal = divideDecimal(taxPercent, '100');
  return multiplyDecimal(price, taxDecimal);
}

/**
 * Calculates total with tax
 * 
 * @param price - Base price
 * @param taxPercent - Tax percentage
 * @returns Total price including tax
 */
export function calculatePriceWithTax(
  price: DecimalString,
  taxPercent: DecimalString
): DecimalString {
  const tax = calculateTax(price, taxPercent);
  return addDecimal(price, tax);
}

/**
 * Calculates profit margin
 * 
 * @param sellingPrice - Selling price
 * @param costPrice - Cost price
 * @returns Profit margin as decimal (0.15 = 15%)
 */
export function calculateProfitMargin(
  sellingPrice: DecimalString,
  costPrice: DecimalString
): DecimalString {
  const profit = subtractDecimal(sellingPrice, costPrice);
  return divideDecimal(profit, sellingPrice);
}

// ============================================================================
// Conversion Helpers
// ============================================================================

/**
 * Converts database decimal to DecimalString
 * Database returns string, but ensure proper format
 * 
 * @param dbValue - Value from database
 * @returns Sanitized decimal string
 */
export function fromDatabase(dbValue: string | null | undefined): DecimalString {
  if (!dbValue) return '0.00';
  return sanitizeDecimal(dbValue);
}

/**
 * Converts DecimalString to number (use sparingly!)
 * Only use when absolutely necessary (e.g., charts)
 * 
 * @param value - Decimal string
 * @returns Number value
 */
export function toNumber(value: DecimalString): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Converts number to DecimalString
 * 
 * @param value - Number value
 * @returns Decimal string
 */
export function fromNumber(value: number): DecimalString {
  if (isNaN(value)) {
    logger.warn('Converting NaN to decimal', { value });
    return '0.00';
  }
  
  return value.toFixed(DEFAULT_PRECISION);
}

// ============================================================================
// Validation Schema Helpers
// ============================================================================

/**
 * Zod schema for decimal validation
 */
export const decimalSchema = z.string().refine(isValidDecimal, {
  message: 'Invalid decimal format',
});

/**
 * Zod schema for positive decimal
 */
export const positiveDecimalSchema = z.string().refine(
  (val) => isValidDecimal(val) && parseFloat(val) >= 0,
  { message: 'Must be a positive decimal' }
);

/**
 * Zod schema for currency validation
 */
export const currencySchema = z.string().refine(
  (val) => isValidDecimal(val) && parseFloat(val) >= 0,
  { message: 'Invalid currency amount' }
);
