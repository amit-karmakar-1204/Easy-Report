"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Check,
  CheckCircle2,
  Download,
  FileCheck,
  Filter,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useMemo, useState } from "react";
import { formatINR, useERP } from "@/lib/store";
import type { PerformanceItem } from "@/lib/types";

export default function PerformanceReportPage() {
  const { metrics, performanceItems, reorderItem, addPurchase } = useERP();

  const [startDate, setStartDate] = useState("2023-09-01");
  const [endDate, setEndDate] = useState("2023-09-30");
  const [velocityFilter, setVelocityFilter] = useState("All Items");
  const [orderedCodes, setOrderedCodes] = useState<string[]>([]);

  // PO Modal State
  const [poItem, setPoItem] = useState<PerformanceItem | null>(null);
  const [poSupplier, setPoSupplier] = useState("Global Tech Supplies");
  const [poQty, setPoQty] = useState<number>(500);
  const [poRate, setPoRate] = useState("12.50");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return performanceItems.filter((item) => {
      if (velocityFilter === "Fast Moving Only") {
        return item.velocity === "Fast Moving";
      }
      if (velocityFilter === "Reorder Required") {
        return item.reorderRequired;
      }
      return true;
    });
  }, [performanceItems, velocityFilter]);

  const handleOpenPOModal = (item: PerformanceItem) => {
    setPoItem(item);
    setPoQty(500);
    setPoRate(item.code.includes("8902") ? "45.00" : "9.20");
    setPoSupplier("Global Tech Supplies");
    setPoDate(new Date().toISOString().split("T")[0]);
  };

  const handleConfirmPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poItem) return;

    const rateNum = parseFloat(poRate) || 10;
    const totalCost = poQty * rateNum;

    // Log purchase to ERP
    addPurchase({
      purchaseId: `PO-${Date.now().toString().slice(-6)}`,
      date: poDate,
      supplierName: poSupplier,
      items: [
        {
          id: `po-it-${Date.now()}`,
          itemName: poItem.name,
          batchNo: `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: "2026-12",
          purchaseRate: rateNum,
          mrp: rateNum * 1.3,
          qty: poQty,
          total: totalCost,
        },
      ],
      totalCost,
      status: "Completed",
    });

    reorderItem(poItem.code);
    setOrderedCodes((prev) => [...prev, poItem.code]);
    setToastMessage(
      `Purchase Order issued for ${poItem.name} (${poQty} units). Stock replenished!`,
    );
    setTimeout(() => setToastMessage(null), 4000);
    setPoItem(null);
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Item Code,Item Name,Purchased Qty,Sold Qty,Current Stock,Velocity,Reorder Status",
      ]
        .concat(
          filteredItems.map(
            (i) =>
              `"${i.code}","${i.name}",${i.totalPurchased},${i.totalSold},${i.currentStock},"${i.velocity}","${
                i.reorderRequired ? "Reorder Needed" : "Sufficient"
              }"`,
          ),
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `stock_sale_analysis_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Stock & Sale Analysis
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            Comprehensive view of inventory movement and sales performance
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Date Range
            </label>
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-outline-variant bg-surface-container-lowest font-code px-2.5 py-1.5 rounded-sm focus:border-primary outline-none"
              />
              <span className="text-on-surface-variant">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-outline-variant bg-surface-container-lowest font-code px-2.5 py-1.5 rounded-sm focus:border-primary outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setToastMessage(`Filters applied for: ${startDate} to ${endDate}`)
            }
            className="bg-primary text-on-primary text-xs font-semibold px-4 py-2 rounded-sm hover:opacity-90 transition-opacity whitespace-nowrap h-[34px] cursor-pointer"
          >
            Apply Filter
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="bg-surface-container-highest text-primary text-xs font-semibold px-3 py-2 rounded-sm hover:bg-outline-variant transition-colors h-[34px] border border-outline-variant cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-primary text-on-primary border border-outline px-4 py-2.5 rounded-sm text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-secondary-container" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Units Sold */}
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-sm">
          <div className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
            Total Units Sold
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-primary font-code tracking-tight">
            {metrics.totalUnitsSold.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2 text-secondary text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+8.2% vs last period</span>
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-sm">
          <div className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
            Total Stock Value
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-primary font-code tracking-tight">
            {formatINR(metrics.totalStockValue)}
          </div>
          <div className="flex items-center gap-1 mt-2 text-on-surface-variant text-xs">
            <Boxes className="w-3.5 h-3.5 text-outline" />
            <span>Across warehouse zones</span>
          </div>
        </div>

        {/* Reorder Required */}
        <div className="bg-error-container border border-error p-4 rounded-sm text-on-error-container">
          <div className="text-xs font-bold mb-1 uppercase tracking-wider opacity-90">
            Items Requiring Reorder
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-code tracking-tight">
            {metrics.reorderCount}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Critical stock levels</span>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
        <div className="p-3.5 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-low">
          <h2 className="font-bold text-sm text-primary">
            Item Velocity & Movement Analysis
          </h2>
          <div className="relative w-full sm:w-64">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <select
              value={velocityFilter}
              onChange={(e) => setVelocityFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-sm text-xs font-medium text-on-surface outline-none"
            >
              <option value="All Items">All Items</option>
              <option value="Fast Moving Only">Fast Moving Only</option>
              <option value="Reorder Required">Reorder Required</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Item Code / Name</th>
                <th className="py-2.5 px-3 font-medium text-right">
                  Total Purchased (Qty)
                </th>
                <th className="py-2.5 px-3 font-medium text-right">
                  Total Sold (Qty)
                </th>
                <th className="py-2.5 px-3 font-medium text-right">
                  Current Stock
                </th>
                <th className="py-2.5 px-3 font-medium">Velocity</th>
                <th className="py-2.5 px-4 font-medium">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredItems.map((item) => {
                const isOrdered = orderedCodes.includes(item.code);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-surface-container-low transition-colors cursor-pointer ${
                      item.reorderRequired ? "bg-error-container/10" : ""
                    }`}
                  >
                    <td
                      onClick={() => handleOpenPOModal(item)}
                      className="py-3 px-4"
                    >
                      <div className="font-bold text-primary font-code">
                        {item.code}
                      </div>
                      <div className="text-on-surface-variant text-[11px]">
                        {item.name}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-code text-on-surface">
                      {item.totalPurchased.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-code font-bold text-primary">
                      {item.totalSold.toLocaleString()}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-code font-bold ${
                        item.reorderRequired ? "text-error" : "text-on-surface"
                      }`}
                    >
                      {item.currentStock.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-xs font-bold text-[10px] uppercase border ${
                          item.velocity === "Fast Moving"
                            ? "bg-secondary-container text-on-secondary-container border-secondary-container"
                            : "bg-surface-container-high text-on-surface border-outline-variant"
                        }`}
                      >
                        {item.velocity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.reorderRequired ? (
                        <div className="flex items-center gap-2">
                          <span className="text-error flex items-center gap-1 text-[11px] font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Reorder
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenPOModal(item)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-xs transition-all flex items-center gap-1 cursor-pointer ${
                              isOrdered
                                ? "bg-secondary text-on-secondary"
                                : "bg-primary text-on-primary hover:opacity-90"
                            }`}
                          >
                            {isOrdered ? (
                              <>
                                <Check className="w-3 h-3" /> Reordered
                              </>
                            ) : (
                              "Issue PO"
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenPOModal(item)}
                          className="text-on-surface-variant hover:text-primary text-[11px] font-medium underline cursor-pointer"
                        >
                          Replenish Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Purchase Order (PO) Modal */}
      {poItem && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-sm max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-outline-variant pb-3">
              <div>
                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Issue Purchase Order (PO)
                </h3>
                <p className="text-xs text-on-surface-variant font-code mt-0.5">
                  Item: {poItem.code} - {poItem.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPoItem(null)}
                className="text-on-surface-variant hover:text-primary cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPO} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Select Supplier
                  </label>
                  <input
                    type="text"
                    list="poSupplierOptions"
                    value={poSupplier}
                    onChange={(e) => setPoSupplier(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none"
                  />
                  <datalist id="poSupplierOptions">
                    <option value="Global Tech Supplies" />
                    <option value="Nexus Industries" />
                    <option value="Apex Parts Co." />
                    <option value="Prime Supplies" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    PO Date
                  </label>
                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Reorder Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={poQty}
                    onChange={(e) =>
                      setPoQty(parseInt(e.target.value, 10) || 1)
                    }
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Negotiated Unit Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={poRate}
                    onChange={(e) => setPoRate(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code"
                  />
                </div>
              </div>

              {/* Cost calculation banner */}
              <div className="bg-surface-container-low p-3 rounded-sm flex justify-between items-center text-xs font-code">
                <span className="text-on-surface-variant">
                  Estimated PO Total:
                </span>
                <span className="font-bold text-base text-primary">
                  {formatINR(poQty * (parseFloat(poRate) || 0))}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setPoItem(null)}
                  className="px-4 py-2 border border-outline-variant text-xs font-semibold rounded-sm hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-semibold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" /> Confirm & Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
