"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  User,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Handle Caps Lock detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState("CapsLock")) {
      setIsCapsLockOn(true);
    } else {
      setIsCapsLockOn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage("Please enter your User ID or Email.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(identifier, password);
      if (!result.success) {
        setErrorMessage(result.error || "Authentication failed. Check your credentials.");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFillDev = () => {
    setIdentifier("developer");
    setPassword("developer123");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-background text-on-surface select-none">
      {/* Top Industrial Header */}
      <header className="w-full border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center font-black text-sm tracking-tighter">
            ER
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-primary">
              EASY REPORT
            </span>
            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
              Wholesale ERP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="font-mono font-medium">Terminal Node Active</span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-md shadow-xl overflow-hidden">
            {/* Header Stripe */}
            <div className="h-1.5 bg-primary w-full" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Form Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold tracking-tight text-primary">
                    System Authentication
                  </h1>
                  <span className="text-[11px] font-mono font-bold bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                    v2.4
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Sign in with your developer-provisioned User ID or Email.
                </p>
              </div>

              {/* Developer Provisioning Policy Alert */}
              <div className="flex items-start gap-2.5 p-3 rounded bg-surface-container-low border border-outline-variant/80 text-xs">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-[11px] text-on-surface-variant leading-relaxed">
                  <strong className="font-semibold text-primary">
                    Restricted Registration:
                  </strong>{" "}
                  Public sign-up is disabled. Only authorized developers can provision user IDs and passwords.
                </div>
              </div>

              {/* Error Message Container */}
              {errorMessage && (
                <div className="p-3 rounded bg-error-container/30 border border-error/20 flex items-start gap-2.5 text-xs text-error animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* User ID / Email Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-semibold text-on-surface uppercase tracking-wider"
                  >
                    User ID or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="identifier"
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="e.g. developer, cashier01, or email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-on-surface transition-colors"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-on-surface uppercase tracking-wider"
                    >
                      Password
                    </label>
                    {isCapsLockOn && (
                      <span className="text-[10px] font-bold text-error uppercase tracking-wider flex items-center gap-1">
                        Caps Lock ON
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="Enter security password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyDown}
                      className="w-full pl-9 pr-10 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-on-surface transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-outline-variant text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <span className="text-xs text-on-surface-variant">
                      Remember login on this device
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 bg-primary hover:bg-primary/90 text-on-primary font-semibold text-xs rounded transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Sign In to Terminal</span>
                    </>
                  )}
                </button>
              </form>

              {/* Developer Initial Bootstrap Helper */}
              <div className="pt-2 border-t border-outline-variant/60">
                <div className="bg-surface-container-low/70 border border-outline-variant/60 rounded p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary text-[11px] flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      Initial Developer Setup
                    </span>
                    <button
                      type="button"
                      onClick={handleQuickFillDev}
                      className="text-[10px] font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      Quick Fill Dev
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-on-surface-variant bg-surface-container-lowest p-2 rounded border border-outline-variant/50">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-on-surface-variant/70">
                        Default ID
                      </span>
                      <span className="font-bold text-on-surface">developer</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-on-surface-variant/70">
                        Default Pass
                      </span>
                      <span className="font-bold text-on-surface">developer123</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/80 italic">
                    Use developer login to access the User Provisioning portal and generate user credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center space-y-1 text-xs text-on-surface-variant">
            <p className="font-mono text-[11px]">
              Easy Report ERP Wholesale Terminal &bull; Secure Node
            </p>
            <p className="text-[10px] text-on-surface-variant/70">
              Need account credentials? Contact your system developer or administrator.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="w-full border-t border-outline-variant bg-surface-container-lowest px-6 py-2 flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
        <div className="flex items-center gap-4">
          <span>Warehouse Alpha Station</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline">Role-Based Policy Active</span>
        </div>
        <div className="flex items-center gap-1.5 text-secondary font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security Protocol AES-256</span>
        </div>
      </footer>
    </div>
  );
}
