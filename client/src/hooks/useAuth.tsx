import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient, type Session } from "@supabase/supabase-js";
import { api, type ApiError } from "@/lib/api";
import { z } from "zod";

import { supabase } from "@/lib/supabase";

type AuthUser = { id: string; username: string; role: string } | null;

type AuthContextValue = {
  user: AuthUser;
  session: Session | null;
  isLoading: boolean;
  error: ApiError | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (identifier: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: (providedSession?: Session | null) => Promise<void>;
  resetPassword: (identifier: string) => Promise<{ message: string; isPhone?: boolean }>;
  confirmResetPassword: (identifier: string, otp: string, newPassword: string) => Promise<{ message: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

console.log('[AUTH] ========== useAuth.tsx MODULE LOADED ==========');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('[AUTH] AuthProvider component rendering');

  const [user, setUser] = useState<AuthUser>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  console.log('[AUTH] Current state:', { user, session: !!session, isLoading, error });

  // Refresh user profile from backend using current session
  const refreshMe = async (providedSession?: Session | null) => {
    console.log('[AUTH] ===== refreshMe() CALLED =====');

    // Set a maximum timeout for the entire refreshMe operation
    const timeoutId = setTimeout(() => {
      console.error('[AUTH] ⚠️ refreshMe() timed out after 8 seconds');
      setIsLoading(false);
    }, 8000);

    try {
      setError(null);

      let session = providedSession;
      let sessionError = null;

      if (session === undefined) {
        console.log('[AUTH] No session provided, getting from Supabase...');
        const result = await supabase.auth.getSession();
        session = result.data.session;
        sessionError = result.error;
      } else {
        console.log('[AUTH] Using provided session');
      }

      if (sessionError) {
        console.error('[AUTH] Session error:', sessionError);
        throw sessionError;
      }

      if (session) {
        console.log('[AUTH] Session exists:', {
          user_id: session.user?.id,
          email: session.user?.email,
          expires_at: session.expires_at
        });

        // Persist token to localStorage in BOTH formats
        if (session.access_token) {
          // 1. Simple format for api.ts
          localStorage.setItem('auth_token', session.access_token);

          // 2. Structured format for admin API token manager
          const tokenData = {
            accessToken: session.access_token,
            refreshToken: session.refresh_token || session.access_token, // Fallback if no refresh token
            expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + (3600 * 1000), // Convert to ms
            issuedAt: Date.now()
          };
          localStorage.setItem('auth_token_data', JSON.stringify(tokenData));
          console.log('[AUTH] Token stored in both formats');
        }

        console.log('[AUTH] Fetching user profile from /api/auth/me...');
        setSession(session);

        // Get user profile from our API with 5 second timeout
        try {
          const me = await api.get<AuthUser>("/api/auth/me", {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }, 5000); // 5 second timeout

          console.log('[AUTH] ✅ User profile fetched successfully:', me);
          setUser(me);
        } catch (apiErr: any) {
          // Ignore AbortError - it just means the request was cancelled (e.g. component unmount or new request)
          if (apiErr.name === 'AbortError' || apiErr.message?.includes('aborted')) {
            console.log('[AUTH] ⚠️ Profile fetch aborted - ignoring');
            return;
          }

          console.error('[AUTH] ❌ Failed to fetch user profile:', apiErr);
          console.error('[AUTH] Error details:', {
            status: apiErr?.status,
            code: apiErr?.code,
            message: apiErr?.message
          });

          // If unauthorized, clear session to prevent loops
          if (apiErr?.status === 401 || apiErr?.code === 'UNAUTHORIZED' || apiErr?.message?.includes('Unauthorized')) {
            console.log('[AUTH] 🔄 401 UNAUTHORIZED - Signing out to clear invalid session');
            await supabase.auth.signOut();
            setSession(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_token_data');
          }
          // Don't clear user/error for other errors (like network issues) to avoid flashing
          if (!user) {
            setError(apiErr);
          }
        }
      } else {
        console.log('[AUTH] No session found in refreshMe');

        // Fallback: Check localStorage for token (resilience against Supabase client issues)
        const localToken = localStorage.getItem('auth_token');
        if (localToken) {
          console.log('[AUTH] Found local token, attempting user recovery...');
          try {
            // api.ts will use the local token if session is missing
            const me = await api.get<AuthUser>("/api/auth/me", {}, 5000);
            console.log('[AUTH] ✅ User profile recovered via local token:', me);
            setUser(me);
            // Note: session remains null, but user is authenticated via token
          } catch (localErr) {
            console.warn('[AUTH] Local token invalid or expired:', localErr);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(null);
          setUser(null);
        }
      }
    } catch (e: any) {
      console.error('[AUTH] ❌ refreshMe error:', e);
      setUser(null);
      setSession(null);
      setError(e);
    } finally {
      clearTimeout(timeoutId);
      console.log('[AUTH] refreshMe complete, setting isLoading = false');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[AUTH] ========== useEffect STARTED ==========');
    console.log('[AUTH] Component mounted, initializing auth');

    // Get initial session
    console.log('[AUTH] Calling supabase.auth.getSession()...');
    supabase.auth.getSession()
      .then(({ data: { session } }: any) => {
        console.log('[AUTH] ✅ getSession() resolved');
        console.log('[AUTH] Session data:', session ? {
          user_id: session.user?.id,
          email: session.user?.email,
          expires_at: session.expires_at
        } : 'NULL - No session');

        setSession(session);

        if (session) {
          console.log('[AUTH] Session exists, calling refreshMe()');
          refreshMe(session).catch((err) => {
            console.error('[AUTH] ❌ refreshMe() threw error:', err);
          });
        } else {
          console.log('[AUTH] No session found, setting isLoading = false');
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('[AUTH] ❌ getSession() FAILED:', error);
        console.error('[AUTH] Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        setIsLoading(false);
      });

    // Listen for auth changes
    console.log('[AUTH] Setting up onAuthStateChange listener...');
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('[AUTH] ========== AUTH STATE CHANGED ==========');
      console.log('[AUTH] Event:', event);
      console.log('[AUTH] Session:', session ? 'EXISTS' : 'NULL');

      if (session) {
        console.log('[AUTH] Session exists after state change, calling refreshMe()');
        await refreshMe(session).catch((err) => {
          console.error('[AUTH] ❌ refreshMe() in state change threw error:', err);
        });
      } else {
        console.log('[AUTH] No session after state change, clearing user');
        setUser(null);
        setIsLoading(false);
      }
    });

    console.log('[AUTH] Subscription created');
    console.log('[AUTH] ========== useEffect COMPLETE ==========');

    // Failsafe timeout: Force loading to finish after 5 seconds
    const timeoutId = setTimeout(() => {
      console.warn('[AUTH] ⚠️ Auth initialization timed out - forcing app load');
      setIsLoading(false);
    }, 5000);

    return () => {
      console.log('[AUTH] Cleaning up subscription');
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Login with Supabase Auth and fetch user profile
  const login = async (identifier: string, password: string) => {
    console.log(`[AUTH] Login initiated for: ${identifier}`);
    setError(null);
    // Input validation
    const loginSchema = z.object({
      identifier: z.string().min(3).max(64),
      password: z.string().min(6).max(128)
    });
    try {
      loginSchema.parse({ identifier, password });

      // Determine if identifier is email or username/mobile
      const isEmail = identifier.includes('@');
      const email = isEmail ? identifier : `${identifier}@fabric-speaks.local`;

      // Sign in with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Persist token immediately in BOTH formats
      if (data.session?.access_token) {
        // 1. Simple format for api.ts
        localStorage.setItem('auth_token', data.session.access_token);

        // 2. Structured format for admin API token manager
        const tokenData = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token || data.session.access_token,
          expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + (3600 * 1000),
          issuedAt: Date.now()
        };
        localStorage.setItem('auth_token_data', JSON.stringify(tokenData));
      }

      // Get user profile from our API
      try {
        const me = await api.get<AuthUser>("/api/auth/me", {
          headers: { Authorization: `Bearer ${data.session?.access_token}` }
        });
        console.log('[AUTH] Login successful, user profile loaded:', me?.username);
        setUser(me);

        // Merge guest cart after successful login
        try {
          const sessionId = localStorage.getItem('fabricspeaks_session_id');
          if (sessionId) {
            await api.post("/api/cart/merge", { sessionId }, {
              headers: { Authorization: `Bearer ${data.session?.access_token}` }
            });
            localStorage.removeItem('fabricspeaks_guest_cart');
          }
        } catch (mergeError) {
          console.error('Failed to merge guest cart:', mergeError);
        }
      } catch (apiErr: any) {
        setUser(null);
        setError(apiErr);
        throw apiErr;
      }
    } catch (e: any) {
      console.error('[AUTH] Login failed:', e);
      setError(e);
      throw e;
    }
  };

  // Register user via backend API, then login
  const register = async (identifier: string, password: string, name: string) => {
    setError(null);
    const registerSchema = z.object({
      identifier: z.string().min(3).max(64),
      password: z.string().min(6).max(128),
      name: z.string().optional()
    });
    try {
      registerSchema.parse({ identifier, password, name });
      console.log('[AUTH] Registering user:', identifier);
      const res = await api.post<any>("/api/auth/register", { username: identifier, password, full_name: name });
      console.log('[AUTH] Registration response:', res);

      if (res.requires_verification) {
        console.log('[AUTH] Email verification required');
        throw new Error("Email not confirmed");
      }

      console.log('[AUTH] Attempting auto-login after registration');
      await login(identifier, password);
    } catch (e: any) {
      console.error('[AUTH] Registration error:', e);
      setError(e);
      throw e;
    }
  };

  // Logout and clear all sensitive state
  const logout = async () => {
    console.log('[AUTH] Logout initiated');
    setError(null);
    try {
      await supabase.auth.signOut();
      console.log('[AUTH] Supabase signOut successful');
    } catch (e: any) {
      console.error('[AUTH] Logout error:', e);
      setError(e);
    } finally {
      setUser(null);
      setSession(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('fabricspeaks_session_id');
    }
  };

  // Reset password request
  const resetPassword = async (identifier: string) => {
    setError(null);
    try {
      const res = await api.post<{ message: string; isPhone?: boolean }>("/api/auth/reset-password", { email: identifier });
      return res;
    } catch (e: any) {
      setError(e);
      throw e;
    }
  };

  // Confirm reset password with OTP
  const confirmResetPassword = async (identifier: string, otp: string, newPassword: string) => {
    setError(null);
    try {
      // Validate strength client-side too
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        throw new Error("Password must be at least 8 characters and include uppercase, lowercase, number, and special character");
      }

      const res = await api.post<{ message: string }>("/api/auth/reset-password/confirm", {
        identifier,
        otp,
        newPassword
      });
      return res;
    } catch (e: any) {
      setError(e);
      throw e;
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, isLoading, error, login, register, logout, refreshMe, resetPassword, confirmResetPassword }),
    [user, session, isLoading, error]
  );

  console.log('[AUTH] AuthProvider rendering children with isLoading:', isLoading);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
