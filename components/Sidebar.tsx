"use client";

import {
  AlertTriangle,
  BookOpen,
  Boxes,
  DollarSign,
  FileEdit,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  ShoppingCart,
  TrendingUp,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useERP } from "@/lib/store";

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { metrics } = useERP();

  const navItems = [
    {
      label: "Main Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      section: "SALES MODULE",
    },
    {
      label: "Active Billing (Sale)",
      href: "/sale",
      icon: ShoppingCart,
    },
    {
      label: "Sale Modify (Invoices)",
      href: "/sale-modify",
      icon: FileEdit,
    },
    {
      section: "PURCHASE MODULE",
    },
    {
      label: "Stock Inward (Purchase)",
      href: "/purchase",
      icon: Truck,
    },
    {
      label: "Purchase History",
      href: "/purchase-modify",
      icon: Receipt,
    },
    {
      section: "REPORTS & ACCOUNTS",
    },
    {
      label: "Ledger A/C (Party Khata)",
      href: "/ledger",
      icon: BookOpen,
    },
    {
      label: "Stock Status (Inventory)",
      href: "/inventory",
      icon: Boxes,
    },
    {
      label: "Stock & Sale Analysis",
      href: "/performance",
      icon: TrendingUp,
    },
    {
      label: "Today's Profit Analysis",
      href: "/profit",
      icon: DollarSign,
    },
    {
      label: "Expired Items Board",
      href: "/expiry",
      icon: AlertTriangle,
      badge: metrics.expiredItemsCount,
      badgeColor: "bg-error text-on-error",
    },
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
          <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Admin Panel
          </div>
          <div className="text-sm font-bold text-primary mt-0.5">
            Warehouse Alpha
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
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="mt-auto pt-3 border-t border-outline-variant px-2 space-y-0.5">
          <button
            onClick={() =>
              alert(
                "Easy Report Wholesale ERP v2.4\nPrecision Wholesale Interface - All systems active.",
              )
            }
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs text-on-surface hover:bg-surface-container-highest transition-colors text-left"
          >
            <Settings className="w-4 h-4 text-on-surface-variant" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => alert("Logged in as Warehouse Alpha Admin.")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs text-on-surface hover:bg-surface-container-highest transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-on-surface-variant" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
