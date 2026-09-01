"use client";

import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Download,
  FileEdit,
  Filter,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useMemo, useState } from "react";
import { useERP } from "@/lib/store";
import type { InventoryItem } from "@/lib/types";

export default function LiveInventoryGridPage() {
  const { inventory, updateInventoryItem } = useERP();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [rackFilter, setRackFilter] = useState("");

  // Editing state for inventory modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editRack, setEditRack] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editSalePrice, setEditSalePrice] = useState<string>("");
  const [editStatus, setEditStatus] = useState<
    "OPTIMAL" | "LOW" | "CRITICAL" | "EXPIRED"
  >("OPTIMAL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setEditStock(item.currentStock);
    setEditRack(item.rackLocation);
    setEditBatch(item.batchNo);
    setEditExpiry(item.expiryDate);
    setEditSalePrice(item.salePrice.toString());
    setEditStatus(item.status);
  };

  const handleSaveItemEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const salePriceNum = parseFloat(editSalePrice) || editingItem.salePrice;

    updateInventoryItem(editingItem.id, {
      currentStock: editStock,
      rackLocation: editRack,
      batchNo: editBatch,
      expiryDate: editExpiry,
      salePrice: salePriceNum,
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

      {/* Edit Item / Adjust Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-sm max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-outline-variant pb-3">
              <div>
                <h3 className="text-base font-bold text-primary">
                  Adjust Stock & Edit Item
                </h3>
                <p className="text-xs text-on-surface-variant font-code mt-0.5">
                  SKU: {editingItem.sku} | {editingItem.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-on-surface-variant hover:text-primary cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Current Stock ({editingItem.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) =>
                      setEditStock(parseInt(e.target.value, 10) || 0)
                    }
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Status Classification
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
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-bold"
                  >
                    <option value="OPTIMAL">OPTIMAL</option>
                    <option value="LOW">LOW</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Rack / Shelf Location
                  </label>
                  <input
                    type="text"
                    value={editRack}
                    onChange={(e) => setEditRack(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={editBatch}
                    onChange={(e) => setEditBatch(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-outline-variant text-xs font-semibold rounded-sm hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-semibold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Item Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
