"use client";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileEdit,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useMemo, useState } from "react";
import { formatINR, useERP } from "@/lib/store";
import type { Purchase, PurchaseItem } from "@/lib/types";

export default function PurchaseModifyPage() {
  const { purchases, updatePurchase, inventory } = useERP();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected purchase for editing
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editSupplier, setEditSupplier] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<
    "Completed" | "Pending" | "Cancelled"
  >("Completed");
  const [editItems, setEditItems] = useState<PurchaseItem[]>([]);

  // Add new item inside modal
  const [newItemName, setNewItemName] = useState("");
  const [newItemBatch, setNewItemBatch] = useState("");
  const [newItemExpiry, setNewItemExpiry] = useState("2025-12");
  const [newItemRate, setNewItemRate] = useState("");
  const [newItemMrp, setNewItemMrp] = useState("");
  const [newItemQty, setNewItemQty] = useState(10);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((pur) => {
      const matchQuery =
        !searchQuery.trim() ||
        pur.purchaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pur.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDate = !filterDate || pur.date === filterDate;
      return matchQuery && matchDate;
    });
  }, [purchases, searchQuery, filterDate]);

  const totalEntries = filteredPurchases.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPurchases.slice(start, start + itemsPerPage);
  }, [filteredPurchases, currentPage]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleOpenEdit = (pur: Purchase) => {
    setEditingPurchase(pur);
    setEditSupplier(pur.supplierName);
    setEditDate(pur.date);
    setEditStatus(pur.status);
    setEditItems(JSON.parse(JSON.stringify(pur.items)));
    setNewItemName("");
    setNewItemBatch("");
    setNewItemRate("");
    setNewItemMrp("");
    setNewItemQty(10);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof PurchaseItem,
    value: string | number,
  ) => {
    setEditItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };
      const qty =
        field === "qty" ? parseInt(String(value), 10) || 0 : current.qty;
      const rate =
        field === "purchaseRate"
          ? parseFloat(String(value)) || 0
          : current.purchaseRate;
      current.total = Math.round(qty * rate * 100) / 100;
      updated[index] = current;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItemToPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      alert("Please enter an item name");
      return;
    }
    const rateNum = parseFloat(newItemRate) || 0;
    const mrpNum = parseFloat(newItemMrp) || rateNum * 1.25;
    const qtyNum = newItemQty > 0 ? newItemQty : 1;
    const total = qtyNum * rateNum;

    const newItem: PurchaseItem = {
      id: `pur-it-${Date.now()}`,
      itemName: newItemName.trim(),
      batchNo:
        newItemBatch.trim() || `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: newItemExpiry || "2026-12",
      purchaseRate: rateNum,
      mrp: mrpNum,
      qty: qtyNum,
      total,
    };

    setEditItems((prev) => [...prev, newItem]);
    setNewItemName("");
    setNewItemBatch("");
    setNewItemRate("");
    setNewItemMrp("");
    setNewItemQty(10);
  };

  const editTotalCost = editItems.reduce((acc, it) => acc + it.total, 0);

  const handleSavePurchaseEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    if (editItems.length === 0) {
      alert("Purchase bill must have at least one line item.");
      return;
    }

    updatePurchase(editingPurchase.id, {
      supplierName: editSupplier,
      date: editDate,
      status: editStatus,
      items: editItems,
      totalCost: editTotalCost,
    });

    setToastMessage(
      `Purchase Record ${editingPurchase.purchaseId} updated successfully!`,
    );
    setTimeout(() => setToastMessage(null), 3000);
    setEditingPurchase(null);
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
            <h1 className="text-xl font-bold text-primary tracking-tight">
              Purchase History List (Purchase Modify)
            </h1>
            <p className="text-xs text-on-surface-variant">
              Manage inward purchase records and supplier invoices
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/purchase"
            className="bg-primary text-on-primary text-xs font-semibold px-4 py-2 rounded-sm transition-opacity hover:opacity-90 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Purchase
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

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="w-full md:w-1/3 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Supplier or ID..."
            className="w-full pl-9 pr-3 py-2 border border-outline-variant rounded-sm bg-surface text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>
        <div className="w-full md:w-1/4 relative">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 border border-outline-variant rounded-sm bg-surface text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-on-surface font-code"
          />
        </div>
        <div className="w-full md:w-auto flex-1 flex justify-end gap-2">
          {(searchQuery || filterDate) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterDate("");
              }}
              className="px-3 py-2 border border-outline-variant rounded-sm text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="p-3.5 font-bold text-on-surface-variant uppercase tracking-wider">
                  Purchase ID
                </th>
                <th className="p-3.5 font-bold text-on-surface-variant uppercase tracking-wider">
                  Date
                </th>
                <th className="p-3.5 font-bold text-on-surface-variant uppercase tracking-wider">
                  Supplier
                </th>
                <th className="p-3.5 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Total Cost
                </th>
                <th className="p-3.5 font-bold text-on-surface-variant uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {paginatedPurchases.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    <Search className="w-8 h-8 mx-auto mb-2 text-outline" />
                    <p className="font-semibold">No purchase records found</p>
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((pur) => (
                  <tr
                    key={pur.id}
                    className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                  >
                    <td
                      onClick={() => handleOpenEdit(pur)}
                      className="p-3.5 font-code text-primary font-bold group-hover:underline"
                    >
                      {pur.purchaseId}
                    </td>
                    <td
                      onClick={() => handleOpenEdit(pur)}
                      className="p-3.5 text-on-surface"
                    >
                      {pur.date}
                    </td>
                    <td
                      onClick={() => handleOpenEdit(pur)}
                      className="p-3.5 text-on-surface"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-sm bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                          {getInitials(pur.supplierName)}
                        </div>
                        <span className="font-medium">{pur.supplierName}</span>
                      </div>
                    </td>
                    <td
                      onClick={() => handleOpenEdit(pur)}
                      className="p-3.5 text-on-surface text-right font-bold font-code"
                    >
                      {formatINR(pur.totalCost)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(pur)}
                        className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-sm hover:bg-surface-container-highest cursor-pointer"
                        title="Modify Purchase Record"
                      >
                        <FileEdit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-surface border-t border-outline-variant p-3 flex justify-between items-center text-xs text-on-surface-variant">
          <span>
            Showing{" "}
            {totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalEntries)} of{" "}
            {totalEntries}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-outline-variant rounded-xs hover:bg-surface-container-highest transition-colors disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2 py-1 border border-outline-variant rounded-xs hover:bg-surface-container-highest transition-colors disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Fully Functional Edit Purchase Record Modal */}
      {editingPurchase && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-sm max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-outline-variant pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-primary">
                  Modify Purchase Record
                </h3>
                <p className="text-xs text-on-surface-variant font-code mt-0.5">
                  Ref: {editingPurchase.purchaseId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
                className="text-on-surface-variant hover:text-primary cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSavePurchaseEdit}
              className="space-y-4 text-xs flex-1 overflow-y-auto pr-1"
            >
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-container-low p-3 rounded-sm">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Inward Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(
                        e.target.value as "Completed" | "Pending" | "Cancelled",
                      )
                    }
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-bold"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Line items Table */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">
                    Received Line Items ({editItems.length})
                  </label>
                </div>

                <div className="border border-outline-variant rounded-sm overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-surface-container-low sticky top-0 border-b border-outline-variant text-[10px]">
                      <tr>
                        <th className="py-2 px-3 font-bold text-on-surface-variant">
                          Item Description
                        </th>
                        <th className="py-2 px-2 font-bold text-on-surface-variant w-24">
                          Batch No
                        </th>
                        <th className="py-2 px-2 font-bold text-on-surface-variant w-20">
                          Expiry
                        </th>
                        <th className="py-2 px-2 font-bold text-on-surface-variant w-16 text-right">
                          Rate ₹
                        </th>
                        <th className="py-2 px-2 font-bold text-on-surface-variant w-14 text-right">
                          Qty
                        </th>
                        <th className="py-2 px-3 font-bold text-on-surface-variant w-20 text-right">
                          Total
                        </th>
                        <th className="py-2 px-2 text-center w-10">Act</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {editItems.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-surface-container-low"
                        >
                          <td className="py-1.5 px-3">
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) =>
                                handleUpdateItem(
                                  idx,
                                  "itemName",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary outline-none font-medium py-0.5"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={item.batchNo}
                              onChange={(e) =>
                                handleUpdateItem(idx, "batchNo", e.target.value)
                              }
                              className="w-full bg-surface border border-outline-variant rounded-xs px-1 py-0.5 font-code text-[11px]"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="month"
                              value={item.expiryDate}
                              onChange={(e) =>
                                handleUpdateItem(
                                  idx,
                                  "expiryDate",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-surface border border-outline-variant rounded-xs px-1 py-0.5 font-code text-[10px]"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.purchaseRate}
                              onChange={(e) =>
                                handleUpdateItem(
                                  idx,
                                  "purchaseRate",
                                  e.target.value,
                                )
                              }
                              className="w-full text-right bg-surface border border-outline-variant rounded-xs px-1 py-0.5 font-code"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) =>
                                handleUpdateItem(idx, "qty", e.target.value)
                              }
                              className="w-full text-right bg-surface border border-outline-variant rounded-xs px-1 py-0.5 font-code font-bold"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-right font-code font-bold text-primary">
                            ₹{item.total.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
                              title="Delete item row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add New Line Item Row */}
              <div className="bg-surface-container-low p-3 rounded-sm border border-outline-variant">
                <span className="block text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">
                  + Add Inward Item
                </span>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <input
                      type="text"
                      list="inventoryPurchasedItems"
                      placeholder="Item name"
                      value={newItemName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewItemName(val);
                        const match = inventory.find(
                          (inv) => inv.name.toLowerCase() === val.toLowerCase(),
                        );
                        if (match) {
                          setNewItemRate(match.purchaseRate.toString());
                          setNewItemMrp(match.mrp.toString());
                          setNewItemBatch(match.batchNo || "BCH-NEW");
                        }
                      }}
                      className="w-full px-2 py-1 bg-surface border border-outline-variant rounded-xs text-xs"
                    />
                    <datalist id="inventoryPurchasedItems">
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Batch #"
                      value={newItemBatch}
                      onChange={(e) => setNewItemBatch(e.target.value)}
                      className="w-full px-2 py-1 bg-surface border border-outline-variant rounded-xs text-xs font-code"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="month"
                      value={newItemExpiry}
                      onChange={(e) => setNewItemExpiry(e.target.value)}
                      className="w-full px-2 py-1 bg-surface border border-outline-variant rounded-xs text-xs font-code"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Rate ₹"
                      value={newItemRate}
                      onChange={(e) => setNewItemRate(e.target.value)}
                      className="w-full px-2 py-1 bg-surface border border-outline-variant rounded-xs text-xs text-right font-code"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={newItemQty}
                      onChange={(e) =>
                        setNewItemQty(parseInt(e.target.value, 10) || 1)
                      }
                      className="w-full px-2 py-1 bg-surface border border-outline-variant rounded-xs text-xs text-right font-code"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={handleAddItemToPurchase}
                      className="w-full py-1 bg-primary text-on-primary rounded-xs text-xs font-bold hover:opacity-90 flex items-center justify-center h-[26px] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-surface-container-low p-3 rounded-sm flex justify-between items-center text-xs">
                <div className="text-on-surface-variant">
                  Total Items:{" "}
                  <span className="font-bold text-on-surface">
                    {editItems.length}
                  </span>
                </div>
                <div className="font-code text-right">
                  <span className="text-[10px] text-primary font-bold block">
                    Total Bill Cost:
                  </span>
                  <span className="font-bold text-base text-primary">
                    ₹{editTotalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-outline-variant shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this purchase inward record?")) {
                      // Remove purchase
                      purchases.splice(
                        purchases.findIndex((p) => p.id === editingPurchase.id),
                        1,
                      );
                      setEditingPurchase(null);
                      setToastMessage("Purchase record deleted.");
                      setTimeout(() => setToastMessage(null), 3000);
                    }
                  }}
                  className="px-3.5 py-2 bg-error-container text-on-error-container font-semibold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Bill
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPurchase(null)}
                    className="px-4 py-2 border border-outline-variant text-xs font-semibold rounded-sm hover:bg-surface-container-high cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-on-primary font-semibold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
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
