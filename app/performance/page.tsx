"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  FileCheck,
  Filter,
  ShieldCheck,
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

  // Comprehensive PO Modal State
  const [poItem, setPoItem] = useState<PerformanceItem | null>(null);
  const [poRef, setPoRef] = useState("");
  const [poSupplier, setPoSupplier] = useState("Global Tech Supplies");
  const [poQty, setPoQty] = useState<number>(500);
  const [poRate, setPoRate] = useState("9.20");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [poZone, setPoZone] = useState("Zone A - Bay 04");
  const [poPriority, setPoPriority] = useState<
    "Standard" | "Urgent" | "Critical Restock"
  >("Urgent");
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
    setPoRef(`PO-${Math.floor(100000 + Math.random() * 900000)}`);
    setPoQty(item.code === "PRD-8902" ? 1000 : 500);
    setPoRate(item.code === "PRD-8902" ? "45.00" : "9.20");
    setPoSupplier("Global Tech Supplies");
    setPoDate(new Date().toISOString().split("T")[0]);
    setPoZone("Zone A - Bay 04");
    setPoPriority(item.reorderRequired ? "Critical Restock" : "Standard");
  };

  const handleConfirmPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poItem) return;

    const rateNum = parseFloat(poRate) || 10;
    const totalCost = poQty * rateNum;

    // Log purchase inward record to ERP
    addPurchase({
      purchaseId: poRef || `PO-${Date.now().toString().slice(-6)}`,
      date: poDate,
      supplierName: poSupplier,
      items: [
        {
          id: `po-it-${Date.now()}`,
          itemName: poItem.name,
          batchNo: `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: "2027-12",
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
    if (!orderedCodes.includes(poItem.code)) {
      setOrderedCodes((prev) => [...prev, poItem.code]);
    }

    setToastMessage(
      `Purchase Order ${poRef} for ${poItem.name} (${poQty.toLocaleString()} units) issued to ${poSupplier}. Stock updated!`,
    );
    setTimeout(() => setToastMessage(null), 5000);
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

  // Calculated PO numbers
  const unitRateNum = parseFloat(poRate) || 0;
  const calculatedPoSubtotal = poQty * unitRateNum;
  const projectedStockAfterPO = poItem ? poItem.currentStock + poQty : 0;

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
              setToastMessage(
                `Filters applied for period: ${startDate} to ${endDate}`,
              )
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
        <div className="bg-primary text-on-primary border border-outline px-4 py-3 rounded-sm text-xs flex items-center gap-2.5 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-secondary-container shrink-0" />
          <span className="font-medium">{toastMessage}</span>
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
          <div>
            <h2 className="font-bold text-sm text-primary">
              Item Velocity & Movement Analysis
            </h2>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Review run-out velocity and trigger restock purchase orders
            </p>
          </div>
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
              <tr className="bg-surface-container-low border-b border-outline-variant font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-medium">Item Code / Name</th>
                <th className="py-3 px-3 font-medium text-right">
                  Total Purchased (Qty)
                </th>
                <th className="py-3 px-3 font-medium text-right">
                  Total Sold (Qty)
                </th>
                <th className="py-3 px-3 font-medium text-right">
                  Current Stock
                </th>
                <th className="py-3 px-3 font-medium">Velocity</th>
                <th className="py-3 px-4 font-medium">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredItems.map((item) => {
                const isOrdered = orderedCodes.includes(item.code);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-surface-container-low transition-colors ${
                      item.reorderRequired ? "bg-error-container/10" : ""
                    }`}
                  >
                    <td
                      onClick={() => handleOpenPOModal(item)}
                      className="py-3 px-4 cursor-pointer group"
                    >
                      <div className="font-bold text-primary font-code group-hover:underline">
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
                            : item.velocity === "Slow Moving"
                              ? "bg-surface-variant text-on-surface-variant border-outline-variant"
                              : "bg-surface-container-high text-on-surface border-outline-variant"
                        }`}
                      >
                        {item.velocity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.reorderRequired ? (
                        <div className="flex items-center gap-2.5">
                          <span className="text-error flex items-center gap-1 text-[11px] font-bold shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5" /> Reorder
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenPOModal(item)}
                            className={`px-3 py-1 text-[11px] font-bold rounded-xs transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer shrink-0 ${
                              isOrdered
                                ? "bg-secondary-container text-on-secondary-container border border-secondary hover:bg-secondary-container/80"
                                : "bg-primary text-on-primary hover:opacity-90"
                            }`}
                          >
                            {isOrdered ? (
                              <>
                                <Check className="w-3 h-3 text-secondary" /> PO
                                Issued
                              </>
                            ) : (
                              <>
                                <Truck className="w-3 h-3" /> Issue PO
                              </>
                            )}
                          </button>
                        </div>
                      ) : item.velocity === "Slow Moving" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant text-[11px] font-semibold">
                            Review
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenPOModal(item)}
                            className="text-on-surface-variant hover:text-primary text-[10px] underline cursor-pointer"
                          >
                            PO
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant text-[11px] font-medium">
                            Sufficient
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenPOModal(item)}
                            className="text-on-surface-variant hover:text-primary text-[10px] underline cursor-pointer"
                          >
                            + Restock
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redesigned Precision Wholesale Issue PO Modal */}
      {poItem && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-sm max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-outline-variant pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-sm bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                    PO
                  </span>
                  <h3 className="text-base font-bold text-primary">
                    Issue Purchase Order
                  </h3>
                  <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded-xs font-code font-bold text-primary border border-outline-variant">
                    {poRef}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Drafting supplier requisition & stock replenishment order
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPoItem(null)}
                className="text-on-surface-variant hover:text-primary cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form
              onSubmit={handleConfirmPO}
              className="space-y-4 text-xs flex-1 overflow-y-auto pr-1"
            >
              {/* Telemetry Strip Banner */}
              <div className="bg-surface-container-low p-3 rounded-sm border border-outline-variant grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                    Item Code
                  </span>
                  <span className="font-code font-bold text-primary">
                    {poItem.code}
                  </span>
                  <span className="text-[10px] text-on-surface-variant block truncate">
                    {poItem.name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                    Current Stock
                  </span>
                  <span
                    className={`font-code font-bold ${poItem.reorderRequired ? "text-error" : "text-primary"}`}
                  >
                    {poItem.currentStock.toLocaleString()} units
                  </span>
                  <span className="text-[10px] text-on-surface-variant block">
                    Warehouse Alpha
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                    Velocity
                  </span>
                  <span className="font-semibold text-secondary">
                    {poItem.velocity}
                  </span>
                  <span className="text-[10px] text-on-surface-variant block">
                    {poItem.totalSold.toLocaleString()} sold
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                    Status Alert
                  </span>
                  <span
                    className={`font-bold text-[11px] ${poItem.reorderRequired ? "text-error" : "text-primary"}`}
                  >
                    {poItem.reorderRequired
                      ? "CRITICAL RESTOCK"
                      : "NORMAL RESTOCK"}
                  </span>
                </div>
              </div>

              {/* Order Form Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Primary Supplier
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="text"
                        list="poSupplierOptions"
                        value={poSupplier}
                        onChange={(e) => setPoSupplier(e.target.value)}
                        required
                        className="w-full pl-8 pr-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none text-xs font-medium"
                      />
                    </div>
                    <datalist id="poSupplierOptions">
                      <option value="Global Tech Supplies" />
                      <option value="Nexus Industries" />
                      <option value="Apex Parts Co." />
                      <option value="Prime Supplies" />
                      <option value="Zenith Corp" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Expected Delivery Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="date"
                        value={poDate}
                        onChange={(e) => setPoDate(e.target.value)}
                        required
                        className="w-full pl-8 pr-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none text-xs font-code"
                      />
                    </div>
                  </div>
                </div>

                {/* Reorder Quantity & Steppers */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6">
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Reorder Quantity (Units)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={poQty}
                      onChange={(e) =>
                        setPoQty(parseInt(e.target.value, 10) || 1)
                      }
                      required
                      className="w-full px-3 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none text-sm font-bold font-code"
                    />
                  </div>

                  {/* Quick Quantity Presets */}
                  <div className="sm:col-span-6 flex gap-1">
                    {[250, 500, 1000, 2500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPoQty(preset)}
                        className={`flex-1 py-1.5 border text-[10px] font-semibold rounded-xs transition-colors cursor-pointer ${
                          poQty === preset
                            ? "bg-primary text-on-primary border-primary"
                            : "border-outline-variant bg-surface hover:bg-surface-container-high text-on-surface"
                        }`}
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Negotiated Rate (₹/unit)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={poRate}
                      onChange={(e) => setPoRate(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none text-xs font-code font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Receiving Rack Zone
                    </label>
                    <select
                      value={poZone}
                      onChange={(e) => setPoZone(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none text-xs font-medium"
                    >
                      <option value="Zone A - Bay 04">Zone A - Bay 04</option>
                      <option value="Zone B - Cold Storage">
                        Zone B - Cold Storage
                      </option>
                      <option value="Zone C - Hazardous">
                        Zone C - Hazardous
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Order Priority
                    </label>
                    <select
                      value={poPriority}
                      onChange={(e) =>
                        setPoPriority(
                          e.target.value as
                            | "Standard"
                            | "Urgent"
                            | "Critical Restock",
                        )
                      }
                      className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none text-xs font-bold text-primary"
                    >
                      <option value="Standard">
                        Standard (Ground Freight)
                      </option>
                      <option value="Urgent">Urgent (Express Delivery)</option>
                      <option value="Critical Restock">
                        Critical Restock (Priority)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial & Stock Impact Summary Card */}
              <div className="bg-surface-container-low p-3.5 rounded-sm border border-outline-variant space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">
                    Estimated PO Total:
                  </span>
                  <span className="text-lg font-bold text-primary font-code">
                    {formatINR(calculatedPoSubtotal)}
                  </span>
                </div>
                <div className="border-t border-outline-variant pt-2 flex justify-between items-center text-[11px] text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                    <span>
                      Post-Restock Projected Stock:{" "}
                      <strong className="text-primary font-code">
                        {projectedStockAfterPO.toLocaleString()} units
                      </strong>
                    </span>
                  </div>
                  <span className="text-secondary font-semibold">
                    Stock Safe Level
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-outline-variant shrink-0">
                <button
                  type="button"
                  onClick={() => setPoItem(null)}
                  className="px-4 py-2 border border-outline-variant text-xs font-semibold rounded-sm hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-semibold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" /> Issue & Transmit PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
