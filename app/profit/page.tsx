"use client";

import {
  ArrowLeft,
  BarChart2,
  Calendar,
  Download,
  PieChart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatINR, useERP } from "@/lib/store";

export default function DailyFinancialSummaryPage() {
  const { metrics, invoices, inventory } = useERP();
  const [dateRange, setDateRange] = useState("Today");

  // Dynamically compute breakdown from real invoices and inventory cost
  const breakdownData = useMemo(() => {
    const itemMap = new Map<
      string,
      {
        name: string;
        qtySold: number;
        totalRevenue: number;
        purchaseRate: number;
      }
    >();

    for (const inv of invoices) {
      for (const item of inv.items) {
        const key = item.itemName.toLowerCase();
        const invItem = inventory.find(
          (i) => i.name.toLowerCase() === key || i.sku.toLowerCase() === key,
        );
        const purchaseRate = invItem ? invItem.purchaseRate : item.rate * 0.7;

        if (!itemMap.has(key)) {
          itemMap.set(key, {
            name: item.itemName,
            qtySold: item.qty,
            totalRevenue: item.total,
            purchaseRate,
          });
        } else {
          const prev = itemMap.get(key)!;
          itemMap.set(key, {
            name: prev.name,
            qtySold: prev.qtySold + item.qty,
            totalRevenue: prev.totalRevenue + item.total,
            purchaseRate: prev.purchaseRate || purchaseRate,
          });
        }
      }
    }

    return Array.from(itemMap.entries()).map(([id, data]) => {
      const salePrice = data.qtySold > 0 ? data.totalRevenue / data.qtySold : 0;
      const marginPerItem = Math.max(0, salePrice - data.purchaseRate);
      const totalProfit = marginPerItem * data.qtySold;
      return {
        id,
        name: data.name,
        qtySold: data.qtySold,
        salePrice,
        purchaseRate: data.purchaseRate,
        marginPerItem,
        totalProfit,
      };
    });
  }, [invoices, inventory]);

  const totalQtySold = breakdownData.reduce((s, r) => s + r.qtySold, 0);
  const totalProfitCalculated = breakdownData.reduce(
    (s, r) => s + r.totalProfit,
    0,
  );

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Item Name,Qty Sold,Sale Price,Purchase Rate,Margin/Item,Total Profit"]
        .concat(
          breakdownData.map(
            (r) =>
              `"${r.name}",${r.qtySold},${r.salePrice},${r.purchaseRate},${r.marginPerItem},${r.totalProfit}`,
          ),
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `financial_profit_summary_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Daily Financial Summary
            </h1>
            <p className="text-xs text-on-surface-variant">
              Live Profit Analysis and Gross Margin Reconciliation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-on-surface-variant flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date:
          </span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant rounded-sm font-medium text-xs focus:border-primary outline-none"
          >
            <option value="Today">Today (02 Aug 2026)</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month (Aug 2026)</option>
          </select>
        </div>
      </div>

      {/* Summary Metrics Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Sales */}
        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Total Sales Value
          </span>
          <span className="text-3xl font-bold text-primary tracking-tight font-code">
            {formatINR(metrics.totalSalesValue)}
          </span>
          <div className="mt-3 flex items-center text-secondary text-xs font-semibold">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Live Sales Revenue</span>
          </div>
        </div>

        {/* Total Landing Cost */}
        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Total Landing Cost
          </span>
          <span className="text-3xl font-bold text-primary tracking-tight font-code">
            {formatINR(metrics.totalLandingCost)}
          </span>
          <div className="mt-3 flex items-center text-on-surface-variant text-xs">
            <BarChart2 className="w-4 h-4 mr-1 text-outline" />
            <span>Inward procurement cost</span>
          </div>
        </div>

        {/* Gross Margin */}
        <div className="bg-primary text-on-primary border border-primary p-5 rounded-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
            <PieChart className="w-32 h-32 text-white" />
          </div>
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2 relative z-10">
            Gross Margin (Profit)
          </span>
          <span className="text-3xl font-bold text-white tracking-tight font-code relative z-10">
            {formatINR(metrics.grossMargin)}
          </span>
          <div className="mt-3 flex items-center text-secondary-container relative z-10">
            <span className="text-xl font-bold">{metrics.marginRate.toFixed(1)}%</span>
            <span className="text-xs ml-2 opacity-80">Gross Margin Rate</span>
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
        <div className="p-3.5 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div>
            <h3 className="font-bold text-sm text-on-surface">
              Itemized Profit Breakdown
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Cost vs Revenue per unit comparison
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={breakdownData.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-sm hover:bg-surface-container-high text-xs font-semibold text-on-surface disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider">
                  Item Name
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Qty Sold
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Sale Price
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Purchase Rate
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Margin / Item
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Total Profit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {breakdownData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-on-surface-variant font-medium"
                  >
                    No sales recorded yet. Invoices created in Sale Billing will appear here itemized.
                  </td>
                </tr>
              ) : (
                breakdownData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-on-surface">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-right font-code text-on-surface">
                      {row.qtySold.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-code text-on-surface">
                      {formatINR(row.salePrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-code text-on-surface">
                      {formatINR(row.purchaseRate)}
                    </td>
                    <td className="py-3 px-4 text-right font-code text-secondary font-semibold">
                      {formatINR(row.marginPerItem)}
                    </td>
                    <td className="py-3 px-4 text-right font-code font-bold text-on-surface">
                      {formatINR(row.totalProfit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {breakdownData.length > 0 && (
              <tfoot>
                <tr className="bg-surface-container-low border-t-2 border-outline-variant font-bold">
                  <td className="py-3 px-4 text-primary">Summary Total</td>
                  <td className="py-3 px-4 text-right font-code">
                    {totalQtySold.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-code">-</td>
                  <td className="py-3 px-4 text-right font-code">-</td>
                  <td className="py-3 px-4 text-right font-code text-secondary">
                    {metrics.marginRate.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-code text-primary">
                    {formatINR(totalProfitCalculated)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
