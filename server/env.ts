/**
 * Environment Configuration Loader
 * 
 * This module MUST be imported first in server/index.ts to ensure
 * environment variables are loaded before any other modules that depend on them.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local at project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Export for verification if needed
export const envLoaded = true;
