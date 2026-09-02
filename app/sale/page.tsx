"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Pause,
  Plus,
  Printer,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { formatINR, useERP } from "@/lib/store";
import type { Invoice, PaymentType, SaleItem } from "@/lib/types";

export default function ActiveBillingPage() {
  const _router = useRouter();
  const { addInvoice, inventory, parties, purchases } = useERP();

  // Invoice state
  const [customerName, setCustomerName] = useState("Cash Customer");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [invoiceNo, setInvoiceNo] = useState("INV-100001");

  useEffect(() => {
    setInvoiceNo(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
  }, []);

  // Line items in bill
  const [items, setItems] = useState<SaleItem[]>([]);

  // Current item input row state
  const [itemName, setItemName] = useState("");
  const [itemBarcode, setItemBarcode] = useState("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemRate, setItemRate] = useState<string>(""); // Represents MRP
  const [itemDisc, setItemDisc] = useState<string>("0");
  const [itemError, setItemError] = useState<string | null>(null);

  const [heldBills, setHeldBills] = useState<
    { id: string; name: string; items: SaleItem[] }[]
  >([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastSavedInvoice, setLastSavedInvoice] = useState<Invoice | null>(
    null,
  );

  // Extract all purchased items from purchases & inventory
  const purchasedItemsList = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        sku?: string;
        batchNo?: string;
        mrp: number;
        purchaseRate: number;
        currentStock: number;
        unit?: string;
      }
    >();

    // 1. Check Inventory items
    for (const inv of inventory) {
      const key = inv.name.toLowerCase().trim();
      map.set(key, {
        name: inv.name,
        sku: inv.sku,
        batchNo: inv.batchNo,
        mrp: inv.mrp || inv.salePrice || 0,
        purchaseRate: inv.purchaseRate || 0,
        currentStock: inv.currentStock || 0,
        unit: inv.unit || "Pcs",
      });
    }

    // 2. Check Purchases for any additional / latest purchase records
    for (const pur of purchases) {
      for (const item of pur.items) {
        const key = item.itemName.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            name: item.itemName,
            batchNo: item.batchNo,
            mrp: item.mrp || 0,
            purchaseRate: item.purchaseRate || 0,
            currentStock: item.qty || 0,
            unit: "Pcs",
          });
        } else {
          const existing = map.get(key)!;
          if (!existing.mrp && item.mrp) {
            existing.mrp = item.mrp;
          }
        }
      }
    }

    return Array.from(map.values());
  }, [inventory, purchases]);

  // Modal keyboard listener & body scroll lock
  useEffect(() => {
    if (!showPrintModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPrintModal(false);
        setItems([]);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        window.print();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [showPrintModal]);

  // Quick select item from purchased items and auto-retrieve MRP
  const handleItemSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setItemName(val);
    setItemError(null);

    if (!val.trim()) {
      setItemRate("");
      setItemBarcode("");
      return;
    }

    const found = purchasedItemsList.find(
      (item) =>
        item.name.toLowerCase() === val.toLowerCase().trim() ||
        (item.sku && item.sku.toLowerCase() === val.toLowerCase().trim()) ||
        (item.batchNo &&
          item.batchNo.toLowerCase() === val.toLowerCase().trim()),
    );

    if (found) {
      setItemRate(found.mrp > 0 ? found.mrp.toString() : "");
      setItemBarcode(found.sku || found.batchNo || "");
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setItemError(null);

    const trimmedName = itemName.trim();
    if (!trimmedName) {
      setItemError("Please enter or select an item name.");
      return;
    }

    // Check if item has been purchased
    const found = purchasedItemsList.find(
      (item) =>
        item.name.toLowerCase() === trimmedName.toLowerCase() ||
        (item.sku && item.sku.toLowerCase() === trimmedName.toLowerCase()) ||
        (item.batchNo &&
          item.batchNo.toLowerCase() === trimmedName.toLowerCase()),
    );

    if (!found) {
      setItemError(
        `"${trimmedName}" has not been purchased yet. Please inward/purchase this product in the Purchase section before selling.`,
      );
      return;
    }

    const mrpNum = parseFloat(itemRate) || found.mrp || 0;
    if (mrpNum <= 0) {
      setItemError(`Please enter a valid MRP for "${found.name}".`);
      return;
    }

    const discNum = parseFloat(itemDisc) || 0;
    const qtyNum = itemQty > 0 ? itemQty : 1;
    const lineTotal = qtyNum * mrpNum * (1 - discNum / 100);

    const newItem: SaleItem = {
      id: `item-${Date.now()}`,
      itemName: found.name,
      barcode:
        itemBarcode ||
        found.sku ||
        found.batchNo ||
        `BAR-${Math.floor(1000 + Math.random() * 9000)}`,
      qty: qtyNum,
      rate: mrpNum, // Stores MRP as the unit rate
      discount: discNum,
      total: Math.round(lineTotal * 100) / 100,
    };

    setItems((prev) => [...prev, newItem]);

    // Reset item inputs
    setItemName("");
    setItemBarcode("");
    setItemQty(1);
    setItemRate("");
    setItemDisc("0");
    setItemError(null);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const totalItemsCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1; // 10% tax
  const grandTotal = subtotal + tax;

  const handleClear = () => {
    if (
      items.length === 0 ||
      confirm("Clear all line items from current bill?")
    ) {
      setItems([]);
      setItemName("");
      setItemRate("");
      setItemError(null);
    }
  };

  const handleHold = () => {
    if (items.length === 0) {
      alert("No items to put on hold.");
      return;
    }
    setHeldBills((prev) => [
      ...prev,
      {
        id: `hold-${Date.now()}`,
        name: `${customerName.trim() || "Cash Customer"} (${items.length} items)`,
        items,
      },
    ]);
    setItems([]);
    alert("Bill saved to On-Hold list.");
  };

  const handleRestoreHold = (holdItem: {
    id: string;
    name: string;
    items: SaleItem[];
  }) => {
    setItems(holdItem.items);
    setHeldBills((prev) => prev.filter((h) => h.id !== holdItem.id));
  };

  const handleSaveAndPrint = () => {
    if (items.length === 0) {
      alert("Cannot save an empty bill. Add at least one item.");
      return;
    }

    const saved = addInvoice({
      invoiceNo,
      date: invoiceDate,
      customerName: customerName.trim() || "Cash Customer",
      paymentType,
      items,
      subtotal,
      tax,
      grandTotal,
      status: paymentType === "cash" ? "Paid" : "Pending",
    });

    setLastSavedInvoice(saved);
    setShowPrintModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Breadcrumb & Actions */}
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
              Active Billing (Sale)
            </h1>
            <p className="text-xs text-on-surface-variant">
              Point of sale and invoice generation with purchase-linked MRP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {heldBills.length > 0 && (
            <div className="flex items-center gap-1.5 bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 rounded-xs font-semibold">
              <span>{heldBills.length} Bill(s) on Hold</span>
              <button
                onClick={() => handleRestoreHold(heldBills[0])}
                className="underline hover:opacity-80 cursor-pointer"
              >
                Restore
              </button>
            </div>
          )}
          <Link
            href="/sale-modify"
            className="px-3 py-1.5 border border-outline-variant rounded-sm text-xs font-semibold hover:bg-surface-container-high transition-colors"
          >
            Search Invoices
          </Link>
        </div>
      </div>

      {/* Warning when no purchases recorded in system */}
      {purchasedItemsList.length === 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>No purchases recorded yet:</strong> You must record inward
              purchases before billing items so MRP and stock can be retrieved.
            </span>
          </div>
          <Link
            href="/purchase"
            className="px-3 py-1 bg-primary text-on-primary font-bold rounded-sm shrink-0 hover:opacity-90 transition-opacity"
          >
            Go to Purchase Inward
          </Link>
        </div>
      )}

      {/* Bill Header Info Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Customer Name */}
          <div className="lg:col-span-5 relative">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Customer Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                list="partyList"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter or select customer name (e.g. Ramesh Kumar, Acme Ltd)..."
                className="w-full pl-9 pr-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
              />
              <datalist id="partyList">
                <option value="Cash Customer" />
                {parties.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Payment Type */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Payment Mode
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            >
              <option value="cash">Cash (Paid)</option>
              <option value="credit">Credit (Khata)</option>
            </select>
          </div>

          {/* Invoice Date */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
          </div>

          {/* Invoice No. */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Invoice No.
            </label>
            <input
              type="text"
              readOnly
              value={invoiceNo}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-low text-xs font-code font-semibold text-primary rounded-sm"
            />
          </div>
        </div>
      </div>

      {/* Item Entry Row */}
      <form
        onSubmit={handleAddItem}
        className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Item Search box with Purchased Items suggestions */}
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Purchased Item Name / Batch / SKU
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                list="purchasedItemsDatalist"
                value={itemName}
                onChange={handleItemSelect}
                placeholder="Search or select purchased item..."
                className={`w-full pl-9 pr-3 py-2 border ${
                  itemError
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-outline-variant focus:border-primary focus:ring-primary"
                } bg-surface-container-lowest text-xs text-on-surface focus:ring-1 outline-none rounded-sm transition-colors`}
              />
            </div>
            <datalist id="purchasedItemsDatalist">
              {purchasedItemsList.map((item, i) => (
                <option
                  key={`${item.name}-${item.batchNo || i}`}
                  value={item.name}
                >
                  MRP: ₹{item.mrp.toFixed(2)} | Stock: {item.currentStock}{" "}
                  {item.unit || "Pcs"}
                  {item.batchNo ? ` | Batch: ${item.batchNo}` : ""}
                </option>
              ))}
            </datalist>
          </div>

          {/* Quantity */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Qty
            </label>
            <input
              type="number"
              min="1"
              value={itemQty}
              onChange={(e) => setItemQty(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs text-right font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
          </div>

          {/* MRP directly retrieved from purchase */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              MRP (₹)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={itemRate}
              onChange={(e) => setItemRate(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs text-right font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
          </div>

          {/* Discount */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Disc (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={itemDisc}
              onChange={(e) => setItemDisc(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs text-right font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
          </div>

          {/* Add Button */}
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full py-2 bg-primary text-on-primary hover:opacity-90 font-bold text-xs rounded-sm h-[38px] flex items-center justify-center transition-opacity cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-0.5" /> ADD
            </button>
          </div>
        </div>

        {/* Error message for unpurchased or invalid items */}
        {itemError && (
          <div className="flex items-center gap-2 p-2.5 bg-error-container text-on-error-container rounded-sm text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{itemError}</span>
          </div>
        )}
      </form>

      {/* Billing Line Items Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm flex flex-col min-h-[320px] shadow-none overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="py-2.5 px-3 font-bold text-on-surface-variant w-10 text-center">
                  #
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface-variant">
                  ITEM DESCRIPTION
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface-variant text-right w-20">
                  QTY
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface-variant text-right w-28">
                  MRP (₹)
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface-variant text-right w-20">
                  DISC %
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface-variant text-right w-28">
                  TOTAL
                </th>
                <th className="py-2.5 px-3 font-bold text-on-surface-variant w-14 text-center">
                  ACT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2 text-outline" />
                    <p className="font-semibold">
                      No items added to current bill
                    </p>
                    <p className="text-[11px] mt-0.5">
                      Search purchased items above to retrieve MRP and start
                      billing
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-container-low transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center text-on-surface-variant">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-on-surface">
                      {item.itemName}
                      {item.barcode && (
                        <span className="block text-[10px] text-on-surface-variant font-code">
                          {item.barcode}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-code text-on-surface">
                      {item.qty}
                    </td>
                    <td className="py-2.5 px-3 text-right font-code text-on-surface">
                      ₹{item.rate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-code text-on-surface">
                      {item.discount.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-code font-bold text-on-surface">
                      ₹{item.total.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-sm cursor-pointer"
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

        {/* Totals Section */}
        <div className="mt-auto bg-surface-container-low border-t border-outline-variant p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-xs text-on-surface-variant">
            Total Items:{" "}
            <span className="font-bold text-on-surface">{totalItemsCount}</span>{" "}
            &nbsp;|&nbsp; Total Qty:{" "}
            <span className="font-bold text-on-surface">{totalQuantity}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-right self-end sm:self-auto">
            <div>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase">
                SUBTOTAL
              </div>
              <div className="text-xs font-code font-medium text-on-surface">
                ₹ {subtotal.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase">
                TAX (10%)
              </div>
              <div className="text-xs font-code font-medium text-on-surface">
                ₹ {tax.toFixed(2)}
              </div>
            </div>
            <div className="pl-2 border-l border-outline-variant">
              <div className="text-[10px] font-bold text-primary uppercase">
                GRAND TOTAL
              </div>
              <div className="text-lg font-bold text-primary font-code">
                ₹ {grandTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap justify-end items-center gap-3 pt-1">
        <button
          onClick={handleClear}
          className="px-5 py-2 bg-surface-variant text-on-surface hover:bg-surface-container-high border border-outline-variant transition-colors text-xs font-bold rounded-sm cursor-pointer"
        >
          CLEAR
        </button>
        <button
          onClick={handleHold}
          className="px-5 py-2 bg-surface-variant text-on-surface hover:bg-surface-container-high border border-outline-variant transition-colors text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Pause className="w-3.5 h-3.5" /> HOLD
        </button>
        <button
          onClick={handleSaveAndPrint}
          className="px-6 py-2.5 bg-primary text-on-primary hover:opacity-90 transition-opacity text-sm font-bold rounded-sm flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> SAVE & PRINT
        </button>
      </div>

      {/* Print / Confirmation Modal */}
      {showPrintModal && lastSavedInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPrintModal(false);
              setItems([]);
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
              <div className="flex items-start gap-2.5 text-secondary min-w-0 flex-1">
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3
                    id="print-modal-title"
                    className="text-base font-bold text-primary"
                  >
                    Invoice Generated Successfully
                  </h3>
                  <p className="text-xs text-on-surface-variant font-code">
                    {lastSavedInvoice.invoiceNo}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-code text-on-surface-variant bg-surface-container border border-outline-variant rounded">
                  ESC
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintModal(false);
                    setItems([]);
                  }}
                  className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Preview */}
            <div className="p-5 overflow-y-auto flex-1 text-xs">
              <div className="border border-outline-variant rounded-sm p-4 bg-surface-container-low text-xs space-y-3 font-code shadow-xs">
                <div className="text-center border-b border-outline-variant pb-2.5">
                  <div className="font-bold text-sm text-primary tracking-wide">
                    EASY REPORT WHOLESALE
                  </div>
                  <div className="text-[10px] text-on-surface-variant">
                    Warehouse Alpha, Sector-4 Industrial Area
                  </div>
                  <div className="text-[10px] text-on-surface-variant">
                    GSTIN: 07AAAAA0000A1Z5
                  </div>
                </div>

                <div className="flex justify-between text-[11px] py-1 border-b border-outline-variant/60">
                  <div>
                    <span className="text-on-surface-variant">Invoice:</span>{" "}
                    <span className="font-bold text-primary">
                      {lastSavedInvoice.invoiceNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Date:</span>{" "}
                    <span className="font-medium">{lastSavedInvoice.date}</span>
                  </div>
                </div>

                <div className="text-[11px]">
                  <span className="text-on-surface-variant">Customer:</span>{" "}
                  <span className="font-bold text-on-surface">
                    {lastSavedInvoice.customerName}
                  </span>{" "}
                  <span className="text-[10px] px-1.5 py-0.5 bg-surface-container border border-outline-variant rounded uppercase font-semibold">
                    {lastSavedInvoice.paymentType}
                  </span>
                </div>

                <div className="border-t border-b border-outline-variant py-2 space-y-1">
                  {lastSavedInvoice.items.map((it: SaleItem) => (
                    <div
                      key={it.id || it.itemName}
                      className="flex justify-between items-center py-0.5 text-[11px]"
                    >
                      <span className="truncate pr-2">
                        {it.itemName}{" "}
                        <span className="text-on-surface-variant">
                          x{it.qty} @ ₹{it.rate.toFixed(2)}
                        </span>
                      </span>
                      <span className="font-semibold shrink-0">
                        ₹{it.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-right font-medium text-xs pt-1">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal:</span>
                    <span>₹{lastSavedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Tax (10% GST):</span>
                    <span>₹{lastSavedInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-primary pt-2 border-t border-outline-variant">
                    <span>Grand Total:</span>
                    <span>₹{lastSavedInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
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
                    P
                  </kbd>{" "}
                  to print
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintModal(false);
                    setItems([]);
                  }}
                  className="px-4 py-2 border border-outline-variant rounded-sm text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-primary text-on-primary rounded-sm text-xs font-bold hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
