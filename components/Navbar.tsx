"use client";

import { Bell, Menu, RefreshCw, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useERP } from "@/lib/store";

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

export function Navbar({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { metrics, resetToDefaults } = useERP();
  const router = useRouter();

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    if (!showNotifications && !showUserMenu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        showNotifications &&
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, showUserMenu]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Route to invoice search or inventory search based on query
    if (
      searchQuery.toLowerCase().startsWith("inv") ||
      searchQuery.toLowerCase().startsWith("cust")
    ) {
      router.push(`/sale-modify?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/inventory?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-surface text-primary fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-6 h-16 border-b border-outline-variant select-none">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="md:hidden flex items-center justify-center p-2 hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer active:bg-surface-dim rounded-sm"
        >
          {isMobileSidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-primary text-on-primary flex items-center justify-center font-bold text-xs rounded-sm">
            ER
          </div>
          <span className="font-bold text-xl md:text-2xl text-primary tracking-tight group-hover:opacity-90">
            EASY REPORT
          </span>
        </Link>
        <span className="hidden lg:inline-flex text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant ml-2">
          Wholesale ERP v2.4
        </span>
      </div>

      {/* Global Quick Search */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden sm:flex flex-1 max-w-md mx-6"
      >
        <div className="w-full relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Customer, Invoice #, SKU, or Batch..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface-container-lowest border border-outline-variant rounded-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </form>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2">
        {/* Reset / Demo Data Sync */}
        <button
          onClick={() => {
            if (confirm("Reset ERP state to initial demo dataset?")) {
              resetToDefaults();
            }
          }}
          title="Reset Sample Data"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm border border-outline-variant transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Data</span>
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative flex items-center justify-center p-2 hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer active:bg-surface-dim rounded-sm"
          >
            <Bell className="w-5 h-5" />
            {metrics.expiredItemsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-sm shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-outline-variant flex justify-between items-center">
                <span className="font-semibold text-xs uppercase tracking-wider text-on-surface-variant">
                  System Alerts
                </span>
                <span className="text-[11px] bg-error-container text-on-error-container px-1.5 py-0.5 rounded font-medium">
                  {metrics.expiredItemsCount} Critical
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant text-xs">
                <Link
                  href="/expiry"
                  onClick={() => setShowNotifications(false)}
                  className="block px-3 py-2.5 hover:bg-surface-container-low transition-colors"
                >
                  <p className="font-semibold text-error flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                    {metrics.expiredItemsCount} items have reached expiry
                  </p>
                  <p className="text-on-surface-variant mt-0.5">
                    Click to review on Expiry Action Board
                  </p>
                </Link>
                <Link
                  href="/performance"
                  onClick={() => setShowNotifications(false)}
                  className="block px-3 py-2.5 hover:bg-surface-container-low transition-colors"
                >
                  <p className="font-semibold text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    {metrics.reorderCount} items requiring stock reorder
                  </p>
                  <p className="text-on-surface-variant mt-0.5">
                    Review stock velocity analysis
                  </p>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Account */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User Account"
            className="flex items-center gap-2 p-1.5 hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer rounded-sm"
          >
            <div className="w-8 h-8 rounded-sm bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
              WA
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <div className="font-semibold">Warehouse Alpha</div>
              <div className="text-[10px] text-on-surface-variant">
                Admin Manager
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-sm shadow-lg py-2 z-50 text-xs">
              <div className="px-3 py-2 border-b border-outline-variant">
                <p className="font-semibold text-primary">Warehouse Alpha</p>
                <p className="text-on-surface-variant">admin@easyreport.erp</p>
              </div>
              <div className="py-1">
                <Link
                  href="/ledger"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-3 py-2 hover:bg-surface-container-low text-on-surface"
                >
                  Party Accounts Khata
                </Link>
                <Link
                  href="/profit"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-3 py-2 hover:bg-surface-container-low text-on-surface"
                >
                  Financial Summary
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
