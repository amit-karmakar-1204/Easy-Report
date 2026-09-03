"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ERPProvider } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

function ShellContent({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isLoginPage) {
        router.replace("/login");
      } else if (isAuthenticated && isLoginPage) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // If on login page, render children cleanly without ERP navbar/sidebar
  if (isLoginPage) {
    return <div className="min-h-screen bg-background text-on-surface">{children}</div>;
  }

  // Loading state while checking authentication
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-surface-container-lowest border border-outline-variant px-8 py-6 rounded-md shadow-sm">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <div className="text-center">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              EASY REPORT ERP
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Verifying session credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ERPProvider>
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
      </div>
    </ERPProvider>
  );
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellContent>{children}</ShellContent>
    </AuthProvider>
  );
}

