import '../server/env';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createWishlistTables() {
  console.log('🔄 Creating wishlist tables...');
  
  try {
    // Create wishlists table
    const { error: wishlistsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS wishlists (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          name TEXT NOT NULL DEFAULT 'My Wishlist',
          is_default BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT wishlists_name_not_empty CHECK (length(trim(name)) > 0),
          CONSTRAINT wishlists_name_max_length CHECK (length(name) <= 100)
        );
      `
    });

    if (wishlistsError && !wishlistsError.message.includes('already exists')) {
      console.error('Error creating wishlists table:', wishlistsError);
    } else {
      console.log('✅ Wishlists table created');
    }

    // Create wishlist_items table
    const { error: itemsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS wishlist_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
          added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          notes TEXT,
          CONSTRAINT wishlist_items_unique_product_variant UNIQUE(wishlist_id, product_id, variant_id),
          CONSTRAINT wishlist_items_notes_max_length CHECK (notes IS NULL OR length(notes) <= 500)
        );
      `
    });

    if (itemsError && !itemsError.message.includes('already exists')) {
      console.error('Error creating wishlist_items table:', itemsError);
    } else {
      console.log('✅ Wishlist items table created');
    }

    // Create indexes
    console.log('Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id)',
      'CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id)',
    ];

    for (const indexSql of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating index:', error);
      }
    }
    console.log('✅ Indexes created');

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

createWishlistTables();
