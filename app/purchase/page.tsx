"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  History,
  Plus,
  Trash2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { formatINR, useERP } from "@/lib/store";
import type { PurchaseItem } from "@/lib/types";

export default function StockInwardPage() {
  const router = useRouter();
  const { addPurchase, inventory } = useERP();

  // Header form
  const [supplierName, setSupplierName] = useState("Global Tech Supplies");
  const [invoiceNumber, setInvoiceNumber] = useState(
    `PUR-2023-${Math.floor(1000 + Math.random() * 9000)}`,
  );
  const [inwardDate, setInwardDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Current item inputs
  const [itemName, setItemName] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [expiryDate, setExpiryDate] = useState("2025-11");
  const [purchaseRate, setPurchaseRate] = useState("");
  const [mrp, setMrp] = useState("");
  const [qty, setQty] = useState<number>(10);

  // Staged items list
  const [stagedItems, setStagedItems] = useState<PurchaseItem[]>([
    {
      id: "stg-1",
      itemName: "Organic Whole Milk 1L",
      batchNo: "BCH-8821-A",
      expiryDate: "2023-10",
      purchaseRate: 45.0,
      mrp: 60.0,
      qty: 100,
      total: 4500.0,
    },
    {
      id: "stg-2",
      itemName: "Artisan Bread Loaf - Sourdough",
      batchNo: "BCH-9932-B",
      expiryDate: "2023-10",
      purchaseRate: 35.0,
      mrp: 50.0,
      qty: 50,
      total: 1750.0,
    },
  ]);

  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Auto-fill existing item if matched
  const handleItemNameChange = (val: string) => {
    setItemName(val);
    const found = inventory.find(
      (inv) =>
        inv.name.toLowerCase() === val.toLowerCase() ||
        inv.sku.toLowerCase() === val.toLowerCase(),
    );
    if (found) {
      setPurchaseRate(found.purchaseRate.toString());
      setMrp(found.mrp.toString());
      setBatchNo(
        found.batchNo || `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
      );
    }
  };

  const handleAddStagedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert("Please enter an item name");
      return;
    }
    const rateNum = parseFloat(purchaseRate) || 0;
    const mrpNum = parseFloat(mrp) || rateNum * 1.25;
    const qtyNum = qty > 0 ? qty : 1;
    const total = qtyNum * rateNum;

    const newItem: PurchaseItem = {
      id: `stg-${Date.now()}`,
      itemName: itemName.trim(),
      batchNo:
        batchNo.trim() || `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: expiryDate || "2026-12",
      purchaseRate: rateNum,
      mrp: mrpNum,
      qty: qtyNum,
      total: Math.round(total * 100) / 100,
    };

    setStagedItems((prev) => [...prev, newItem]);
    setItemName("");
    setBatchNo("");
    setPurchaseRate("");
    setMrp("");
    setQty(10);
  };

  const handleRemoveStagedItem = (id: string) => {
    setStagedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const invoiceTotal = stagedItems.reduce((acc, item) => acc + item.total, 0);

  const handleLogPurchase = () => {
    if (stagedItems.length === 0) {
      alert("Cannot log purchase with 0 staged items.");
      return;
    }

    addPurchase({
      purchaseId: invoiceNumber,
      date: inwardDate,
      supplierName: supplierName || "General Supplier",
      items: stagedItems,
      totalCost: invoiceTotal,
      status: "Completed",
    });

    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      router.push("/purchase-modify");
    }, 1500);
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
              Stock Inward (Purchase)
            </h1>
            <p className="text-xs text-on-surface-variant">
              Log supplier shipments, batch details, and update live warehouse
              stock
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/purchase-modify"
            className="px-3 py-1.5 border border-outline-variant rounded-sm text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" /> Purchase History
          </Link>
        </div>
      </div>

      {/* Supplier & Header Information */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Supplier Name / Vendor
            </label>
            <input
              type="text"
              list="supplierList"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Select or enter supplier..."
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
            <datalist id="supplierList">
              <option value="Global Tech Supplies" />
              <option value="Nexus Industries" />
              <option value="Apex Parts Co." />
              <option value="Prime Supplies" />
              <option value="Zenith Corp" />
            </datalist>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Supplier Invoice # / Bill Ref
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-code font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Inward Date
            </label>
            <input
              type="date"
              value={inwardDate}
              onChange={(e) => setInwardDate(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Item Inward Entry Row */}
      <form
        onSubmit={handleAddStagedItem}
        className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4"
      >
        <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">
          Add Inward Item Entry
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-end">
          <div className="col-span-2 sm:col-span-4">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Item Name / Description
            </label>
            <input
              type="text"
              list="stockProductsList"
              value={itemName}
              onChange={(e) => handleItemNameChange(e.target.value)}
              placeholder="e.g. Organic Whole Milk 1L"
              className="w-full px-3 py-2 border border-outline-variant bg-surface text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm"
            />
            <datalist id="stockProductsList">
              {inventory.map((inv) => (
                <option key={inv.id} value={inv.name} />
              ))}
            </datalist>
          </div>

          <div className="col-span-2 sm:col-span-2">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Batch Number
            </label>
            <input
              type="text"
              placeholder="BCH-8821-A"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface text-xs font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm"
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Expiry Date
            </label>
            <input
              type="month"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-2 py-2 border border-outline-variant bg-surface text-xs font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm"
            />
          </div>

          <div className="col-span-1 sm:col-span-1">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Rate (₹)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={purchaseRate}
              onChange={(e) => setPurchaseRate(e.target.value)}
              className="w-full px-2 py-2 border border-outline-variant bg-surface text-xs font-code text-right text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm"
            />
          </div>

          <div className="col-span-1 sm:col-span-1">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              MRP (₹)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              className="w-full px-2 py-2 border border-outline-variant bg-surface text-xs font-code text-right text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm"
            />
          </div>

          <div className="col-span-1 sm:col-span-1">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Qty
            </label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
              className="w-full px-2 py-2 border border-outline-variant bg-surface text-xs font-code text-right text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <button
              type="submit"
              className="w-full py-2 bg-primary text-on-primary hover:opacity-90 font-bold text-xs rounded-sm h-[38px] flex items-center justify-center transition-opacity"
              title="Add to Staged Inventory"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Staged Inventory Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm flex flex-col min-h-[300px] overflow-hidden shadow-none">
        <div className="p-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider">
            Staged Inventory
          </h3>
          <span className="text-[11px] font-semibold text-on-surface-variant bg-surface border border-outline-variant px-2 py-0.5 rounded-xs">
            {stagedItems.length} Items Pending Log
          </span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-surface font-bold text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="py-2.5 px-4 w-1/4">Item Name</th>
                <th className="py-2.5 px-3">Batch No.</th>
                <th className="py-2.5 px-3">Expiry</th>
                <th className="py-2.5 px-3 text-right">Purchase Rate</th>
                <th className="py-2.5 px-3 text-right">MRP</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-4 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {stagedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    <FileCheck className="w-8 h-8 mx-auto mb-2 text-outline" />
                    <p className="font-semibold">No staged items yet</p>
                    <p className="text-[11px] mt-0.5">
                      Use the item entry row above to stage stock
                    </p>
                  </td>
                </tr>
              ) : (
                stagedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-container-low transition-colors group"
                  >
                    <td className="py-2.5 px-4 font-medium text-on-surface">
                      {item.itemName}
                    </td>
                    <td className="py-2.5 px-3 font-code text-on-surface-variant">
                      {item.batchNo}
                    </td>
                    <td className="py-2.5 px-3 font-code text-on-surface-variant">
                      {item.expiryDate}
                    </td>
                    <td className="py-2.5 px-3 text-right font-code text-on-surface">
                      ₹{item.purchaseRate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-code text-on-surface">
                      ₹{item.mrp.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-code font-medium text-on-surface">
                      {item.qty}
                    </td>
                    <td className="py-2.5 px-3 text-right font-code font-bold text-on-surface">
                      ₹{item.total.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleRemoveStagedItem(item.id)}
                        className="text-on-surface-variant hover:text-error transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Action Area */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-3 mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Invoice Total
            </span>
            <span className="text-2xl font-bold text-primary tracking-tight font-code">
              {formatINR(invoiceTotal)}
            </span>
          </div>
          <button
            onClick={handleLogPurchase}
            className="w-full sm:w-auto bg-primary text-on-primary font-bold text-xs uppercase px-8 py-3 rounded-sm hover:opacity-90 transition-opacity tracking-wider flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" /> Log Purchase & Update Stock
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-primary text-on-primary px-4 py-3 rounded-sm shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-secondary-container" />
          <div className="text-xs">
            <p className="font-bold">Purchase Logged Successfully!</p>
            <p className="opacity-80">
              Stock quantities and batch compliance updated.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
