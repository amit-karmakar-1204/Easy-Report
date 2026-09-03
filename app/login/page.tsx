"use client";

import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Shield,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, currentUser } = useAuth();
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId.trim() || !password) {
      setError("Please enter both User ID and Password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(userId, password);
      if (res.success) {
        router.push("/");
      } else {
        setError(res.error || "Authentication failed.");
      }
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoId: string, demoPass: string) => {
    setUserId(demoId);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-primary text-on-primary font-bold text-lg mb-3 shadow-md">
            ER
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            EASY REPORT
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Precision Wholesale ERP & Warehouse Control System
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-sm shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                System Authentication
              </h2>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant">
              v2.4 Secure
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-sm bg-error-container text-on-error-container border border-error/20 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID / Username */}
            <div>
              <label
                htmlFor="user-id-input"
                className="block text-xs font-semibold text-on-surface mb-1"
              >
                User ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  id="user-id-input"
                  type="text"
                  autoComplete="username"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. admin or staff ID"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password-input"
                  className="text-xs font-semibold text-on-surface"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-primary text-on-primary font-semibold text-xs rounded-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          {/* Policy Notice: Admin-Only Creation */}
          <div className="mt-5 p-3 rounded-sm bg-surface-container-low border border-outline-variant text-[11px] text-on-surface-variant flex items-start gap-2">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-on-surface">
                Role-Based Security Policy
              </p>
              <p className="mt-0.5 leading-relaxed">
                Self-registration is disabled. New accounts and login
                credentials can only be provisioned by a system administrator.
                Once provisioned, users can change their own password.
              </p>
            </div>
          </div>

          {/* Quick Demo Fillers */}
          <div className="mt-4 pt-4 border-t border-outline-variant">
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Default Access Profiles (Testing)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("admin", "Admin@2026")}
                className="p-2 border border-outline-variant hover:border-primary/50 hover:bg-surface-container-high rounded-sm text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">Admin</span>
                  <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-primary/10 text-primary">
                    Full Access
                  </span>
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                  admin / Admin@2026
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("operator1", "User@123")}
                className="p-2 border border-outline-variant hover:border-primary/50 hover:bg-surface-container-high rounded-sm text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary">
                    Staff User
                  </span>
                  <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-secondary-container text-on-secondary-container">
                    Standard
                  </span>
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                  operator1 / User@123
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-on-surface-variant/70 mt-6">
          &copy; 2026 Easy Report Wholesale ERP. All rights reserved.
        </p>
      </div>
    </div>
  );
}
