"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ERPProvider } from "@/lib/store";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useArrowKeyNavigation } from "@/hooks/useArrowKeyNavigation";

function ShellContent({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Register arrow keys navigation (↑ ↓ ← →), button press animation, and Esc as back
  useArrowKeyNavigation();

  // Route guard: if not authenticated and not on /login, redirect to /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Loading spinner during auth hydration
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 bg-primary text-on-primary font-bold text-sm rounded-sm flex items-center justify-center shadow-md animate-pulse">
          ER
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Initializing Easy Report ERP...</span>
        </div>
      </div>
    );
  }

  // If on login page, render child directly without ERP chrome
  if (pathname === "/login") {
    return (
      <div className="min-h-screen bg-background text-on-surface font-sans">
        {children}
      </div>
    );
  }

  // If not authenticated, prevent flash of ERP content while redirect is processing
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Redirecting to login...</span>
        </div>
      </div>
    );
  }

  // Authenticated ERP Shell
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Navbar
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />
      <div className="flex flex-1 pt-16">
        <Sidebar
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 md:ml-[240px] min-h-[calc(100vh-4rem)] p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <ChangePasswordModal />

      {/* Floating Keyboard Navigation Indicator */}
      <div className="fixed bottom-3 right-4 z-40 bg-surface-container-highest/90 border border-outline-variant/80 text-on-surface shadow-lg backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium hidden sm:flex items-center gap-2 select-none pointer-events-none transition-all animate-in fade-in slide-in-from-bottom-2">
        <span className="flex items-center gap-0.5 font-mono text-[11px] font-bold text-primary">
          <span className="px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant rounded">↑</span>
          <span className="px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant rounded">↓</span>
          <span className="px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant rounded">←</span>
          <span className="px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant rounded">→</span>
        </span>
        <span className="text-[11px] text-on-surface-variant font-medium">Traverse</span>
        <span className="text-outline-variant">•</span>
        <span className="px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant rounded font-mono text-[11px] font-bold text-primary">↵ Enter</span>
        <span className="text-[11px] text-on-surface-variant font-medium">Select</span>
        <span className="text-outline-variant">•</span>
        <span className="px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant rounded font-mono text-[11px] font-bold text-primary">Esc</span>
        <span className="text-[11px] text-on-surface-variant font-medium">Back</span>
      </div>
    </div>
  );
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ERPProvider>
        <ShellContent>{children}</ShellContent>
      </ERPProvider>
    </AuthProvider>
  );
}
