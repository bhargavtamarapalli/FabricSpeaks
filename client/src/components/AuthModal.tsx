import { useState, useEffect } from "react";
import { X, Loader2, User, Phone, Mail, KeyRound, ArrowLeft, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Previously passed props are now redundant if we use useAuth directly, but keeping for compatibility
  onLogin?: (identifier: string, password: string) => Promise<void>;
  onRegister?: (identifier: string, password: string, name: string) => Promise<void>;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, resetPassword, confirmResetPassword } = useAuth();
  const { toast } = useToast();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<"REQUEST" | "VERIFY">("REQUEST");

  const [identifier, setIdentifier] = useState(""); // Email or Mobile
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // For UI check only
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // OTP Resend Logic
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isResetMode) {
        if (resetStep === "REQUEST") {
          // Send Reset Link / OTP
          const res = await resetPassword(identifier);
          if (res.isPhone) {
            setResetStep("VERIFY");
            setSuccessMessage(res.message);
            setResendCountdown(30); // Start countdown
          } else {
            setSuccessMessage(res.message);
            // Stay on verify screen? Or just show message
            // For email, we just show message.
          }
        } else {
          // Verify OTP and New Password
          if (newPassword !== confirmPassword) {
            throw new Error("Passwords do not match");
          }
          const res = await confirmResetPassword(identifier, otp, newPassword);
          setSuccessMessage(res.message);
          // Auto switch to login after success?
          setTimeout(() => {
            resetForm();
            setIsLoginMode(true);
          }, 2000);
        }
      } else if (isLoginMode) {
        await login(identifier, password);
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        onClose(); // Close on success
      } else {
        // Registration flow
        await register(identifier, password, name);
        toast({
          title: "Account Created",
          description: "Welcome to Fabric Speaks! Your account has been created.",
        });
        onClose(); // Close on success (auto-logged in)
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message?.includes("Email not confirmed")) {
        setSuccessMessage("Registration successful! Please check your email to verify your account before logging in.");
        toast({
          title: "Verification Required",
          description: "Please check your email to verify your account.",
        });
        setIsLoginMode(true);
      } else {
        const errorMsg = err.message || "Authentication failed. Please try again.";
        setError(errorMsg);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: errorMsg,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const res = await resetPassword(identifier);
      setSuccessMessage("OTP resent successfully!");
      setResendCountdown(30);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsLoginMode(true);
    setIsResetMode(false);
    setResetStep("REQUEST");
    setError(null);
    setSuccessMessage(null);
    setIdentifier("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setOtp("");
    setName("");
    setResendCountdown(0);
  };

  const toggleMode = () => {
    resetForm();
    setIsLoginMode(!isLoginMode);
  };

  const toggleResetMode = () => {
    setIsResetMode(!isResetMode);
    setResetStep("REQUEST");
    setError(null);
    setSuccessMessage(null);
  };

  const changePhone = () => {
    setResetStep("REQUEST");
    setOtp("");
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
        data-testid="overlay-auth"
      />

      <div
        data-testid="modal-auth"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background z-50 shadow-2xl rounded-xl animate-in zoom-in-95 fade-in duration-300 border border-border overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <h2 data-testid="text-auth-title" className="text-xl font-display font-medium tracking-wide">
            {isResetMode ? "Reset Password" : (isLoginMode ? "Welcome Back" : "Join the Inner Circle")}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-auth"
            className="hover:bg-background rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-6 animate-in slide-in-from-top-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 animate-in slide-in-from-top-2">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* --- Registration Fields --- */}
            {!isLoginMode && !isResetMode && (
              <div className="space-y-2">
                <Label htmlFor="name" className="uppercase text-xs tracking-wider text-muted-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            {/* --- Identifier Field --- */}
            {/* Hide identifier input if in Reset Verify Step, show summary instead */}
            {(resetStep === "REQUEST" || !isResetMode) ? (
              <div className="space-y-2">
                <Label htmlFor="identifier" className="uppercase text-xs tracking-wider text-muted-foreground">
                  {isResetMode ? "Email or Mobile Number" : (isLoginMode ? "Mobile Number or Email" : "Mobile Number")}
                </Label>
                <div className="relative">
                  {identifier.includes('@') ? (
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-9"
                    placeholder={isResetMode ? "Enter email or mobile" : (isLoginMode ? "Enter mobile or email" : "Enter mobile number")}
                    required
                  />
                </div>
              </div>
            ) : (
              // RESET VERIFY STEP - Show identifier summary
              <div className="bg-muted/30 p-3 rounded-lg border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Sent OTP to</p>
                    <p className="font-medium text-sm">{identifier}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={changePhone}
                  className="text-xs h-7"
                >
                  Change
                </Button>
              </div>
            )}

            {/* --- OTP & New Password Fields (Phone Reset Verify) --- */}
            {isResetMode && resetStep === "VERIFY" && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="otp" className="uppercase text-xs tracking-wider text-muted-foreground">
                      OTP Code
                    </Label>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCountdown > 0 || isLoading}
                      className={`text-xs flex items-center gap-1 ${resendCountdown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:underline'}`}
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoading && resendCountdown === 0 ? 'animate-spin' : ''}`} />
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="pl-9 tracking-widest"
                      placeholder="123456"
                      required
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="uppercase text-xs tracking-wider text-muted-foreground">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min 8 chars, 1 Upper, 1 Special"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="uppercase text-xs tracking-wider text-muted-foreground">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Re-enter password"
                  />
                </div>
              </>
            )}

            {/* --- Login/Register Password Field --- */}
            {!isResetMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="uppercase text-xs tracking-wider text-muted-foreground">
                    Password
                  </Label>
                  {isLoginMode && (
                    <button
                      type="button"
                      onClick={toggleResetMode}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isLoginMode && (
                  <p className="text-[10px] text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character.
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                isResetMode
                  ? (resetStep === "VERIFY" ? "Set New Password" : (/^[6-9][0-9]{9,10}$/.test(identifier) ? "Send OTP" : "Send Reset Link"))
                  : (isLoginMode ? "Sign In" : "Create Account")
              )}
            </Button>
          </form>

          {!isResetMode && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-background px-4 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  className="h-11"
                  onClick={async () => {
                    try {
                      setError(null);
                      const response = await fetch('/api/auth/google');
                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.message || data.msg || 'Failed to initiate Google sign-in');
                      }

                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error: any) {
                      console.error('Google sign-in error:', error);
                      setError(error.message || 'Failed to initiate Google sign-in');
                    }
                  }}
                >
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="h-11"
                  onClick={async () => {
                    try {
                      setError(null);
                      const response = await fetch('/api/auth/apple');
                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.message || data.msg || 'Failed to initiate Apple sign-in');
                      }

                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error: any) {
                      console.error('Apple sign-in error:', error);
                      setError(error.message || 'Failed to initiate Apple sign-in');
                    }
                  }}
                >
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="apple" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path></svg>
                  Apple
                </Button>
              </div>
            </>
          )}

          <Separator className="my-6" />

          <div className="text-center space-y-4">
            <div className="text-sm">
              {isResetMode ? (
                <button
                  type="button"
                  onClick={toggleResetMode}
                  className="text-primary font-medium hover:underline"
                >
                  Back to Sign In
                </button>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                  </span>{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary font-medium hover:underline"
                  >
                    {isLoginMode ? "Create one" : "Sign in"}
                  </button>
                </>
              )}
            </div>

            {/* Guest Checkout Option */}
            {!isResetMode && (
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
              >
                Continue as Guest
              </button>
            )}
          </div>
        </div>
      </div >
    </>
  );
}
