"use client";

import {
  AlertTriangle,
  ArrowRight,
  FileEdit,
  Receipt,
  ShoppingCart,
  Truck,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { formatINR, useERP } from "@/lib/store";

export default function DashboardPage() {
  const { metrics, invoices, purchases } = useERP();

  // Combine recent invoices and purchases into a unified recent transactions feed
  const recentTransactions = React.useMemo(() => {
    const saleTx = invoices.map((inv) => ({
      id: inv.id,
      date: inv.date,
      type: "Sale" as const,
      entity: inv.customerName,
      amount: inv.grandTotal,
      status: inv.status === "Paid" ? "Completed" : inv.status,
    }));

    const purTx = purchases.map((pur) => ({
      id: pur.id,
      date: pur.date,
      type: "Purchase" as const,
      entity: pur.supplierName,
      amount: pur.totalCost,
      status: pur.status,
    }));

    return [...saleTx, ...purTx]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [invoices, purchases]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            EASY REPORT Dashboard
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Real-time wholesale ERP control center for Warehouse Alpha.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-secondary-container text-on-secondary-container font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            System Live & Ready
          </span>
          <span className="text-on-surface-variant hidden sm:inline">
            | Fiscal Year: 2023-24
          </span>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Today's Profit */}
        <Link
          href="/profit"
          className="bg-surface-container-lowest border border-outline-variant rounded-sm p-5 flex flex-col justify-between h-32 hover:border-primary/40 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Today's Profit
            </span>
            <span className="text-xs text-secondary flex items-center gap-1 font-semibold group-hover:underline">
              View Breakdown <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-secondary tracking-tight">
            {formatINR(metrics.todayProfit)}
          </div>
        </Link>

        {/* Card 2: Expired Items Alert */}
        <Link
          href="/expiry"
          className="bg-error border border-error rounded-sm p-5 flex flex-col justify-between h-32 text-on-error hover:opacity-95 transition-opacity group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Expired Items
            </span>
            <span className="text-xs flex items-center gap-1 font-semibold underline text-white/90">
              Action Required <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {metrics.expiredItemsCount}
            </div>
            <AlertTriangle className="w-9 h-9 text-white/90" />
          </div>
        </Link>
      </div>

      {/* Quick Action Grid */}
      <div>
        <div className="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
          <span>Quick Actions</span>
          <span className="text-xs font-normal text-on-surface-variant">
            (Direct access to primary workflows)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/sale"
            className="bg-surface-container border border-outline-variant rounded-sm p-6 flex flex-col items-center justify-center gap-3 hover:bg-surface-container-high transition-colors group cursor-pointer h-40 text-center"
          >
            <ShoppingCart className="w-10 h-10 text-on-surface-variant group-hover:text-primary transition-colors" />
            <span className="text-base font-bold text-primary">
              Sale (Billing)
            </span>
          </Link>

          <Link
            href="/sale-modify"
            className="bg-surface-container border border-outline-variant rounded-sm p-6 flex flex-col items-center justify-center gap-3 hover:bg-surface-container-high transition-colors group cursor-pointer h-40 text-center"
          >
            <FileEdit className="w-10 h-10 text-on-surface-variant group-hover:text-primary transition-colors" />
            <span className="text-base font-bold text-primary">
              Sale Modify
            </span>
          </Link>

          <Link
            href="/purchase"
            className="bg-surface-container border border-outline-variant rounded-sm p-6 flex flex-col items-center justify-center gap-3 hover:bg-surface-container-high transition-colors group cursor-pointer h-40 text-center"
          >
            <Truck className="w-10 h-10 text-on-surface-variant group-hover:text-primary transition-colors" />
            <span className="text-base font-bold text-primary">
              Purchase (Inward)
            </span>
          </Link>

          <Link
            href="/purchase-modify"
            className="bg-surface-container border border-outline-variant rounded-sm p-6 flex flex-col items-center justify-center gap-3 hover:bg-surface-container-high transition-colors group cursor-pointer h-40 text-center"
          >
            <Receipt className="w-10 h-10 text-on-surface-variant group-hover:text-primary transition-colors" />
            <span className="text-base font-bold text-primary">
              Purchase Modify
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <div className="text-base font-bold text-on-surface">
            Recent Transactions
          </div>
          <Link
            href="/sale-modify"
            className="px-3 py-1.5 border border-outline-variant rounded-sm text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            View All Invoices
          </Link>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant">
                    Date
                  </th>
                  <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant">
                    Type
                  </th>
                  <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant">
                    Entity
                  </th>
                  <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant text-right">
                    Amount
                  </th>
                  <th className="p-3 font-bold uppercase tracking-wider text-on-surface-variant text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="p-3 text-on-surface-variant">{tx.date}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider ${
                          tx.type === "Sale"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-highest text-on-surface"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-on-surface">
                      {tx.entity}
                    </td>
                    <td className="p-3 font-bold text-right font-code text-on-surface">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider ${
                          tx.status === "Completed"
                            ? "bg-secondary-container text-on-secondary-container"
                            : tx.status === "Pending"
                              ? "bg-tertiary-fixed text-on-tertiary-fixed"
                              : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
