"use client";

import {
  Bell,
  Cloud,
  CloudOff,
  Database,
  KeyRound,
  Loader2,
  LogOut,
  Menu,
  Search,
  Sparkles,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
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
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const { metrics, clearAllData, isFirebaseActive, seedFirestore } = useERP();
  const { currentUser, isAdmin, logout, openChangePasswordModal } = useAuth();
  const router = useRouter();

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cloudModalRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    if (!showNotifications && !showUserMenu && !showCloudModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowUserMenu(false);
        setShowCloudModal(false);
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
      if (
        showCloudModal &&
        cloudModalRef.current &&
        !cloudModalRef.current.contains(e.target as Node)
      ) {
        setShowCloudModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, showUserMenu, showCloudModal]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (
      searchQuery.toLowerCase().startsWith("inv") ||
      searchQuery.toLowerCase().startsWith("cust")
    ) {
      router.push(`/sale-modify?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/inventory?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSeedCloud = async () => {
    setIsLoadingAction(true);
    setActionFeedback(null);
    try {
      const res = await seedFirestore();
      setActionFeedback(res.message);
    } catch (err) {
      setActionFeedback(`Error: ${(err as Error).message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleClearData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all data? This will remove all demo and current records.",
      )
    ) {
      return;
    }
    setIsLoadingAction(true);
    setActionFeedback(null);
    try {
      const res = await clearAllData();
      setActionFeedback(res.message);
    } catch (err) {
      setActionFeedback(`Error: ${(err as Error).message}`);
    } finally {
      setIsLoadingAction(false);
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
        {/* Firebase Cloud Status Indicator */}
        <div className="relative" ref={cloudModalRef}>
          <button
            onClick={() => setShowCloudModal(!showCloudModal)}
            title={
              isFirebaseActive
                ? "Firebase Firestore Connected"
                : "Firebase Offline / Local Storage Mode"
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm border transition-colors cursor-pointer ${
              isFirebaseActive
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:bg-surface-container-highest"
            }`}
          >
            {isFirebaseActive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden md:inline font-medium">Firebase</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="hidden md:inline text-on-surface-variant">
                  Local Mode
                </span>
              </>
            )}
          </button>

          {/* Cloud Status Modal / Popover */}
          {showCloudModal && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-sm shadow-xl p-4 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm text-primary">
                    Firebase Backend
                  </span>
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    isFirebaseActive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {isFirebaseActive ? "Connected" : "Local Mode"}
                </span>
              </div>

              <p className="text-on-surface-variant mb-3 leading-relaxed">
                {isFirebaseActive
                  ? "Your ERP is connected to Google Cloud Firestore with real-time live synchronization active across invoices, purchases, inventory, and party accounts."
                  : "Currently running in local fallback mode using browser storage. Add your Firebase credentials in .env.local to activate Cloud Firestore synchronization."}
              </p>

              <div className="space-y-2">
                <button
                  onClick={handleClearData}
                  disabled={isLoadingAction}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-error-container text-on-error-container rounded-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isLoadingAction ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All Data (Clean Slate)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSeedCloud}
                  disabled={isLoadingAction}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-surface-container-high text-on-surface rounded-sm font-medium hover:bg-surface-container-highest disabled:opacity-50 transition-all border border-outline-variant cursor-pointer text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Load Sample Demo Data (Optional)</span>
                </button>

                {actionFeedback && (
                  <p className="text-[11px] p-2 bg-surface-container-high rounded text-on-surface border border-outline-variant">
                    {actionFeedback}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Clear Data Button */}
        <button
          onClick={handleClearData}
          title="Clear All Records & Start Clean"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-sm border border-outline-variant transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Data</span>
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
                {metrics.expiredItemsCount === 0 &&
                metrics.reorderCount === 0 ? (
                  <div className="px-3 py-4 text-center text-on-surface-variant">
                    No active alerts. All stock optimal.
                  </div>
                ) : (
                  <>
                    {metrics.expiredItemsCount > 0 && (
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
                    )}
                    {metrics.reorderCount > 0 && (
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
                    )}
                  </>
                )}
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
              {(currentUser?.displayName || currentUser?.userId || "U")
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <div className="font-semibold truncate max-w-[120px]">
                {currentUser?.displayName || "Operator"}
              </div>
              <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    currentUser?.role === "admin"
                      ? "bg-primary"
                      : "bg-secondary"
                  }`}
                ></span>
                <span className="capitalize">
                  {currentUser?.role === "admin" ? "Admin" : "Staff"}
                </span>
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-surface-container-lowest border border-outline-variant rounded-sm shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-outline-variant">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-primary truncate">
                    {currentUser?.displayName || "User"}
                  </p>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                      currentUser?.role === "admin"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}
                  >
                    {currentUser?.role || "user"}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                  @{currentUser?.userId}
                </p>
                {currentUser?.email && (
                  <p className="text-[10px] text-on-surface-variant truncate">
                    {currentUser.email}
                  </p>
                )}
              </div>

              <div className="py-1">
                {isAdmin && (
                  <Link
                    href="/users"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low text-primary font-medium"
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    <span>Manage Users (Admin)</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    openChangePasswordModal();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low text-on-surface text-left cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Change My Password</span>
                </button>

                <div className="border-t border-outline-variant my-1" />

                <Link
                  href="/ledger"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-3 py-1.5 hover:bg-surface-container-low text-on-surface"
                >
                  Party Accounts Khata
                </Link>
                <Link
                  href="/profit"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-3 py-1.5 hover:bg-surface-container-low text-on-surface"
                >
                  Financial Summary
                </Link>

                <div className="border-t border-outline-variant my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-error hover:bg-error-container/30 text-left cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
