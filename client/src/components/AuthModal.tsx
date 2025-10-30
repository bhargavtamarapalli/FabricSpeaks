import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, name: string) => void;
}

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginMode) {
      onLogin(email, password);
    } else {
      onRegister(email, password, name);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
        data-testid="overlay-auth"
      />

      <div
        data-testid="modal-auth"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background z-50 shadow-xl rounded-lg animate-in zoom-in-95 fade-in duration-300"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 data-testid="text-auth-title" className="text-xl font-medium">
            {isLoginMode ? "Sign In" : "Create Account"}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-auth"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLoginMode && (
            <div className="space-y-2">
              <Label htmlFor="name" className="uppercase text-xs tracking-wider">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-name"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="uppercase text-xs tracking-wider">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="uppercase text-xs tracking-wider">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            data-testid="button-submit"
          >
            {isLoginMode ? "Sign In" : "Create Account"}
          </Button>

          <Separator className="my-4" />

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isLoginMode ? "Don't have an account?" : "Already have an account?"}
            </span>{" "}
            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-foreground underline"
              data-testid="button-toggle-mode"
            >
              {isLoginMode ? "Create one" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
