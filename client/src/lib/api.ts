
import { supabase } from "./supabase";
import { toUserFriendlyError } from "./errors";
import { getSessionId } from "./guestCart";

export type ApiError = { code?: string; message: string };

const BASE = ""; // same origin


// Handle fetch responses with robust error handling
async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let err: ApiError = { message: "Request failed" };
    try {
      // Only expose safe error info
      const data = await res.json();
      err = { code: data.code, message: data.message || err.message };
    } catch { }
    throw toUserFriendlyError(err);
  }
  // Try to parse JSON, allow empty
  try {
    return (await res.json()) as T;
  } catch {
    return undefined as unknown as T;
  }
}

// In-memory token cache to avoid repeated localStorage/Supabase calls
let cachedToken: { token: string; expiresAt: number } | null = null;

// Get auth headers from cache, localStorage, or Supabase session
// For guests, includes x-session-id header instead of auth token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  // 1. Check in-memory cache first (fastest)
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return { Authorization: `Bearer ${cachedToken.token}` };
  }

  // 2. Check localStorage (fast, persists across refreshes)
  const localToken = localStorage.getItem('auth_token');
  const tokenData = localStorage.getItem('auth_token_data');
  if (localToken && tokenData) {
    try {
      const parsed = JSON.parse(tokenData);
      if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
        // Cache in memory for future calls
        cachedToken = { token: localToken, expiresAt: parsed.expiresAt };
        return { Authorization: `Bearer ${localToken}` };
      }
    } catch { }
  }

  // 3. Fallback to Supabase session (slowest)
  let session = null;
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('getSession timeout')), 1000)
    );

    const result = await Promise.race([
      supabase.auth.getSession(),
      timeoutPromise
    ]) as any;

    session = result.data?.session;
    if (session?.access_token) {
      // Cache the token
      const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + (3600 * 1000);
      cachedToken = { token: session.access_token, expiresAt };
    }
  } catch (e) {
    // Ignore timeout/error
  }

  const token = session?.access_token;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  // 4. No auth token - include session ID for guest users
  const sessionId = getSessionId();
  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }

  return headers;
}

// Clear token cache (call on logout)
export function clearTokenCache() {
  cachedToken = null;
}

// Get CSRF token for state-changing requests
async function getCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'same-origin',
    });
    if (response.ok) {
      const data = await response.json();
      return data.csrfToken;
    }
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error);
  }
  return null;
}

// Default request timeout (ms)
const DEFAULT_TIMEOUT = 10000;

// Helper to add timeout/abort to fetch
async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// API client with robust error handling, timeouts, and best practices
export const api = {
  /**
   * GET request with auth and timeout
   */
  get: async <T>(path: string, options?: RequestInit, timeout?: number) => {
    const headers = await getAuthHeaders();
    return fetchWithTimeout(`${BASE}${path}`, {
      ...options,
      headers: { ...headers, ...options?.headers },
      credentials: 'same-origin',
    }, timeout).then(handle<T>);
  },
  /**
   * POST request with auth, CSRF token, Content-Type, and timeout
   */
  post: async <T>(path: string, body?: any, options?: RequestInit, timeout?: number) => {
    const [authHeaders, csrfToken] = await Promise.all([getAuthHeaders(), getCsrfToken()]);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options?.headers as Record<string, string>),
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    return fetchWithTimeout(`${BASE}${path}`, {
      ...options,
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    }, timeout).then(handle<T>);
  },
  /**
   * PUT request with auth, CSRF token, Content-Type, and timeout
   */
  put: async <T>(path: string, body?: any, options?: RequestInit, timeout?: number) => {
    const [authHeaders, csrfToken] = await Promise.all([getAuthHeaders(), getCsrfToken()]);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options?.headers as Record<string, string>),
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    return fetchWithTimeout(`${BASE}${path}`, {
      ...options,
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    }, timeout).then(handle<T>);
  },
  /**
   * DELETE request with auth, CSRF token, and timeout
   */
  delete: async <T>(path: string, options?: RequestInit, timeout?: number) => {
    const [authHeaders, csrfToken] = await Promise.all([getAuthHeaders(), getCsrfToken()]);
    const headers: Record<string, string> = {
      ...authHeaders,
      ...(options?.headers as Record<string, string>),
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    return fetchWithTimeout(`${BASE}${path}`, {
      ...options,
      method: "DELETE",
      headers,
      credentials: 'same-origin',
    }, timeout).then(handle<T>);
  },
  /**
   * UPLOAD request (multipart/form-data)
   * Does NOT set Content-Type header so browser can set boundary
   */
  upload: async <T>(path: string, body: FormData, options?: RequestInit, timeout?: number) => {
    const [authHeaders, csrfToken] = await Promise.all([getAuthHeaders(), getCsrfToken()]);
    const headers: Record<string, string> = {
      ...authHeaders,
      ...(options?.headers as Record<string, string>),
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    return fetchWithTimeout(`${BASE}${path}`, {
      ...options,
      method: "POST",
      headers,
      body, // Pass FormData directly
      credentials: 'same-origin',
    }, timeout).then(handle<T>);
  },
};
