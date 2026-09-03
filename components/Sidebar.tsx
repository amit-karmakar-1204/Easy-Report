"use client";

import {
  AlertTriangle,
  BookOpen,
  Boxes,
  DollarSign,
  FileEdit,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Truck,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useERP } from "@/lib/store";

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { metrics } = useERP();
  const { currentUser, isAdmin, logout, openChangePasswordModal } = useAuth();

  const navItems = [
    {
      label: "Main Dashboard",
      href: "/",
      icon: LayoutDashboard,
      shortcut: "Alt+H",
    },
    {
      section: "SALES MODULE",
    },
    {
      label: "Active Billing (Sale)",
      href: "/sale",
      icon: ShoppingCart,
      shortcut: "Alt+1",
    },
    {
      label: "Sale Modify (Invoices)",
      href: "/sale-modify",
      icon: FileEdit,
      shortcut: "Alt+6",
    },
    {
      section: "PURCHASE MODULE",
    },
    {
      label: "Stock Inward (Purchase)",
      href: "/purchase",
      icon: Truck,
      shortcut: "Alt+2",
    },
    {
      label: "Purchase History",
      href: "/purchase-modify",
      icon: Receipt,
      shortcut: "Alt+8",
    },
    {
      section: "REPORTS & ACCOUNTS",
    },
    {
      label: "Ledger A/C (Party Khata)",
      href: "/ledger",
      icon: BookOpen,
      shortcut: "Alt+4",
    },
    {
      label: "Stock Status (Inventory)",
      href: "/inventory",
      icon: Boxes,
      shortcut: "Alt+3",
    },
    {
      label: "Stock & Sale Analysis",
      href: "/performance",
      icon: TrendingUp,
      shortcut: "Alt+7",
    },
    {
      label: "Today's Profit Analysis",
      href: "/profit",
      icon: DollarSign,
      shortcut: "Alt+9",
    },
    {
      label: "Expired Items Board",
      href: "/expiry",
      icon: AlertTriangle,
      badge: metrics.expiredItemsCount,
      badgeColor: "bg-error text-on-error",
      shortcut: "Alt+5",
    },
    ...(isAdmin
      ? [
          {
            section: "ADMINISTRATION",
          },
          {
            label: "User Management",
            href: "/users",
            icon: UserCog,
          },
        ]
      : []),
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <button
          type="button"
          aria-label="Close sidebar menu"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-primary/40 z-40 md:hidden backdrop-blur-xs transition-opacity border-none cursor-pointer"
        />
      )}

      <aside
        className={`fixed left-0 top-16 bottom-0 w-[240px] bg-surface-bright border-r border-outline-variant z-40 flex flex-col py-4 transition-transform duration-200 ease-in-out select-none ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header summary in sidebar */}
        <div className="px-4 mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
            <span>{isAdmin ? "Admin Panel" : "Staff Panel"}</span>
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                isAdmin
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary-container text-on-secondary-container"
              }`}
            >
              {currentUser?.role || "user"}
            </span>
          </div>
          <div className="text-sm font-bold text-primary mt-0.5 truncate">
            {currentUser?.displayName || "Warehouse Alpha"}
          </div>
          <div className="text-[11px] text-on-surface-variant/80 font-mono">
            @{currentUser?.userId || "user"}
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => {
            if ("section" in item) {
              return (
                <div
                  key={item.section}
                  className="px-3 pt-3 pb-1 text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-widest"
                >
                  {item.section}
                </div>
              );
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center justify-between px-3 py-2 rounded-sm text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-on-primary font-semibold shadow-xs"
                    : "text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-on-primary" : "text-on-surface-variant"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-xs shrink-0 ${
                      item.badgeColor || "bg-primary text-on-primary"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : item.shortcut ? (
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded border shrink-0 ${
                      isActive
                        ? "border-on-primary/30 text-on-primary bg-on-primary/10"
                        : "border-outline-variant/60 text-on-surface-variant/70 bg-surface-container"
                    }`}
                  >
                    {item.shortcut}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="mt-auto pt-3 border-t border-outline-variant px-2 space-y-0.5">
          <button
            type="button"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              openChangePasswordModal();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs text-on-surface hover:bg-surface-container-highest transition-colors text-left cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-on-surface-variant" />
            <span>Change Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              logout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs text-error hover:bg-error-container/30 transition-colors text-left cursor-pointer font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
