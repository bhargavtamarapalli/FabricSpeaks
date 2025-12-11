-- Phase 5.5: Full-Text Search Implementation
-- Implements PostgreSQL full-text search with ranking and typo tolerance

-- =====================================================
-- ADD SEARCH VECTOR COLUMN
-- =====================================================

-- Add tsvector column for full-text search
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- =====================================================
-- CREATE SEARCH UPDATE FUNCTION
-- =====================================================

-- Function to update search vector
CREATE OR REPLACE FUNCTION products_search_vector_update() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGER FOR AUTOMATIC UPDATES
-- =====================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS products_search_vector_trigger ON products;

-- Create trigger to automatically update search_vector
CREATE TRIGGER products_search_vector_trigger
BEFORE INSERT OR UPDATE OF name, description, brand
ON products
FOR EACH ROW
EXECUTE FUNCTION products_search_vector_update();

-- =====================================================
-- POPULATE EXISTING DATA
-- =====================================================

-- Update search vectors for existing products
UPDATE products 
SET search_vector = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'C')
WHERE search_vector IS NULL OR search_vector = '';

-- =====================================================
-- CREATE GIN INDEX FOR FAST SEARCH
-- =====================================================

-- Create GIN index on search_vector for fast full-text search
CREATE INDEX IF NOT EXISTS idx_products_search_vector 
ON products USING gin(search_vector);

-- =====================================================
-- SEARCH RANKING FUNCTION
-- =====================================================

-- Function to search products with ranking
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  max_results INTEGER DEFAULT 100
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  price TEXT,
  brand TEXT,
  images JSONB,
  category_id TEXT,
  status TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.brand,
    p.images,
    p.category_id,
    p.status,
    ts_rank(p.search_vector, plainto_tsquery('english', search_query)) AS rank
  FROM products p
  WHERE 
    p.search_vector @@ plainto_tsquery('english', search_query)
    AND p.status = 'active'
  ORDER BY rank DESC, p.created_at DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUZZY SEARCH WITH TYPO TOLERANCE
-- =====================================================

-- Install pg_trgm extension for similarity search (typo tolerance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index for fuzzy matching on product names
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON products USING gin(name gin_trgm_ops);

-- Create trigram index on brand for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm 
ON products USING gin(brand gin_trgm_ops);

-- Fuzzy search function with typo tolerance
CREATE OR REPLACE FUNCTION fuzzy_search_products(
  search_query TEXT,
  similarity_threshold REAL DEFAULT 0.3,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  price TEXT,
  brand TEXT,
  images JSONB,
  category_id TEXT,
  status TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.brand,
    p.images,
    p.category_id,
    p.status,
    GREATEST(
      similarity(p.name, search_query),
      similarity(p.brand, search_query)
    ) AS similarity
  FROM products p
  WHERE 
    p.status = 'active'
    AND (
      p.name % search_query
      OR p.brand % search_query
      OR similarity(p.name, search_query) > similarity_threshold
      OR similarity(p.brand, search_query) > similarity_threshold
    )
  ORDER BY similarity DESC, p.created_at DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- COMBINED SEARCH FUNCTION
-- =====================================================

-- Combined search function that uses both full-text and fuzzy search
CREATE OR REPLACE FUNCTION search_products_combined(
  search_query TEXT,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  price TEXT,
  brand TEXT,
  images JSONB,
  category_id TEXT,
  status TEXT,
  score REAL,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- First: Full-text search results
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.brand,
    p.images,
    p.category_id,
    p.status,
    ts_rank(p.search_vector, plainto_tsquery('english', search_query)) * 2.0 AS score,
    'fulltext'::TEXT AS match_type
  FROM products p
  WHERE 
    p.search_vector @@ plainto_tsquery('english', search_query)
    AND p.status = 'active'
  
  UNION ALL
  
  -- Second: Fuzzy search results
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.brand,
    p.images,
    p.category_id,
    p.status,
    GREATEST(
      similarity(p.name, search_query),
      similarity(p.brand, search_query)
    ) AS score,
    'fuzzy'::TEXT AS match_type
  FROM products p
  WHERE 
    p.status = 'active'
    AND (
      p.name % search_query
      OR p.brand % search_query
    )
    AND NOT EXISTS (
      -- Exclude items already found by full-text search
      SELECT 1 
      FROM products p2 
      WHERE p2.id = p.id 
      AND p2.search_vector @@ plainto_tsquery('english', search_query)
    )
  
  ORDER BY score DESC, match_type ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- SEARCH SUGGESTIONS FUNCTION
-- =====================================================

-- Function to get search suggestions based on partial input
CREATE OR REPLACE FUNCTION get_search_suggestions(
  search_prefix TEXT,
  max_suggestions INTEGER DEFAULT 10
)
RETURNS TABLE (
  suggestion TEXT,
  category TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  -- Product name suggestions
  SELECT DISTINCT
    p.name AS suggestion,
    'product'::TEXT AS category,
    COUNT(*)::BIGINT AS count
  FROM products p
  WHERE 
    p.name ILIKE search_prefix || '%'
    AND p.status = 'active'
  GROUP BY p.name
  
  UNION ALL
  
  -- Brand suggestions
  SELECT DISTINCT
    p.brand AS suggestion,
    'brand'::TEXT AS category,
    COUNT(*)::BIGINT AS count
  FROM products p
  WHERE 
    p.brand ILIKE search_prefix || '%'
    AND p.status = 'active'
    AND p.brand IS NOT NULL
  GROUP BY p.brand
  
  ORDER BY count DESC, suggestion ASC
  LIMIT max_suggestions;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- ANALYZE FOR STATISTICS UPDATE
-- =====================================================

ANALYZE products;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN products.search_vector IS 'Full-text search vector with weighted terms';
COMMENT ON FUNCTION search_products IS 'Full-text search with ranking';
COMMENT ON FUNCTION fuzzy_search_products IS 'Fuzzy search with typo tolerance using trigrams';
COMMENT ON FUNCTION search_products_combined IS 'Combined full-text and fuzzy search';
COMMENT ON FUNCTION get_search_suggestions IS 'Auto-complete search suggestions';
