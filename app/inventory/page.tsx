"use client";

import {
  ArrowLeft,
  Boxes,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileEdit,
  Filter,
  Layers,
  MapPin,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { formatINR, useERP } from "@/lib/store";
import type { InventoryItem } from "@/lib/types";

export default function LiveInventoryGridPage() {
  const { inventory, updateInventoryItem } = useERP();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [rackFilter, setRackFilter] = useState("");

  // Editing state for inventory modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<"stock" | "pricing" | "batch">(
    "stock",
  );
  const [editStock, setEditStock] = useState<number>(0);
  const [editRack, setEditRack] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editPurchaseRate, setEditPurchaseRate] = useState<string>("");
  const [editSalePrice, setEditSalePrice] = useState<string>("");
  const [editMrp, setEditMrp] = useState<string>("");
  const [editAdjustmentReason, setEditAdjustmentReason] = useState(
    "Physical Count Audit",
  );
  const [editStatus, setEditStatus] = useState<
    "OPTIMAL" | "LOW" | "CRITICAL" | "EXPIRED"
  >("OPTIMAL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSku, setCopiedSku] = useState(false);

  // Keyboard shortcut listener & body scroll lock
  useEffect(() => {
    if (!editingItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingItem(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const form = document.getElementById(
          "inventory-edit-form",
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
  }, [editingItem]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNo.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = !categoryFilter || item.category === categoryFilter;
      const matchRack = !rackFilter || item.rackLocation.includes(rackFilter);

      return matchQuery && matchCategory && matchRack;
    });
  }, [inventory, searchQuery, categoryFilter, rackFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setRackFilter("");
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setActiveTab("stock");
    setEditStock(item.currentStock);
    setEditRack(item.rackLocation);
    setEditBatch(item.batchNo);
    setEditExpiry(item.expiryDate);
    setEditPurchaseRate(item.purchaseRate.toString());
    setEditSalePrice(item.salePrice.toString());
    setEditMrp(item.mrp.toString());
    setEditStatus(item.status);
    setEditAdjustmentReason("Physical Count Audit");
    setCopiedSku(false);
  };

  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleSaveItemEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const salePriceNum = parseFloat(editSalePrice) || editingItem.salePrice;
    const purchaseRateNum =
      parseFloat(editPurchaseRate) || editingItem.purchaseRate;
    const mrpNum = parseFloat(editMrp) || editingItem.mrp;

    updateInventoryItem(editingItem.id, {
      currentStock: editStock,
      rackLocation: editRack,
      batchNo: editBatch,
      expiryDate: editExpiry,
      purchaseRate: purchaseRateNum,
      salePrice: salePriceNum,
      mrp: mrpNum,
      status: editStatus,
    });

    setToastMessage(
      `Item ${editingItem.sku} (${editingItem.name}) updated successfully!`,
    );
    setTimeout(() => setToastMessage(null), 3000);
    setEditingItem(null);
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "SKU,Item Name,Category,Rack Location,Batch No,Expiry Date,Current Stock,Unit,Purchase Rate,Status",
      ]
        .concat(
          filteredInventory.map(
            (i) =>
              `"${i.sku}","${i.name}","${i.category}","${i.rackLocation}","${i.batchNo}","${i.expiryDate}",${i.currentStock},"${i.unit}",${i.purchaseRate},"${i.status}"`,
          ),
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `inventory_status_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
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
              Live Inventory Status (Stock Status)
            </h1>
            <p className="text-xs text-on-surface-variant">
              Real-time tracking of warehouse assets, racks, and batch
              compliance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-sm hover:bg-outline-variant transition-colors flex items-center gap-1.5 border border-outline-variant cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <Link
            href="/purchase"
            className="px-3.5 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Receive Stock
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-primary text-on-primary border border-outline px-4 py-2.5 rounded-sm text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-secondary-container" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 bg-surface-bright border border-outline-variant rounded-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filters
        </div>

        <div className="flex flex-1 flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Item Name, SKU, or Batch..."
              className="w-full h-8 pl-8 pr-3 bg-surface border border-outline-variant rounded-sm text-xs focus:border-primary outline-none text-on-surface"
            />
          </div>

          <div className="w-full sm:w-44">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-8 px-2.5 bg-surface border border-outline-variant rounded-sm text-xs focus:border-primary outline-none text-on-surface"
            >
              <option value="">All Categories</option>
              <option value="raw">Raw Materials</option>
              <option value="pkg">Packaging</option>
              <option value="fin">Finished Goods</option>
            </select>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={rackFilter}
              onChange={(e) => setRackFilter(e.target.value)}
              className="w-full h-8 px-2.5 bg-surface border border-outline-variant rounded-sm text-xs focus:border-primary outline-none text-on-surface"
            >
              <option value="">All Racks</option>
              <option value="Z-A">Zone A - General Storage</option>
              <option value="Z-B">Zone B - Cold Storage</option>
              <option value="Z-C">Zone C - Hazardous / Chemical</option>
            </select>
          </div>
        </div>

        {(searchQuery || categoryFilter || rackFilter) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-3 h-8 bg-surface border border-outline-variant text-on-surface text-xs font-semibold rounded-sm hover:bg-surface-container-highest transition-colors shrink-0 cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Data Grid Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4 font-bold text-on-surface border-r border-outline-variant w-[280px]">
                  Item Details
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface border-r border-outline-variant w-[120px] text-right">
                  Current Stock
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface border-r border-outline-variant w-[160px]">
                  Rack Location
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface border-r border-outline-variant">
                  Batch No.
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface border-r border-outline-variant w-[120px]">
                  Expiry
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface w-[110px] text-center">
                  Status
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface w-[60px] text-center">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-outline" />
                    <p className="font-semibold">No inventory assets matched</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenEdit(item)}
                    className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4 border-r border-outline-variant">
                      <div className="font-medium text-primary text-xs group-hover:underline">
                        {item.name}
                      </div>
                      <div className="text-on-surface-variant text-[10px] font-code mt-0.5">
                        SKU: {item.sku}
                      </div>
                    </td>
                    <td
                      className={`py-2.5 px-3 border-r border-outline-variant text-right font-bold font-code ${
                        item.status === "CRITICAL" || item.status === "EXPIRED"
                          ? "text-error"
                          : item.status === "LOW"
                            ? "text-amber-600"
                            : "text-on-surface"
                      }`}
                    >
                      {item.currentStock.toLocaleString()} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 border-r border-outline-variant text-on-surface-variant font-code">
                      {item.rackLocation}
                    </td>
                    <td className="py-2.5 px-3 border-r border-outline-variant text-on-surface-variant font-code">
                      {item.batchNo}
                    </td>
                    <td
                      className={`py-2.5 px-3 border-r border-outline-variant font-code ${
                        item.status === "EXPIRED"
                          ? "text-error font-bold"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {item.expiryDate}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-bold tracking-wide border ${
                          item.status === "OPTIMAL"
                            ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6]"
                            : item.status === "LOW"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : item.status === "CRITICAL"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-error-container text-on-error-container border-error"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(item);
                        }}
                        className="text-on-surface-variant hover:text-primary p-1 rounded-sm cursor-pointer"
                        title="Adjust Stock / Edit Item"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="bg-surface-container-low border-t border-outline-variant p-3 flex justify-between items-center text-xs text-on-surface-variant">
          <span>
            Showing {filteredInventory.length} of {inventory.length} total
            inventory items
          </span>
          <span className="font-code font-semibold text-primary">
            Warehouse Alpha Grid Active
          </span>
        </div>
      </div>

      {/* Advanced Edit Item & Stock Adjustment Modal */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inventory-edit-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingItem(null);
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
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="inventory-edit-title"
                    className="text-base font-bold text-primary flex items-center gap-2"
                  >
                    <FileEdit className="w-4 h-4 text-primary" /> Adjust Stock & Edit Master
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopySku(editingItem.sku)}
                    className="px-2 py-0.5 text-[11px] font-code bg-surface-container border border-outline-variant rounded hover:bg-surface-container-high transition-colors flex items-center gap-1 cursor-pointer text-primary"
                    title="Click to copy SKU"
                  >
                    {editingItem.sku}
                    {copiedSku ? (
                      <Check className="w-3 h-3 text-secondary" />
                    ) : (
                      <Copy className="w-3 h-3 text-on-surface-variant" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                  {editingItem.name} •{" "}
                  <span className="capitalize font-semibold text-primary">
                    {editingItem.category === "raw"
                      ? "Raw Material"
                      : editingItem.category === "pkg"
                        ? "Packaging Material"
                        : "Finished Good"}
                  </span>{" "}
                  ({editingItem.unit})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-code text-on-surface-variant bg-surface-container border border-outline-variant rounded">
                  ESC
                </span>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Segmented Navigation Tabs */}
            <div className="flex border-b border-outline-variant bg-surface-container-low/60 px-5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("stock")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "stock"
                    ? "border-primary text-primary bg-surface-container-lowest"
                    : "border-transparent text-on-surface-variant hover:text-primary"
                }`}
              >
                <Boxes className="w-3.5 h-3.5" /> Stock & Location
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pricing")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "pricing"
                    ? "border-primary text-primary bg-surface-container-lowest"
                    : "border-transparent text-on-surface-variant hover:text-primary"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Pricing & Margins
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("batch")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "batch"
                    ? "border-primary text-primary bg-surface-container-lowest"
                    : "border-transparent text-on-surface-variant hover:text-primary"
                }`}
              >
                <Tag className="w-3.5 h-3.5" /> Batch & Expiry
              </button>
            </div>

            {/* Modal Body Form */}
            <form
              id="inventory-edit-form"
              onSubmit={handleSaveItemEdit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="space-y-4 p-5 overflow-y-auto flex-1 text-xs">
                {activeTab === "stock" && (
                  <div className="space-y-4">
                    {/* Stock Count Banner & Steppers */}
                    <div className="bg-surface-container-low p-3.5 rounded-sm border border-outline-variant space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                            Stock On Hand ({editingItem.unit})
                          </span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl font-bold font-code text-primary">
                              {editStock.toLocaleString()} {editingItem.unit}
                            </span>
                            {editStock !== editingItem.currentStock && (
                              <span
                                className={`text-xs font-bold font-code px-1.5 py-0.5 rounded ${
                                  editStock > editingItem.currentStock
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : "bg-error-container text-on-error-container"
                                }`}
                              >
                                {editStock > editingItem.currentStock ? "+" : ""}
                                {editStock - editingItem.currentStock} {editingItem.unit}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Direct input */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-on-surface-variant">
                            New Total:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editStock}
                            onChange={(e) =>
                              setEditStock(
                                Math.max(0, parseInt(e.target.value, 10) || 0),
                              )
                            }
                            className="w-24 px-2 py-1 bg-surface-container-lowest border border-outline-variant rounded font-code font-bold text-sm text-primary text-right outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* Quick Stepper Pills */}
                      <div className="pt-2 border-t border-outline-variant/60">
                        <span className="text-[10px] text-on-surface-variant font-semibold uppercase block mb-1.5">
                          Quick Adjustment Increments:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[-100, -50, -10, -1, 1, 10, 50, 100].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() =>
                                setEditStock((prev) =>
                                  Math.max(0, prev + step),
                                )
                              }
                              className={`px-2.5 py-1 font-code text-xs font-semibold rounded-xs border transition-colors cursor-pointer ${
                                step > 0
                                  ? "border-secondary/40 bg-secondary-container/20 text-secondary hover:bg-secondary-container/40"
                                  : "border-error/40 bg-error-container/20 text-error hover:bg-error-container/40"
                              }`}
                            >
                              {step > 0 ? `+${step}` : step}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setEditStock(editingItem.currentStock)}
                            className="px-2 py-1 text-[11px] font-semibold text-on-surface-variant border border-outline-variant bg-surface-container hover:bg-surface-container-high rounded-xs ml-auto cursor-pointer"
                          >
                            Reset ({editingItem.currentStock})
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Adjustment Audit Reason
                        </label>
                        <select
                          value={editAdjustmentReason}
                          onChange={(e) =>
                            setEditAdjustmentReason(e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-medium text-xs text-on-surface"
                        >
                          <option value="Physical Count Audit">
                            Physical Count Audit Variance
                          </option>
                          <option value="Warehouse Damage / Spoilage">
                            Warehouse Damage / Spoilage
                          </option>
                          <option value="Internal Store Consumption">
                            Internal Store Consumption
                          </option>
                          <option value="Inward Receipt Correction">
                            Inward Receipt Correction
                          </option>
                          <option value="Supplier Return / Defect">
                            Supplier Return / Defect
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Status Classification <span className="text-error">*</span>
                        </label>
                        <select
                          value={editStatus}
                          onChange={(e) =>
                            setEditStatus(
                              e.target.value as
                                | "OPTIMAL"
                                | "LOW"
                                | "CRITICAL"
                                | "EXPIRED",
                            )
                          }
                          className={`w-full px-2.5 py-1.5 border rounded-sm outline-none font-bold text-xs ${
                            editStatus === "OPTIMAL"
                              ? "border-secondary text-secondary bg-secondary-container/20"
                              : editStatus === "LOW"
                                ? "border-amber-500 text-amber-700 bg-amber-50"
                                : "border-error text-error bg-error-container/20"
                          }`}
                        >
                          <option value="OPTIMAL">OPTIMAL (Healthy Stock)</option>
                          <option value="LOW">LOW (Approaching Reorder)</option>
                          <option value="CRITICAL">CRITICAL (Action Required)</option>
                          <option value="EXPIRED">EXPIRED (Quarantine)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px]">
                          Warehouse Rack / Bay / Shelf Location <span className="text-error">*</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={editRack}
                        onChange={(e) => setEditRack(e.target.value)}
                        required
                        placeholder="e.g. Z-A / R-04 / S-02"
                        className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code text-xs text-on-surface"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "pricing" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Purchase Rate / Cost (₹) <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editPurchaseRate}
                            onChange={(e) => setEditPurchaseRate(e.target.value)}
                            required
                            className="w-full pl-6 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Selling Price (₹) <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editSalePrice}
                            onChange={(e) => setEditSalePrice(e.target.value)}
                            required
                            className="w-full pl-6 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code font-bold text-xs text-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Maximum Retail Price MRP (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editMrp}
                            onChange={(e) => setEditMrp(e.target.value)}
                            className="w-full pl-6 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code text-xs text-on-surface"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial Performance Analytics Card */}
                    {(() => {
                      const cost = parseFloat(editPurchaseRate) || 0;
                      const sale = parseFloat(editSalePrice) || 0;
                      const unitProfit = sale - cost;
                      const marginPct = sale > 0 ? (unitProfit / sale) * 100 : 0;
                      const totalValuation = editStock * cost;

                      return (
                        <div className="bg-surface-container-low p-4 rounded-sm border border-outline-variant space-y-3">
                          <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2">
                            <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-secondary" /> Profit Margin & Asset Valuation
                            </span>
                            <span
                              className={`text-xs font-bold font-code px-2 py-0.5 rounded ${
                                marginPct >= 30
                                  ? "bg-secondary-container text-on-secondary-container"
                                  : marginPct >= 15
                                    ? "bg-primary-container text-on-primary-container"
                                    : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {marginPct.toFixed(1)}% Gross Margin
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-surface-container-lowest p-2.5 rounded-sm border border-outline-variant/40">
                              <span className="text-[10px] text-on-surface-variant block uppercase font-medium">
                                Profit / Unit
                              </span>
                              <span className="font-bold font-code text-secondary text-sm">
                                {formatINR(unitProfit)}
                              </span>
                            </div>
                            <div className="bg-surface-container-lowest p-2.5 rounded-sm border border-outline-variant/40">
                              <span className="text-[10px] text-on-surface-variant block uppercase font-medium">
                                Mark-Up Rate
                              </span>
                              <span className="font-bold font-code text-primary text-sm">
                                {cost > 0
                                  ? ((unitProfit / cost) * 100).toFixed(1)
                                  : "0.0"}
                                %
                              </span>
                            </div>
                            <div className="bg-surface-container-lowest p-2.5 rounded-sm border border-outline-variant/40">
                              <span className="text-[10px] text-on-surface-variant block uppercase font-medium">
                                Holding Asset Value
                              </span>
                              <span className="font-bold font-code text-primary text-sm">
                                {formatINR(totalValuation)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeTab === "batch" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block font-bold text-on-surface-variant uppercase text-[10px]">
                            Batch Number <span className="text-error">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditBatch(
                                `BCH-${Date.now().toString().slice(-4)}`,
                              )
                            }
                            className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" /> Auto Batch
                          </button>
                        </div>
                        <input
                          type="text"
                          value={editBatch}
                          onChange={(e) => setEditBatch(e.target.value)}
                          required
                          className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code text-xs text-on-surface"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Expiry Date <span className="text-error">*</span>
                        </label>
                        <input
                          type="date"
                          value={editExpiry}
                          onChange={(e) => setEditExpiry(e.target.value)}
                          required
                          className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code text-xs text-on-surface"
                        />
                      </div>
                    </div>

                    {/* Expiry Health Status indicator */}
                    {(() => {
                      if (!editExpiry) return null;
                      const expiryTime = new Date(editExpiry).getTime();
                      const nowTime = new Date().getTime();
                      const daysLeft = Math.ceil(
                        (expiryTime - nowTime) / (1000 * 60 * 60 * 24),
                      );

                      return (
                        <div
                          className={`p-3 rounded-sm border flex justify-between items-center text-xs ${
                            daysLeft < 0
                              ? "bg-error-container/20 border-error text-error"
                              : daysLeft < 90
                                ? "bg-amber-50 border-amber-500 text-amber-800"
                                : "bg-surface-container-low border-outline-variant text-on-surface"
                          }`}
                        >
                          <div>
                            <span className="font-bold block">
                              {daysLeft < 0
                                ? "BATCH IS EXPIRED"
                                : daysLeft < 90
                                  ? "NEAR EXPIRY (Action Required)"
                                  : "HEALTHY SHELF-LIFE"}
                            </span>
                            <span className="text-[11px] opacity-80">
                              {daysLeft < 0
                                ? `Expired ${Math.abs(daysLeft)} days ago`
                                : `${daysLeft} days remaining until shelf expiry`}
                            </span>
                          </div>
                          <span className="font-code font-bold text-sm">
                            {editExpiry}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
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
                    to save
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-semibold rounded-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Item Changes
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
