"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileCheck,
  FileText,
  Filter,
  Layers,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { formatINR, useERP } from "@/lib/store";
import type { PerformanceItem } from "@/lib/types";

export default function PerformanceReportPage() {
  const {
    metrics,
    performanceItems,
    reorderItem,
    addPurchase,
    inventory,
    purchases,
    parties,
  } = useERP();

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
  const [poDeliveryDate, setPoDeliveryDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
  );
  const [poZone, setPoZone] = useState("Zone A - Bay 04");
  const [poPriority, setPoPriority] = useState<
    "Standard" | "Urgent" | "Critical Restock"
  >("Urgent");
  const [poGSTRate, setPoGSTRate] = useState<number>(18);
  const [poNotes, setPoNotes] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Supplier suggestions from ERP database
  const supplierOptions = useMemo(() => {
    const fromParties = parties.map((p) => p.name);
    const fromPurchases = purchases.map((p) => p.supplierName);
    const defaults = [
      "Global Tech Supplies",
      "Nexus Industries",
      "Apex Parts Co.",
      "Prime Supplies",
      "Zenith Corp",
      "Alpha Distributions",
    ];
    return Array.from(
      new Set([...fromParties, ...fromPurchases, ...defaults]),
    ).filter(Boolean);
  }, [parties, purchases]);

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

    // Match inventory item for pricing and rack info
    const matched = inventory.find(
      (inv) =>
        inv.sku === item.code ||
        inv.name.toLowerCase() === item.name.toLowerCase(),
    );

    const initialRate = matched?.purchaseRate
      ? matched.purchaseRate.toFixed(2)
      : item.code === "PRD-8902"
        ? "45.00"
        : item.code === "PRD-6204"
          ? "9.20"
          : "15.00";
    setPoRate(initialRate);

    // Calculate smart recommended reorder volume
    const estimatedDaily = Math.max(1, Math.round(item.totalSold / 30));
    const suggestedQty = item.reorderRequired
      ? Math.max(250, estimatedDaily * 30 - item.currentStock)
      : 500;
    const roundedQty = Math.max(100, Math.ceil(suggestedQty / 50) * 50);
    setPoQty(roundedQty);

    const matchedPurchase = purchases.find((p) =>
      p.items.some(
        (pi) => pi.itemName.toLowerCase() === item.name.toLowerCase(),
      ),
    );
    setPoSupplier(matchedPurchase?.supplierName || "Global Tech Supplies");
    setPoDate(new Date().toISOString().split("T")[0]);

    // Expected ETA (+3 days)
    const eta = new Date();
    eta.setDate(eta.getDate() + 3);
    setPoDeliveryDate(eta.toISOString().split("T")[0]);

    setPoZone(matched?.rackLocation || "Zone A - Bay 04");
    setPoPriority(item.reorderRequired ? "Critical Restock" : "Standard");
    setPoGSTRate(18);
    setPoNotes("");
    setCopiedRef(false);
  };

  // Keyboard shortcut listener & body scroll lock
  useEffect(() => {
    if (!poItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPoItem(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const form = document.getElementById(
          "po-modal-form",
        ) as HTMLFormElement | null;
        if (form) {
          form.requestSubmit();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [poItem]);

  const handleCopyRef = () => {
    if (!poRef) return;
    navigator.clipboard.writeText(poRef);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const setDeliveryOffsetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setPoDeliveryDate(d.toISOString().split("T")[0]);
  };

  const handleConfirmPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poItem || isSubmitting) return;

    setIsSubmitting(true);
    const rateNum = Math.max(0, parseFloat(poRate) || 10);
    const subtotal = poQty * rateNum;
    const tax = subtotal * (poGSTRate / 100);
    const totalCost = subtotal + tax;

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

    reorderItem(poItem.code, poQty);
    if (!orderedCodes.includes(poItem.code)) {
      setOrderedCodes((prev) => [...prev, poItem.code]);
    }

    setToastMessage(
      `Purchase Order ${poRef} for ${poItem.name} (${poQty.toLocaleString()} units @ ₹${rateNum.toFixed(2)}) issued to ${poSupplier}. Stock updated!`,
    );
    setTimeout(() => setToastMessage(null), 6000);
    setIsSubmitting(false);
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

  // Calculated PO numbers & Live Analytics
  const unitRateNum = Math.max(0, parseFloat(poRate) || 0);
  const calculatedPoSubtotal = poQty * unitRateNum;
  const calculatedGST = calculatedPoSubtotal * (poGSTRate / 100);
  const calculatedGrandTotal = calculatedPoSubtotal + calculatedGST;
  const projectedStockAfterPO = poItem ? poItem.currentStock + poQty : 0;

  const estimatedDailySales = poItem
    ? Math.max(1, Math.round(poItem.totalSold / 30))
    : 10;
  const currentRunwayDays = poItem
    ? Math.floor(poItem.currentStock / estimatedDailySales)
    : 0;
  const projectedRunwayDays = Math.floor(
    projectedStockAfterPO / estimatedDailySales,
  );
  const recommendedBufferQty = poItem
    ? Math.max(
        100,
        Math.ceil((estimatedDailySales * 30 - poItem.currentStock) / 50) * 50,
      )
    : 500;

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

      {/* Enterprise-Grade Reorder & Issue PO Modal */}
      {poItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="po-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPoItem(null);
            }
          }}
          className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "672px" }}
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex flex-row items-start justify-between gap-4 border-b border-outline-variant px-5 py-3.5 bg-surface-container-low shrink-0">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-sm bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-xs shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      id="po-modal-title"
                      className="text-base font-bold text-primary tracking-tight"
                    >
                      Issue Purchase Order
                    </h3>
                    <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant px-2 py-0.5 rounded-xs">
                      <span className="text-[11px] font-code font-bold text-primary">
                        {poRef}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyRef}
                        title="Copy PO Ref"
                        className="text-on-surface-variant hover:text-primary p-0.5 cursor-pointer rounded"
                      >
                        {copiedRef ? (
                          <Check className="w-3 h-3 text-secondary" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Draft requisition & restock order for vendor dispatch
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-code text-on-surface-variant bg-surface-container border border-outline-variant rounded">
                  ESC
                </span>
                <button
                  type="button"
                  onClick={() => setPoItem(null)}
                  className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form
              id="po-modal-form"
              onSubmit={handleConfirmPO}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="space-y-4 p-5 overflow-y-auto flex-1 text-xs">
                {/* Item Intelligence & Stock Telemetry Card */}
                <div className="bg-surface-container-low p-3.5 rounded-sm border border-outline-variant">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
                        Item Details
                      </span>
                      <span className="font-code font-bold text-primary text-xs block truncate">
                        {poItem.code}
                      </span>
                      <span className="text-[11px] text-on-surface-variant block truncate">
                        {poItem.name}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
                        Current Stock
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-code font-bold text-sm ${
                            poItem.reorderRequired
                              ? "text-error"
                              : "text-primary"
                          }`}
                        >
                          {poItem.currentStock.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          units
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant block">
                        ~{currentRunwayDays}d runway remaining
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
                        Sales Velocity
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded-xs font-bold text-[10px] uppercase border ${
                          poItem.velocity === "Fast Moving"
                            ? "bg-secondary-container text-on-secondary-container border-secondary-container"
                            : "bg-surface-variant text-on-surface-variant border-outline-variant"
                        }`}
                      >
                        {poItem.velocity}
                      </span>
                      <span className="text-[10px] text-on-surface-variant block mt-0.5">
                        {poItem.totalSold.toLocaleString()} total sold
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
                        Replenishment Status
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-1.5 py-0.5 rounded-xs ${
                          poItem.reorderRequired
                            ? "bg-error-container text-on-error-container"
                            : "bg-surface-container-high text-on-surface"
                        }`}
                      >
                        {poItem.reorderRequired ? (
                          <>
                            <AlertTriangle className="w-3 h-3" /> Critical Stock
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" /> Healthy Stock
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-on-surface-variant block mt-0.5">
                        Target Buffer: 30 Days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logistics & Supplier Information */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-on-surface-variant" />
                    Supplier & Logistics
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Supplier */}
                    <div>
                      <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                        Primary Vendor / Supplier{" "}
                        <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                        <input
                          type="text"
                          list="poSupplierOptions"
                          value={poSupplier}
                          onChange={(e) => setPoSupplier(e.target.value)}
                          required
                          placeholder="Search or enter vendor name..."
                          className="w-full pl-8 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs font-medium text-on-surface"
                        />
                      </div>
                      <datalist id="poSupplierOptions">
                        {supplierOptions.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>

                    {/* Order Date */}
                    <div>
                      <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                        PO Order Date
                      </label>
                      <div className="relative">
                        <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                        <input
                          type="date"
                          value={poDate}
                          onChange={(e) => setPoDate(e.target.value)}
                          required
                          className="w-full pl-8 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs font-code text-on-surface"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Delivery ETA with quick shortcuts */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-on-surface-variant uppercase text-[10px]">
                          Expected Delivery (ETA)
                        </label>
                      </div>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                        <input
                          type="date"
                          value={poDeliveryDate}
                          onChange={(e) => setPoDeliveryDate(e.target.value)}
                          required
                          className="w-full pl-8 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs font-code text-on-surface"
                        />
                      </div>
                      <div className="flex gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => setDeliveryOffsetDays(2)}
                          className="px-1.5 py-0.5 text-[9px] bg-surface-container border border-outline-variant hover:bg-surface-container-high rounded-xs text-on-surface-variant cursor-pointer"
                        >
                          +2d
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryOffsetDays(5)}
                          className="px-1.5 py-0.5 text-[9px] bg-surface-container border border-outline-variant hover:bg-surface-container-high rounded-xs text-on-surface-variant cursor-pointer"
                        >
                          +5d
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryOffsetDays(10)}
                          className="px-1.5 py-0.5 text-[9px] bg-surface-container border border-outline-variant hover:bg-surface-container-high rounded-xs text-on-surface-variant cursor-pointer"
                        >
                          +10d
                        </button>
                      </div>
                    </div>

                    {/* Receiving Rack Zone */}
                    <div>
                      <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                        Receiving Rack Zone
                      </label>
                      <select
                        value={poZone}
                        onChange={(e) => setPoZone(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs font-medium text-on-surface"
                      >
                        <option value="Zone A - Bay 04">
                          Zone A - Bay 04 (General)
                        </option>
                        <option value="Zone B - Cold Storage">
                          Zone B - Cold Storage (Perishables)
                        </option>
                        <option value="Zone C - Heavy Bulk">
                          Zone C - Heavy Bulk
                        </option>
                        <option value="Main Hub - Receiving 01">
                          Main Hub - Receiving 01
                        </option>
                      </select>
                    </div>

                    {/* Restock Priority */}
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
                        className={`w-full px-2.5 py-1.5 border rounded-sm outline-none text-xs font-bold ${
                          poPriority === "Critical Restock"
                            ? "border-error text-error bg-error-container/20"
                            : poPriority === "Urgent"
                              ? "border-secondary text-secondary bg-secondary-container/20"
                              : "border-outline-variant text-primary bg-surface-container-lowest"
                        }`}
                      >
                        <option value="Standard">
                          Standard (Ground Freight)
                        </option>
                        <option value="Urgent">Urgent (Express Courier)</option>
                        <option value="Critical Restock">
                          Critical Restock (Air Priority)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reorder Quantity & Pricing Configuration */}
                <div className="space-y-3 pt-1">
                  <div className="text-[11px] font-bold text-primary uppercase tracking-wider border-b border-outline-variant pb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-on-surface-variant" />
                      Order Volume & Purchase Rate
                    </div>
                    {poItem.reorderRequired && (
                      <button
                        type="button"
                        onClick={() => setPoQty(recommendedBufferQty)}
                        className="text-[10px] font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        Apply Optimal Restock (
                        {recommendedBufferQty.toLocaleString()} units)
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    {/* Quantity Input with Steppers */}
                    <div className="sm:col-span-6 space-y-1.5">
                      <label className="block font-bold text-on-surface-variant uppercase text-[10px]">
                        Reorder Quantity (Units){" "}
                        <span className="text-error">*</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setPoQty((prev) => Math.max(50, prev - 100))
                          }
                          className="px-2.5 py-1.5 border border-outline-variant bg-surface-container hover:bg-surface-container-high rounded-sm text-on-surface cursor-pointer font-bold"
                          title="Decrease by 100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={isNaN(poQty) ? "" : poQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setPoQty(isNaN(val) ? 0 : Math.max(1, val));
                          }}
                          required
                          className="w-full px-3 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-sm font-bold font-code text-center text-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setPoQty((prev) => prev + 100)}
                          className="px-2.5 py-1.5 border border-outline-variant bg-surface-container hover:bg-surface-container-high rounded-sm text-on-surface cursor-pointer font-bold"
                          title="Increase by 100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Quantity Presets */}
                      <div className="flex gap-1 pt-0.5">
                        {[100, 250, 500, 1000, 2500].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setPoQty(preset)}
                            className={`flex-1 py-1 border text-[10px] font-semibold rounded-xs transition-colors cursor-pointer ${
                              poQty === preset
                                ? "bg-primary text-on-primary border-primary font-bold"
                                : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface"
                            }`}
                          >
                            {preset >= 1000 ? `${preset / 1000}k` : preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rate & Tax Configuration */}
                    <div className="sm:col-span-6 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1.5">
                          Unit Rate (₹) <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={poRate}
                            onChange={(e) => setPoRate(e.target.value)}
                            required
                            className="w-full pl-6 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs font-code font-bold text-primary"
                          />
                        </div>
                        <span className="text-[10px] text-on-surface-variant block mt-1">
                          Est. MRP: ₹{(unitRateNum * 1.3).toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1.5">
                          Tax / GST Rate
                        </label>
                        <select
                          value={poGSTRate}
                          onChange={(e) =>
                            setPoGSTRate(parseInt(e.target.value, 10))
                          }
                          className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs font-medium text-on-surface"
                        >
                          <option value={18}>18% Standard GST</option>
                          <option value={12}>12% GST</option>
                          <option value={5}>5% GST</option>
                          <option value={0}>0% Tax Exempt</option>
                        </select>
                        <span className="text-[10px] text-on-surface-variant block mt-1">
                          Tax: {formatINR(calculatedGST)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial & Stock Impact Projection Card */}
                <div className="bg-surface-container-low p-4 rounded-sm border border-outline-variant space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-outline-variant pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                        Estimated Purchase Order Total
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-bold text-primary font-code">
                          {formatINR(calculatedGrandTotal)}
                        </span>
                        {poGSTRate > 0 && (
                          <span className="text-[10px] text-on-surface-variant">
                            (Subtotal {formatINR(calculatedPoSubtotal)} +{" "}
                            {poGSTRate}% GST)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-secondary-container/40 text-on-secondary-container px-2.5 py-1 rounded-xs border border-secondary/30">
                      <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
                      <span className="text-[11px] font-semibold">
                        Safe Inventory Buffer
                      </span>
                    </div>
                  </div>

                  {/* Stock Runway Projection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span>Projected Stock Post-Inward:</span>
                        <div className="font-code font-bold text-primary text-xs">
                          {projectedStockAfterPO.toLocaleString()} units
                          <span className="text-secondary font-normal ml-1">
                            (+{poQty.toLocaleString()} units inward)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span>Estimated Buffer Runway:</span>
                        <div className="font-code font-bold text-primary text-xs">
                          ~{projectedRunwayDays} days of inventory
                          <span className="text-on-surface-variant font-normal ml-1">
                            (@ {estimatedDailySales} units/day)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Requisition Notes */}
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Requisition Notes / Transmittal Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="e.g. Priority dispatch requested via Air Cargo; Attn: Warehouse Bay 04"
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs placeholder:text-on-surface-variant/50 text-on-surface"
                  />
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="border-t border-outline-variant bg-surface-container-low px-5 py-3 flex flex-wrap justify-between items-center gap-3 shrink-0">
                <div className="text-[11px] text-on-surface-variant hidden sm:flex items-center gap-2">
                  <span>
                    Press{" "}
                    <kbd className="px-1 py-0.5 font-code bg-surface-container border border-outline-variant rounded text-[10px]">
                      Ctrl
                    </kbd>
                    +
                    <kbd className="px-1 py-0.5 font-code bg-surface-container border border-outline-variant rounded text-[10px]">
                      Enter
                    </kbd>{" "}
                    to issue
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setPoItem(null)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-semibold rounded-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || poQty <= 0 || unitRateNum <= 0}
                    className="px-5 py-2 bg-primary text-on-primary text-xs font-semibold rounded-sm hover:opacity-90 active:scale-98 transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileCheck className="w-4 h-4" />
                    {isSubmitting ? "Transmitting..." : "Issue & Transmit PO"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
