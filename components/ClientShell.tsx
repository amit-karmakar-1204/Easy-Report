"use client";

import type React from "react";
import { useState } from "react";
import { ERPProvider } from "@/lib/store";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
