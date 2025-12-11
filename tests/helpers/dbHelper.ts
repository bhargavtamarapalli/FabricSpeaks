import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Setup test database
 * Creates necessary tables and initial data
 */
export async function setupTestDatabase() {
  // Database setup is handled by migrations
  // This function can be used for additional test-specific setup
  console.log('Setting up test database...');
}

/**
 * Cleanup test database
 * Removes all test data
 */
export async function cleanupTestDatabase() {
  try {
    // Delete all test data in reverse order of dependencies
    await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('user_addresses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('wishlists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Delete user profiles
    await supabase.from('user_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Delete auth users (this will cascade delete related data)
    const { data: users } = await supabase.auth.admin.listUsers();
    if (users?.users) {
      for (const user of users.users) {
        await supabase.auth.admin.deleteUser(user.id);
      }
    }
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
}

/**
 * Create a test user
 */
export async function createTestUser(data: {
  email: string;
  password: string;
  role?: string;
  emailVerified?: boolean;
  name?: string;
  phone?: string;
}) {
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: data.emailVerified ?? true,
    user_metadata: {
      role: data.role || 'customer',
      name: data.name,
      phone: data.phone,
    },
  });

  if (error) throw error;

  // Create user profile
  if (user.user) {
    await supabase.from('user_profiles').insert({
      id: user.user.id,
      name: data.name,
      phone: data.phone,
    });
  }

  return user.user;
}

/**
 * Create a test address
 */
export async function createTestAddress(userId: string, data: {
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}) {
  const { data: address, error } = await supabase
    .from('user_addresses')
    .insert({
      user_id: userId,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return address;
}

/**
 * Create test cart items
 */
export async function createTestCartItems(userId: string, items: Array<{
  product_id: string;
  variant_id: string;
  quantity: number;
}>) {
  const { data, error } = await supabase
    .from('cart_items')
    .insert(
      items.map(item => ({
        user_id: userId,
        ...item,
      }))
    )
    .select();

  if (error) throw error;
  return data;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const { data: users } = await supabase.auth.admin.listUsers();
  return users?.users.find(u => u.email === email);
}

/**
 * Delete user by ID
 */
export async function deleteUserById(userId: string) {
  await supabase.auth.admin.deleteUser(userId);
}
