/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Wraps components to catch and handle errors gracefully
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to Sentry
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Update state with error info
        this.setState({
            errorInfo,
        });

        // Log to console in development
        if (import.meta.env.MODE === 'development') {
            console.error('Error Boundary caught error:', error);
            console.error('Component stack:', errorInfo.componentStack);
        }
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                    <Card className="max-w-lg w-full">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-6 w-6" />
                                <CardTitle>Something went wrong</CardTitle>
                            </div>
                            <CardDescription>
                                We're sorry, but something unexpected happened. Our team has been notified.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {import.meta.env.MODE === 'development' && this.state.error && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm font-semibold text-red-800 mb-2">
                                        Error Details (Development Only):
                                    </p>
                                    <p className="text-sm text-red-700 font-mono break-all">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <details className="mt-2">
                                            <summary className="text-sm text-red-700 cursor-pointer">
                                                Component Stack
                                            </summary>
                                            <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex gap-2">
                            <Button
                                onClick={this.handleReset}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </Button>
                            <Button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
): React.FC<P> {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

/**
 * Sentry-integrated Error Boundary
 * Uses Sentry's built-in error boundary with custom fallback
 */
export const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
    fallback: ({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="max-w-lg w-full">
                <CardHeader>
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-6 w-6" />
                        <CardTitle>Application Error</CardTitle>
                    </div>
                    <CardDescription>
                        An unexpected error occurred. Please try refreshing the page.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {import.meta.env.MODE === 'development' && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700 font-mono break-all">
                                {error?.toString()}
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex gap-2">
                    <Button
                        onClick={resetError}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                    <Button
                        onClick={() => window.location.href = '/'}
                        className="flex items-center gap-2"
                    >
                        <Home className="h-4 w-4" />
                        Go Home
                    </Button>
                </CardFooter>
            </Card>
        </div>
    ),
    showDialog: false,
});

export default ErrorBoundary;
