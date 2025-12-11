import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import Loading from '@/components/Loading';
import { motion } from 'framer-motion';

export default function AuthCallback() {
    const [errorState, setErrorState] = useState<string | null>(null);
    const [status, setStatus] = useState('Initializing authentication...');
    const [, setLocation] = useLocation();
    const { refreshMe } = useAuth();

    useEffect(() => {
        let mounted = true;
        const timeoutId = setTimeout(() => {
            if (mounted) {
                setErrorState('Authentication timed out. Please try again.');
            }
        }, 15000); // 15 seconds timeout

        const handleCallback = async () => {
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const hashParams = new URLSearchParams(window.location.hash.substring(1));

                console.log('[AuthCallback] URL Search Params:', Object.fromEntries(searchParams.entries()));
                console.log('[AuthCallback] URL Hash Params:', Object.fromEntries(hashParams.entries()));

                let token = searchParams.get('token') || hashParams.get('access_token');
                let refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');
                const code = searchParams.get('code');
                const provider = searchParams.get('provider') || 'oauth';
                const error = searchParams.get('error') || hashParams.get('error');
                const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

                if (error) {
                    console.error('OAuth error:', error, errorDescription);
                    setErrorState(errorDescription || error);
                    return;
                }

                // Handle PKCE code flow
                if (code && !token) {
                    setStatus('Exchanging code for session...');
                    console.log('[AuthCallback] Code found, exchanging for session...');
                    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) throw exchangeError;
                    if (data.session) {
                        token = data.session.access_token;
                        refreshToken = data.session.refresh_token;
                        console.log('[AuthCallback] Session exchanged successfully');
                    }
                }

                if (!token) {
                    setStatus('Checking existing session...');
                    console.log('[AuthCallback] No token/code in URL, checking Supabase session...');
                    const { data: { session } } = await supabase.auth.getSession();

                    if (session) {
                        console.log('[AuthCallback] Found existing Supabase session');
                        token = session.access_token;
                        refreshToken = session.refresh_token;
                    } else {
                        const msg = 'No token or code found in callback URL and no active session';
                        console.error('[AuthCallback]', msg);
                        setErrorState(msg);
                        return;
                    }
                }

                // Manually set session if we have tokens (since detectSessionInUrl is false)
                if (token) {
                    setStatus('Setting session...');
                    console.log('[AuthCallback] Setting Supabase session manually...');
                    console.log('[AuthCallback] Token length:', token.length);
                    console.log('[AuthCallback] Refresh token present:', !!refreshToken);

                    // Ensure clean state - skipped to prevent hanging
                    // await supabase.auth.signOut();

                    try {
                        // Race setSession against a 5s timeout to prevent hanging
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Session setup timed out')), 5000)
                        );

                        const { error: sessionError } = await Promise.race([
                            supabase.auth.setSession({
                                access_token: token,
                                refresh_token: refreshToken || ''
                            }),
                            timeoutPromise
                        ]) as any;

                        if (sessionError) {
                            console.error('[AuthCallback] Failed to set session:', sessionError);
                        } else {
                            console.log('[AuthCallback] Session set successfully');
                        }
                    } catch (err) {
                        console.warn('[AuthCallback] Session setup warning (continuing):', err);
                        // We continue even if setSession times out/fails, as the backend verify step 
                        // is the ultimate source of truth and we have the token.
                    }
                }

                // Verify the token with backend (and create profile if needed)
                setStatus('Verifying profile...');
                console.log('[AuthCallback] Verifying token and checking profile...');
                console.log('[AuthCallback] About to call /api/auth/oauth/verify');

                let data;
                try {
                    // Use api.post to handle CSRF token automatically
                    data = await api.post('/api/auth/oauth/verify', { token });
                    console.log('[AuthCallback] ✅ Verification successful:', data);
                } catch (verifyError: any) {
                    console.error('[AuthCallback] ❌ Verification failed:', verifyError);
                    throw new Error(`Token verification failed: ${verifyError.message || 'Unknown error'}`);
                }

                // Store the token and user data
                setStatus('Finalizing login...');
                localStorage.setItem('auth_token', token!);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Update auth context
                await refreshMe();

                // Show success message
                console.log(`Successfully signed in with ${provider}`);

                // Redirect to home
                setStatus('Redirecting...');
                setLocation('/');
            } catch (error: any) {
                console.error('OAuth callback error:', error);
                setErrorState(error.message || 'Failed to complete sign-in. Please try again.');
            }
        };

        handleCallback();

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [setLocation, refreshMe]);

    if (errorState) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300 p-4">
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-red-600 dark:text-red-400"
                            >
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Authentication Failed</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-8">{errorState}</p>

                        {/* Debug Info */}
                        <div className="mt-4 p-4 bg-gray-100 dark:bg-zinc-800 rounded text-left text-xs font-mono overflow-auto max-h-40">
                            <p className="font-bold mb-1">Debug Info:</p>
                            <p>URL: {window.location.href}</p>
                            <p>Search: {window.location.search}</p>
                            <p>Hash: {window.location.hash}</p>
                            <p>Status: {status}</p>
                        </div>

                        <button
                            onClick={() => setLocation('/')}
                            className="w-full mt-6 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium rounded-lg transition-colors duration-200"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <Loading size="lg" />
                <p className="mt-6 text-stone-500 dark:text-neutral-400 font-light text-lg">{status}</p>
                <p className="mt-2 text-xs text-stone-400">Please wait while we verify your credentials.</p>
            </motion.div>
        </div>
    );
}
