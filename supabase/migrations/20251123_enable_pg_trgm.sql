-- Migration: Enable pg_trgm extension
-- Date: 2025-11-23
-- Description: Enable pg_trgm for fuzzy search similarity functions

CREATE EXTENSION IF NOT EXISTS pg_trgm;
