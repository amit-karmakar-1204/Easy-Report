"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Pause,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { useERP } from "@/lib/store";
import type { Invoice, PaymentType, SaleItem } from "@/lib/types";

export default function ActiveBillingPage() {
  const _router = useRouter();
  const { addInvoice, inventory, parties } = useERP();

  // Invoice state
  const [customerName, setCustomerName] = useState("Cash Customer");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [invoiceNo] = useState(
    `INV-${Math.floor(100000 + Math.random() * 900000)}`,
  );

  // Line items in bill
  const [items, setItems] = useState<SaleItem[]>([
    {
      id: "item-1",
      itemName: "Industrial Steel Bearing 6204-ZZ",
      barcode: "89012345001",
      qty: 50,
      rate: 12.5,
      discount: 5.0,
      total: 593.75,
    },
    {
      id: "item-2",
      itemName: "Heavy Duty Lubricant Spray 400ml",
      barcode: "89012345002",
      qty: 12,
      rate: 8.75,
      discount: 0.0,
      total: 105.0,
    },
  ]);

  // Current item input row state
  const [itemName, setItemName] = useState("");
  const [itemBarcode, setItemBarcode] = useState("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemRate, setItemRate] = useState<string>("");
  const [itemDisc, setItemDisc] = useState<string>("0");
  const [heldBills, setHeldBills] = useState<
    { id: string; name: string; items: SaleItem[] }[]
  >([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastSavedInvoice, setLastSavedInvoice] = useState<Invoice | null>(
    null,
  );

  // Quick select item from inventory
  const handleItemSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setItemName(val);
    const found = inventory.find(
      (inv) =>
        inv.name.toLowerCase() === val.toLowerCase() ||
        inv.sku.toLowerCase() === val.toLowerCase(),
    );
    if (found) {
      setItemRate(found.salePrice.toString());
      setItemBarcode(found.sku);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert("Please enter an item name");
      return;
    }
    const rateNum = parseFloat(itemRate) || 0;
    const discNum = parseFloat(itemDisc) || 0;
    const qtyNum = itemQty > 0 ? itemQty : 1;
    const lineTotal = qtyNum * rateNum * (1 - discNum / 100);

    const newItem: SaleItem = {
      id: `item-${Date.now()}`,
      itemName: itemName.trim(),
      barcode: itemBarcode || `BAR-${Math.floor(1000 + Math.random() * 9000)}`,
      qty: qtyNum,
      rate: rateNum,
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
        name: `${customerName} (${items.length} items)`,
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
      customerName: customerName || "Cash Customer",
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
              Point of sale and invoice generation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {heldBills.length > 0 && (
            <div className="flex items-center gap-1.5 bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 rounded-xs font-semibold">
              <span>{heldBills.length} Bill(s) on Hold</span>
              <button
                onClick={() => handleRestoreHold(heldBills[0])}
                className="underline hover:opacity-80"
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

      {/* Bill Header Info Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Customer Selection */}
          <div className="lg:col-span-5 relative">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Customer / Account
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                list="partyList"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Search customer or select 'Cash'..."
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
              Payment Type
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            >
              <option value="cash">Cash</option>
              <option value="credit">Credit (Khata)</option>
            </select>
          </div>

          {/* Date */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            ></input>
          </div>

          {/* Invoice No */}
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
        className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Item Name / Barcode
            </label>
            <input
              type="text"
              list="inventoryItemsList"
              value={itemName}
              onChange={handleItemSelect}
              placeholder="Scan barcode or type item name..."
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
            <datalist id="inventoryItemsList">
              {inventory.map((inv) => (
                <option key={inv.id} value={inv.name}>
                  {inv.sku} - Stock: {inv.currentStock} {inv.unit} @ ₹
                  {inv.salePrice}
                </option>
              ))}
            </datalist>
          </div>

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

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Rate (₹)
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

          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full py-2 bg-primary text-on-primary hover:opacity-90 font-bold text-xs rounded-sm h-[38px] flex items-center justify-center transition-opacity"
            >
              <Plus className="w-4 h-4 mr-0.5" /> ADD
            </button>
          </div>
        </div>
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
                  RATE (₹)
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
                      Scan a barcode or search products above to start billing
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
                      {item.rate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-code text-on-surface">
                      {item.discount.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-code font-bold text-on-surface">
                      {item.total.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-sm"
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
          className="px-5 py-2 bg-surface-variant text-on-surface hover:bg-surface-container-high border border-outline-variant transition-colors text-xs font-bold rounded-sm"
        >
          CLEAR
        </button>
        <button
          onClick={handleHold}
          className="px-5 py-2 bg-surface-variant text-on-surface hover:bg-surface-container-high border border-outline-variant transition-colors text-xs font-bold rounded-sm flex items-center gap-1.5"
        >
          <Pause className="w-3.5 h-3.5" /> HOLD
        </button>
        <button
          onClick={handleSaveAndPrint}
          className="px-6 py-2.5 bg-primary text-on-primary hover:opacity-90 transition-opacity text-sm font-bold rounded-sm flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> SAVE & PRINT
        </button>
      </div>

      {/* Print / Confirmation Modal */}
      {showPrintModal && lastSavedInvoice && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2 text-secondary">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-primary">
                  Invoice Generated Successfully
                </h3>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Preview */}
            <div className="border border-outline-variant p-4 bg-surface-container-low text-xs space-y-3 font-code">
              <div className="text-center border-b border-outline-variant pb-2">
                <div className="font-bold text-sm text-primary">
                  EASY REPORT WHOLESALE
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  Warehouse Alpha, Sector-4 Industrial Area
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  GSTIN: 07AAAAA0000A1Z5
                </div>
              </div>
              <div className="flex justify-between text-[11px]">
                <div>
                  <span className="text-on-surface-variant">Invoice:</span>{" "}
                  {lastSavedInvoice.invoiceNo}
                </div>
                <div>
                  <span className="text-on-surface-variant">Date:</span>{" "}
                  {lastSavedInvoice.date}
                </div>
              </div>
              <div>
                <span className="text-on-surface-variant">Customer:</span>{" "}
                {lastSavedInvoice.customerName} (
                {lastSavedInvoice.paymentType.toUpperCase()})
              </div>

              <div className="border-t border-b border-outline-variant py-1">
                {lastSavedInvoice.items.map((it: SaleItem) => (
                  <div
                    key={it.id || it.itemName}
                    className="flex justify-between py-0.5"
                  >
                    <span>
                      {it.itemName} x{it.qty}
                    </span>
                    <span>₹{it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5 text-right font-medium">
                <div>Subtotal: ₹{lastSavedInvoice.subtotal.toFixed(2)}</div>
                <div>Tax (10%): ₹{lastSavedInvoice.tax.toFixed(2)}</div>
                <div className="font-bold text-sm text-primary pt-1 border-t border-outline-variant">
                  Grand Total: ₹{lastSavedInvoice.grandTotal.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setItems([]);
                }}
                className="px-4 py-2 border border-outline-variant text-xs font-semibold rounded-sm hover:bg-surface-container-high"
              >
                New Bill
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-sm hover:opacity-90 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
