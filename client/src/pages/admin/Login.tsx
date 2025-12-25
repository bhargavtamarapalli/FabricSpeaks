import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { login, user } = useAuth();
    const { isAdmin, isLoading: adminLoading } = useAdminAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Redirect if already admin
    useEffect(() => {
        if (user && isAdmin) {
            setLocation("/admin");
        }
    }, [user, isAdmin, setLocation]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({
                title: "Error",
                description: "Please enter both email and password",
                variant: "destructive"
            });
            return;
        }

        setIsLoggingIn(true);
        try {
            await login(email, password);
            toast({
                title: "Authentication Successful",
                description: "Verifying admin privileges..."
            });
        } catch (error: any) {
            toast({
                title: "Login Failed",
                description: error.message || "Invalid credentials",
                variant: "destructive"
            });
            setIsLoggingIn(false);
        }
    };

    if (adminLoading) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-stone-900 dark:text-white" />
                    <p className="text-sm font-medium text-stone-500 animate-pulse">Initializing Security...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf9f6] dark:bg-neutral-950 flex flex-col md:flex-row overflow-hidden">
            {/* Left Side: Branding & Visuals (Visible on Desktop) */}
            <div className="hidden md:flex md:w-1/2 bg-stone-900 dark:bg-neutral-900 items-center justify-center p-12 relative overflow-hidden">
                {/* Abstract Background Element */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-stone-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-stone-800 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 flex flex-col items-center"
                >
                    <div className="text-center">
                        <h1 className="font-display text-5xl lg:text-6xl text-white mb-6 tracking-tight">Fabric Speaks</h1>
                        <p className="text-stone-400 font-light text-lg lg:text-xl max-w-sm mx-auto leading-relaxed">
                            Boutique Management & Analytics Control Center.
                        </p>
                    </div>
                </motion.div>

                <div className="absolute bottom-10 left-10 flex flex-col gap-1">
                    <span className="text-stone-500 text-[10px] font-mono tracking-widest uppercase">Admin Terminal</span>
                    <span className="text-stone-600 text-[9px] font-mono uppercase">v2.5.4 // SECURE_SOCKET_AUTH_ENABLED</span>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-white dark:bg-neutral-950">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md relative"
                >
                    {/* Mobile Header */}
                    <div className="md:hidden flex flex-col items-center mb-10">
                        <h2 className="font-display text-4xl text-stone-900 dark:text-white">Fabric Speaks</h2>
                        <span className="text-[10px] uppercase tracking-widest text-stone-400 mt-2 font-bold">Admin Portal</span>
                    </div>

                    <div className="mb-10 text-center md:text-left">
                        <h3 className="font-display text-4xl md:text-5xl text-stone-900 dark:text-white mb-3">Welcome</h3>
                        <p className="text-stone-500 dark:text-stone-400 font-light text-base">
                            Authenticated access for administrators only.
                        </p>
                    </div>

                    <Card className="border-stone-100 dark:border-neutral-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:shadow-none bg-white/80 dark:bg-neutral-900/50 backdrop-blur-xl overflow-hidden rounded-2xl">
                        <div className="h-1 w-full bg-gradient-to-r from-stone-900 via-stone-200 to-stone-900 dark:from-white dark:via-neutral-700 dark:to-white opacity-50" />

                        <CardHeader className="pt-10 pb-4">
                            <CardTitle className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Secured Gateway
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6 pb-8">
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-stone-600 dark:text-stone-300 font-medium text-xs uppercase tracking-wider">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@fabricspeaks.com"
                                        className="h-14 bg-stone-50/50 dark:bg-neutral-800/50 border-stone-100 dark:border-neutral-700/50 focus:ring-stone-900 focus:border-stone-900 dark:focus:ring-white dark:focus:border-white transition-all text-base"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoggingIn}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="password" className="text-stone-600 dark:text-stone-300 font-medium text-xs uppercase tracking-wider">Password</Label>
                                        <button type="button" className="text-[10px] uppercase font-bold tracking-tighter text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">Retrieve</button>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        className="h-14 bg-stone-50/50 dark:bg-neutral-800/50 border-stone-100 dark:border-neutral-700/50 focus:ring-stone-900 focus:border-stone-900 dark:focus:ring-white dark:focus:border-white transition-all text-base"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoggingIn}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-14 bg-stone-900 text-white hover:bg-black transition-all group dark:bg-white dark:text-black dark:hover:bg-stone-200 rounded-xl font-medium tracking-wide text-base shadow-lg shadow-stone-200 dark:shadow-none"
                                    disabled={isLoggingIn}
                                >
                                    {isLoggingIn ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Authorizing Access
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center w-full">
                                            <span>Enter Dashboard</span>
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex items-center justify-between py-6 px-10 border-t border-stone-100 dark:border-neutral-800 bg-stone-50/30 dark:bg-neutral-900/30">
                            <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                                <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                                256-Bit SSL
                            </div>
                            <div className="text-[9px] text-stone-300 font-mono tracking-tighter">
                                SESSION_{Math.random().toString(36).substring(7).toUpperCase()}
                            </div>
                        </CardFooter>
                    </Card>

                    <div className="mt-12 flex flex-col items-center md:items-start gap-4">
                        <p className="text-[10px] text-stone-400 text-center md:text-left leading-relaxed">
                            &copy; {new Date().getFullYear()} Fabric Speaks Boutique. <br className="md:hidden" />
                            Proprietary Administrative Interface. <br className="hidden md:block" />
                            Unauthorized access attempts are electronically logged.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

