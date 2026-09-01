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
import { useState } from "react";
import { formatINR, useERP } from "@/lib/store";

export default function DailyFinancialSummaryPage() {
  const { metrics } = useERP();
  const [dateRange, setDateRange] = useState("Today (2023-10-24)");

  const breakdownData = [
    {
      id: "b1",
      name: "Widget Alpha Pro",
      qtySold: 145,
      salePrice: 120.0,
      purchaseRate: 85.0,
      marginPerItem: 35.0,
      totalProfit: 5075.0,
    },
    {
      id: "b2",
      name: "Steel Bearing X-1",
      qtySold: 1200,
      salePrice: 12.5,
      purchaseRate: 9.2,
      marginPerItem: 3.3,
      totalProfit: 3960.0,
    },
    {
      id: "b3",
      name: "Hydraulic Pump V2",
      qtySold: 12,
      salePrice: 450.0,
      purchaseRate: 310.0,
      marginPerItem: 140.0,
      totalProfit: 1680.0,
    },
    {
      id: "b4",
      name: "Copper Wire Coil 50m",
      qtySold: 85,
      salePrice: 65.0,
      purchaseRate: 52.0,
      marginPerItem: 13.0,
      totalProfit: 1105.0,
    },
    {
      id: "b5",
      name: "Industrial Sensor Kit",
      qtySold: 43,
      salePrice: 185.0,
      purchaseRate: 147.5,
      marginPerItem: 37.5,
      totalProfit: 1612.5,
    },
  ];

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
              Today's Profit Analysis and Gross Margin Reconciliation
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
            <option value="Today (2023-10-24)">Today (24 Oct 2023)</option>
            <option value="Yesterday">Yesterday (23 Oct 2023)</option>
            <option value="This Week">This Week (18-24 Oct)</option>
            <option value="This Month">This Month (Oct 2023)</option>
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
            <span>+12.5% vs yesterday</span>
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
            <span>Consistent with average</span>
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
            <span className="text-xl font-bold">{metrics.marginRate}%</span>
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
            className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-sm hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors cursor-pointer"
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
              {breakdownData.map((row) => (
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
                    ₹{row.salePrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-code text-on-surface">
                    ₹{row.purchaseRate.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-code text-secondary font-semibold">
                    ₹{row.marginPerItem.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-code font-bold text-on-surface">
                    ₹{row.totalProfit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-container-low border-t-2 border-outline-variant font-bold">
                <td className="py-3 px-4 text-primary">Summary Total</td>
                <td className="py-3 px-4 text-right font-code">1,485</td>
                <td className="py-3 px-4 text-right font-code">-</td>
                <td className="py-3 px-4 text-right font-code">-</td>
                <td className="py-3 px-4 text-right font-code text-secondary">
                  Avg 32.4%
                </td>
                <td className="py-3 px-4 text-right font-code text-primary">
                  {formatINR(
                    breakdownData.reduce((s, r) => s + r.totalProfit, 0),
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
