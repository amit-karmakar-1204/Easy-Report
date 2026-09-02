"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileCheck,
  Filter,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { formatINR, useERP } from "@/lib/store";

export default function ExpiryActionBoardPage() {
  const { generatePurchaseReturn, parties, purchases } = useERP();

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>(["exp-1", "exp-2"]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSupplier, setReturnSupplier] = useState("Global Tech Supplies");
  const [returnReason, setReturnReason] = useState("Past Shelf-Life Expiry");
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  // Supplier options from ERP
  const supplierOptions = useMemo(() => {
    const fromParties = parties?.map((p) => p.name) || [];
    const fromPurchases = purchases?.map((p) => p.supplierName) || [];
    const defaults = [
      "Global Tech Supplies",
      "Nexus Industries",
      "Apex Parts Co.",
      "Prime Supplies",
      "Zenith Corp",
    ];
    return Array.from(
      new Set([...fromParties, ...fromPurchases, ...defaults]),
    ).filter(Boolean);
  }, [parties, purchases]);

  // Modal keyboard listener & body scroll lock
  useEffect(() => {
    if (!showReturnModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowReturnModal(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const form = document.getElementById(
          "return-modal-form",
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
  }, [showReturnModal]);

  // Expired items dynamically derived from inventory
  const expiredItems = useMemo(() => {
    return inventory
      .filter(
        (i) =>
          i.status === "EXPIRED" ||
          (i.expiryDate && new Date(i.expiryDate) < new Date()),
      )
      .map((i) => ({
        id: i.id,
        name: i.name,
        batchCode: i.batchNo || "N/A",
        expiryDate: i.expiryDate || "N/A",
        stockQty: i.currentStock,
        rate: i.purchaseRate,
        estValue: i.currentStock * i.purchaseRate,
        category:
          i.category === "raw"
            ? "Raw Material"
            : i.category === "pkg"
              ? "Packaging"
              : "Finished Goods",
      }));
  }, [inventory]);

  const filteredItems = useMemo(() => {
    if (categoryFilter === "All") return expiredItems;
    return expiredItems.filter((i) => i.category === categoryFilter);
  }, [expiredItems, categoryFilter]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const handleOpenReturnModal = () => {
    if (selectedIds.length === 0) {
      alert(
        "Please select at least one expired item to generate purchase return.",
      );
      return;
    }
    setShowReturnModal(true);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const totalReturnValue = filteredItems
      .filter((i) => selectedIds.includes(i.id))
      .reduce((s, i) => s + i.estValue, 0);

    generatePurchaseReturn(selectedIds);

    setReturnSuccessMsg(
      `Debit Note DN-${Date.now().toString().slice(-6)} generated for ${
        selectedIds.length
      } items (${formatINR(totalReturnValue)}) returning to ${returnSupplier}. Items quarantined.`,
    );

    setShowReturnModal(false);
    setSelectedIds([]);
    setTimeout(() => {
      setReturnSuccessMsg(null);
    }, 6000);
  };

  const handleExportReport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Item Name,Batch Code,Expiry Date,Stock Qty,Est Value,Category"]
        .concat(
          filteredItems.map(
            (i) =>
              `"${i.name}","${i.batchCode}","${i.expiryDate}",${i.stockQty},${i.estValue},"${i.category}"`,
          ),
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `expired_items_report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedItemsList = filteredItems.filter((i) =>
    selectedIds.includes(i.id),
  );
  const selectedTotalVal = selectedItemsList.reduce(
    (s, i) => s + i.estValue,
    0,
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Expiry Action Board
            </h1>
            <p className="text-xs text-on-surface-variant">
              Manage expired and near-expiry wholesale items with batch
              quarantine
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportReport}
            className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-primary text-xs font-semibold rounded-sm hover:bg-surface-container-high transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
          <button
            type="button"
            onClick={handleOpenReturnModal}
            className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Generate Purchase Return (
            {selectedIds.length})
          </button>
        </div>
      </div>

      {/* Alert Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Critical Card */}
        <div className="bg-error-container/20 border border-error p-4 rounded-sm flex items-start gap-3 text-on-error-container">
          <ShieldAlert className="w-6 h-6 text-error shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-primary">
              Critical: {metrics.expiredItemsCount} Expired Items
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Immediate action required to remove these items from active stock
              and issue vendor return notes.
            </p>
          </div>
        </div>

        {/* Warning Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-on-surface">
              Warning: {metrics.nearExpiryCount} Near-Expiry
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Items expiring within the next 30 days. Consider price markdown
              promotions or priority billing.
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {returnSuccessMsg && (
        <div className="bg-secondary-container text-on-secondary-container border border-secondary-container px-4 py-3 rounded-sm text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p className="font-medium">{returnSuccessMsg}</p>
        </div>
      )}

      {/* Actionable Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-on-surface">
              Expired Stock List
            </h2>
            <span className="text-xs text-on-surface-variant">
              ({selectedIds.length} of {filteredItems.length} selected)
            </span>
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded-sm text-on-surface text-xs focus:border-primary outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Food & Bev">Food & Bev</option>
              <option value="Pharmaceuticals">Pharmaceuticals</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-surface-bright border-b border-outline-variant">
                <th className="p-3 font-bold text-on-surface-variant w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredItems.length &&
                      filteredItems.length > 0
                    }
                    onChange={handleToggleSelectAll}
                    aria-label="Select all expired items"
                    className="w-4 h-4 rounded-xs border-outline-variant text-primary focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3 font-bold text-on-surface-variant uppercase tracking-wider">
                  Item Name
                </th>
                <th className="p-3 font-bold text-on-surface-variant uppercase tracking-wider">
                  Batch Code
                </th>
                <th className="p-3 font-bold text-on-surface-variant uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="p-3 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Stock Qty
                </th>
                <th className="p-3 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Est. Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-secondary" />
                    <p className="font-semibold text-primary">
                      All expired stock cleared & returned!
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`hover:bg-surface-container-low transition-colors group cursor-pointer ${
                        isSelected ? "bg-surface-container-low/50" : ""
                      }`}
                    >
                      <td
                        className="p-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItem(item.id)}
                          aria-label={`Select ${item.name}`}
                          className="w-4 h-4 rounded-xs border-outline-variant text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-medium text-on-surface">
                        {item.name}
                      </td>
                      <td className="p-3 font-code text-on-surface-variant">
                        {item.batchCode}
                      </td>
                      <td className="p-3 font-medium text-error font-code">
                        {item.expiryDate}
                      </td>
                      <td className="p-3 font-code font-bold text-right text-on-surface">
                        {item.stockQty.toLocaleString()}
                      </td>
                      <td className="p-3 font-code font-bold text-right text-primary">
                        {formatINR(item.estValue)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot>
                <tr className="bg-surface-container-low border-t-2 border-outline-variant font-bold">
                  <td
                    colSpan={4}
                    className="p-3 text-right text-on-surface-variant"
                  >
                    Selected Items Value:
                  </td>
                  <td className="p-3 text-right font-code">
                    {selectedItemsList
                      .reduce((s, i) => s + i.stockQty, 0)
                      .toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-code text-error font-bold">
                    {formatINR(selectedTotalVal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Generate Purchase Return Confirmation Modal */}
      {showReturnModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReturnModal(false);
            }
          }}
          className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "576px" }}
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex flex-row items-start justify-between gap-4 border-b border-outline-variant px-5 py-3.5 bg-surface-container-low shrink-0">
              <div className="min-w-0 flex-1">
                <h3
                  id="return-modal-title"
                  className="text-base font-bold text-primary flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-error" /> Generate Purchase
                  Return
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Quarantine {selectedItemsList.length} items and issue supplier
                  debit voucher
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-code text-on-surface-variant bg-surface-container border border-outline-variant rounded">
                  ESC
                </span>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form
              id="return-modal-form"
              onSubmit={handleConfirmReturn}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="space-y-4 p-5 overflow-y-auto flex-1 text-xs">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Supplier / Vendor for Return{" "}
                    <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    list="vendorReturnList"
                    value={returnSupplier}
                    onChange={(e) => setReturnSupplier(e.target.value)}
                    required
                    placeholder="Select or enter supplier..."
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium text-xs text-on-surface"
                  />
                  <datalist id="vendorReturnList">
                    {supplierOptions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Reason for Return <span className="text-error">*</span>
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-medium text-xs text-on-surface"
                  >
                    <option value="Past Shelf-Life Expiry">
                      Past Shelf-Life Expiry
                    </option>
                    <option value="Damaged Seal / Packaging">
                      Damaged Seal / Packaging
                    </option>
                    <option value="Manufacturer Quality Recall">
                      Manufacturer Quality Recall
                    </option>
                    <option value="Short Expiry on Delivery">
                      Short Expiry on Delivery
                    </option>
                  </select>
                </div>

                {/* Quarantined Items list */}
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Quarantined Batch Items ({selectedItemsList.length})
                  </label>
                  <div className="border border-outline-variant rounded-sm p-2.5 bg-surface-container-low max-h-36 overflow-y-auto space-y-1.5 font-code">
                    {selectedItemsList.map((it) => (
                      <div
                        key={it.id}
                        className="flex justify-between items-center text-[11px] pb-1 border-b border-outline-variant/60 last:border-none last:pb-0"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-primary block truncate">
                            {it.name}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">
                            Batch: {it.batchCode} • {it.stockQty} pcs
                          </span>
                        </div>
                        <span className="font-bold text-error shrink-0">
                          {formatINR(it.estValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-surface-container-low p-3.5 rounded-sm border border-outline-variant flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">
                    Total Debit Note Value:
                  </span>
                  <span className="font-bold text-base text-primary font-code">
                    {formatINR(selectedTotalVal)}
                  </span>
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
                    to confirm
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-semibold rounded-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileCheck className="w-3.5 h-3.5" /> Confirm & Issue Debit
                    Note
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
