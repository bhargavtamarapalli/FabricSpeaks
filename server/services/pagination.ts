/**
 * Pagination Service - Handles cursor-based pagination for optimal performance
 * @module services/pagination
 */

import { z } from 'zod';

/**
 * Maximum items per page - prevents excessive memory usage
 */
export const MAX_PAGE_SIZE = 50;

/**
 * Default page size if not specified
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Pagination request schema with validation
 */
export const PaginationRequestSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;

/**
 * Generic pagination response with cursor-based navigation
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Cursor pagination configuration
 */
export interface CursorPaginationOptions {
  cursorField: string; // Field to use for cursor (e.g., 'created_at', 'id')
  direction: 'asc' | 'desc';
}

/**
 * Encodes cursor data to base64 string
 * @param data - Data to encode
 * @returns Base64 encoded cursor
 */
export function encodeCursor(data: Record<string, any>): string {
  try {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  } catch (error) {
    throw new Error('Failed to encode cursor');
  }
}

/**
 * Decodes cursor from base64 string
 * @param cursor - Base64 encoded cursor
 * @returns Decoded cursor data
 */
export function decodeCursor(cursor: string): Record<string, any> {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch (error) {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Validates pagination parameters
 * @param params - Pagination parameters to validate
 * @returns Validated pagination parameters
 */
export function validatePaginationParams(params: {
  limit?: number;
  cursor?: string;
}): PaginationRequest {
  const limit = Math.max(1, Math.min(params.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE));
  
  return {
    limit,
    cursor: params.cursor,
  };
}

/**
 * Creates a paginated response
 * @param items - Items for current page
 * @param limit - Items per page
 * @param total - Total count (optional)
 * @param getCursor - Function to extract cursor value from item
 * @returns Paginated response object
 */
export function createPaginatedResponse<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string | number,
  total?: number
): PaginatedResponse<T> {
  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;
  
  let nextCursor: string | null = null;
  if (hasMore && resultItems.length > 0) {
    const lastItem = resultItems[resultItems.length - 1];
    nextCursor = encodeCursor({ value: getCursor(lastItem) });
  }

  return {
    items: resultItems,
    nextCursor,
    hasMore,
    ...(total !== undefined && { total }),
  };
}

/**
 * Offset-based pagination parameters (for backward compatibility)
 */
export interface OffsetPaginationParams {
  limit: number;
  offset: number;
}

/**
 * Converts cursor to offset for hybrid pagination
 * @param cursor - Cursor to convert
 * @param defaultOffset - Default offset if cursor is invalid
 * @returns Offset value
 */
export function cursorToOffset(cursor: string | undefined, defaultOffset = 0): number {
  if (!cursor) return defaultOffset;
  
  try {
    const decoded = decodeCursor(cursor);
    return typeof decoded.offset === 'number' ? decoded.offset : defaultOffset;
  } catch {
    return defaultOffset;
  }
}
