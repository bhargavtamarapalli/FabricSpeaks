import { beforeAll, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import * as schema from '../../shared/schema';

// Initialize SQLite database for tests
export const sqlite = new Database(':memory:');
export const testDb = drizzle(sqlite, { schema });

// Initialize Supabase client with test configuration
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'test-key';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user IDs
export const TEST_ADMIN_ID = 'admin-user-123';
export const TEST_USER_ID = 'user-user-456';
export const TEST_ADMIN_EMAIL = 'admin@test.com';
export const TEST_USER_EMAIL = 'user@test.com';

// Create test tables
export const setupTestDb = async () => {
  try {
    // Drop tables if they exist to ensure clean state
    const dropTablesSql = `
      DROP TABLE IF EXISTS order_items;
      DROP TABLE IF EXISTS orders;
      DROP TABLE IF EXISTS cart_items;
      DROP TABLE IF EXISTS carts;
      DROP TABLE IF EXISTS inventory_logs;
      DROP TABLE IF EXISTS product_variants;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS profiles;
    `;
    sqlite.exec(dropTablesSql);
    
    // Create tables based on schema
    const createTablesSql = `
    CREATE TABLE profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      description TEXT,
      category_id TEXT REFERENCES categories(id) ON DELETE RESTRICT,
      brand TEXT,
      size TEXT,
      colour TEXT,
      fabric_quality TEXT,
      premium_segment INTEGER DEFAULT 0,
      wash_care TEXT,
      imported_from TEXT,
      cost_price DECIMAL(10, 2),
      price DECIMAL(10, 2) NOT NULL,
      sale_price DECIMAL(10, 2),
      is_on_sale INTEGER DEFAULT 0,
      stock_quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      images TEXT DEFAULT '[]',
      status TEXT DEFAULT 'active',
      is_signature INTEGER DEFAULT 0,
      signature_details TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      size TEXT,
      colour TEXT,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      sku TEXT UNIQUE,
      price_adjustment DECIMAL(10, 2) DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE inventory_logs (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      adjustment_amount INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      previous_quantity INTEGER,
      new_quantity INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE carts (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cart_id) REFERENCES carts(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );

    CREATE TABLE order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(10, 2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    `;
    sqlite.exec(createTablesSql);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

beforeAll(async () => {
  await setupTestDb();
});

// Helper to seed test data
export function seedTestData() {
  const adminId = randomUUID();
  const userId = randomUUID();
  
  // Insert admin user
  sqlite.prepare(
    `INSERT INTO profiles (id, user_id, username, role) VALUES (?, ?, ?, ?)`
  ).run(adminId, TEST_ADMIN_ID, 'admin_test', 'admin');

  // Insert regular user
  sqlite.prepare(
    `INSERT INTO profiles (id, user_id, username, role) VALUES (?, ?, ?, ?)`
  ).run(userId, TEST_USER_ID, 'user_test', 'user');
}

// Helper to clear test data
export function clearTestData() {
  sqlite.exec("DELETE FROM order_items;");
  sqlite.exec("DELETE FROM orders;");
  sqlite.exec("DELETE FROM cart_items;");
  sqlite.exec("DELETE FROM carts;");
  sqlite.exec("DELETE FROM inventory_logs;");
  sqlite.exec("DELETE FROM product_variants;");
  sqlite.exec("DELETE FROM products;");
  sqlite.exec("DELETE FROM categories;");
  sqlite.exec("DELETE FROM profiles;");
}

// Clean up after each test
afterEach(() => {
  clearTestData();
});