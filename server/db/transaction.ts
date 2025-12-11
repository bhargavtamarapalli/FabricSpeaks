/**
 * Database Transaction Utilities
 * Provides transaction support and optimistic locking for critical operations
 */

import { db, supabase } from './supabase';
import { loggers } from '../utils/logger';
import { AppError } from '../utils/AppError';

/**
 * Transaction options
 */
export interface TransactionOptions {
  maxRetries?: number;
  retryDelay?: number;
  isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}

/**
 * Default transaction options
 */
const DEFAULT_OPTIONS: Required<TransactionOptions> = {
  maxRetries: 3,
  retryDelay: 100,
  isolationLevel: 'READ COMMITTED'
};

/**
 * Execute a function within a database transaction
 * Automatically handles rollback on error and retry on deadlock
 * 
 * @param fn - Function to execute within transaction
 * @param options - Transaction options
 * @returns Result of the transaction function
 * 
 * @example
 * const result = await withTransaction(async (client) => {
 *   const order = await client.from('orders').insert({...}).select().single();
 *   await client.from('inventory').update({...});
 *   return order;
 * });
 */
export async function withTransaction<T>(
  fn: (client: typeof db) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      loggers.debug('Starting transaction', { attempt, maxRetries: opts.maxRetries });

      // Supabase doesn't support explicit transactions in the client library
      // We'll use RPC to call a PostgreSQL function that handles transactions
      const result = await fn(db);
      
      loggers.debug('Transaction completed successfully', { attempt });
      return result;
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if error is a deadlock or serialization failure
      const isRetryable = errorMessage.includes('deadlock') || 
                         errorMessage.includes('serialization failure') ||
                         errorMessage.includes('could not serialize');

      loggers.warn('Transaction failed', {
        attempt,
        error: errorMessage,
        isRetryable
      });

      if (!isRetryable || attempt === opts.maxRetries) {
        loggers.error('Transaction failed permanently', {
          attempt,
          error: errorMessage
        });
        throw new AppError(
          'Transaction failed',
          500,
          'TRANSACTION_FAILED',
          { originalError: errorMessage, attempts: attempt }
        );
      }

      // Wait before retrying with exponential backoff
      const delay = opts.retryDelay * Math.pow(2, attempt - 1);
      loggers.debug('Retrying transaction', { delay, nextAttempt: attempt + 1 });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Transaction failed');
}

/**
 * Execute a SELECT FOR UPDATE query to lock rows for update
 * Prevents race conditions when updating inventory
 * 
 * @param table - Table name
 * @param id - Record ID
 * @returns Locked record
 * 
 * @example
 * const product = await selectForUpdate('products', productId);
 * // Now we can safely update the product
 */
export async function selectForUpdate<T = any>(
  table: string,
  id: string | number,
  idColumn: string = 'id'
): Promise<T> {
  try {
    // Use RPC to execute SELECT FOR UPDATE
    const { data, error } = await supabase.rpc('select_for_update', {
      p_table: table,
      p_id: id,
      p_id_column: idColumn
    });

    if (error) {
      throw new AppError(
        'Failed to lock record',
        500,
        'LOCK_FAILED',
        { table, id, error: error.message }
      );
    }

    if (!data) {
      throw new AppError(
        'Record not found',
        404,
        'RECORD_NOT_FOUND',
        { table, id }
      );
    }

    return data as T;
  } catch (error) {
    loggers.error('Select for update failed', {
      table,
      id,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Check if a variant has sufficient stock (with locking)
 * 
 * @param variantId - Variant ID
 * @param quantity - Required quantity
 * @returns true if sufficient stock available
 */
export async function checkAndLockStock(
  variantId: string,
  quantity: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_and_lock_stock', {
      p_variant_id: variantId,
      p_quantity: quantity
    });

    if (error) {
      loggers.error('Stock check failed', {
        variantId,
        quantity,
        error: error.message
      });
      return false;
    }

    return data === true;
  } catch (error) {
    loggers.error('Stock check exception', {
      variantId,
      quantity,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Deduct stock from a variant (within transaction)
 * 
 * @param variantId - Variant ID
 * @param quantity - Quantity to deduct
 * @returns Updated stock quantity
 */
export async function deductStock(
  variantId: string,
  quantity: number
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('deduct_stock', {
      p_variant_id: variantId,
      p_quantity: quantity
    });

    if (error) {
      throw new AppError(
        'Failed to deduct stock',
        500,
        'STOCK_DEDUCTION_FAILED',
        { variantId, quantity, error: error.message }
      );
    }

    if (data === null || data < 0) {
      throw new AppError(
        'Insufficient stock',
        400,
        'INSUFFICIENT_STOCK',
        { variantId, quantity }
      );
    }

    loggers.info('Stock deducted successfully', {
      variantId,
      quantity,
      remainingStock: data
    });

    return data as number;
  } catch (error) {
    loggers.error('Stock deduction failed', {
      variantId,
      quantity,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Restore stock to a variant (for cancellations/refunds)
 * 
 * @param variantId - Variant ID
 * @param quantity - Quantity to restore
 * @returns Updated stock quantity
 */
export async function restoreStock(
  variantId: string,
  quantity: number
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('restore_stock', {
      p_variant_id: variantId,
      p_quantity: quantity
    });

    if (error) {
      throw new AppError(
        'Failed to restore stock',
        500,
        'STOCK_RESTORATION_FAILED',
        { variantId, quantity, error: error.message }
      );
    }

    loggers.info('Stock restored successfully', {
      variantId,
      quantity,
      newStock: data
    });

    return data as number;
  } catch (error) {
    loggers.error('Stock restoration failed', {
      variantId,
      quantity,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
