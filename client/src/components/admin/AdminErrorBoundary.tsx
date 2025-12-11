/**
 * Admin Error Boundary
 * 
 * Dark-themed error boundary specifically for the admin panel.
 * Features:
 * - Matches admin design system (Glassmorphism, Dark Mode)
 * - Provides clear actions (Reload, Go to Dashboard)
 * - Development mode details
 * 
 * @example
 * <AdminErrorBoundary>
 *   <AdminLayout />
 * </AdminErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin Panel Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-center">
          <div className="mb-6 rounded-full bg-red-500/10 p-6 ring-1 ring-red-500/20">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          
          <h1 className="mb-2 text-3xl font-bold text-white">Something went wrong</h1>
          <p className="mb-8 max-w-md text-slate-400">
            The admin panel encountered an unexpected error. Please try refreshing the page.
          </p>
          
          {/* Show error details in development only */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mb-8 w-full max-w-2xl overflow-auto rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-left">
              <p className="mb-2 font-mono text-xs font-bold text-red-400">ERROR DETAILS:</p>
              <code className="font-mono text-xs text-red-300">
                {this.state.error.toString()}
              </code>
            </div>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/admin'}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
