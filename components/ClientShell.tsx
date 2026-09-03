"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ERPProvider } from "@/lib/store";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";

function ShellContent({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Register global keyboard navigation & hotkeys
  useGlobalKeyboardShortcuts({
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    onToggleSidebar: () => setIsMobileSidebarOpen((prev) => !prev),
  });

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
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
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
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
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
