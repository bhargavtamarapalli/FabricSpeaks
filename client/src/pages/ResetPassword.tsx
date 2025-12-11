import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
    const [, setLocation] = useLocation();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        // Check if we have a valid session (Supabase handles the hash fragment automatically)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, check if we have an error in the URL
                const params = new URLSearchParams(window.location.hash.substring(1));
                const errorDescription = params.get("error_description");
                if (errorDescription) {
                    setError(errorDescription.replace(/\+/g, " "));
                } else {
                    // If no session and no error, redirect to home
                    // But give a small delay to ensure Supabase has processed the hash
                    setTimeout(() => {
                        supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
                            if (!retrySession) {
                                setError("Invalid or expired password reset link.");
                            } else {
                                setSession(retrySession);
                            }
                        });
                    }, 1000);
                }
            } else {
                setSession(session);
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => {
                setLocation("/");
            }, 3000);
        } catch (err: any) {
            console.error("Reset password error:", err);
            setError(err.message || "Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-8 text-center animate-in zoom-in-95 duration-300">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Password Updated</h2>
                    <p className="text-muted-foreground mb-6">
                        Your password has been successfully reset. You will be redirected to the home page shortly.
                    </p>
                    <Button onClick={() => setLocation("/")} className="w-full">
                        Return to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-500">
                <div className="p-6 border-b border-border bg-muted/30">
                    <h2 className="text-xl font-display font-medium tracking-wide text-center">
                        Set New Password
                    </h2>
                </div>

                <div className="p-6">
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!session && !error ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                            <p className="text-muted-foreground">Verifying reset link...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base"
                                disabled={isLoading || !session}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
