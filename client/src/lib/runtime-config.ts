/**
 * Runtime Config Utility
 * Fetches environment variables from the server when build-time variables are missing.
 */

export interface RuntimeConfig {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    RAZORPAY_KEY_ID?: string;
    FRONTEND_URL?: string;
    SENTRY_DSN?: string;
    NODE_ENV?: string;
}

let cachedConfig: RuntimeConfig | null = null;

/**
 * Fetch config from server
 */
export async function fetchRuntimeConfig(): Promise<RuntimeConfig> {
    if (cachedConfig) return cachedConfig;

    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Failed to fetch config');
        cachedConfig = await response.json();
        return cachedConfig!;
    } catch (error) {
        console.warn('Failed to fetch runtime config, falling back to build-time env:', error);
        return {};
    }
}

/**
 * Get a config value with fallback to import.meta.env
 */
export function getRuntimeEnv(key: keyof RuntimeConfig, viteKey: string): string | undefined {
    // Try cached runtime config first
    if (cachedConfig && cachedConfig[key]) {
        return cachedConfig[key];
    }

    // Fallback to build-time env
    return (import.meta as any).env[viteKey];
}
