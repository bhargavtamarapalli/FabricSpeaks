import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CheckoutErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Checkout Error Boundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col">
          {/* Header placeholder */}
          <div className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />

          <main className="flex-1 flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <CardTitle>Something went wrong</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  We encountered an error while processing your checkout. Please try again or return to the home page.
                </p>

                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="text-left p-3 bg-muted rounded-lg text-xs">
                    <strong>Error:</strong> {this.state.error.name}
                    <br />
                    <strong>Message:</strong> {this.state.error.message}
                    <br />
                    <strong>Stack:</strong>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
