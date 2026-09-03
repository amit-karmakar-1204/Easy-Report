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
  TrendingDown,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatINR, useERP } from "@/lib/store";
import type { Invoice, PaymentType, SaleItem } from "@/lib/types";

export interface PurchasedStockItem {
  key: string;
  id?: string;
  sku?: string;
  name: string;
  company?: string;
  batchNo?: string;
  mrp: number;
  purchaseRate: number;
  currentStock: number;
  totalPurchased: number;
  totalSold: number;
  unit: string;
  packing?: string;
  expiryDate?: string;
}

// Composite unique key ensuring same-name items with different company/batch/rate are never mixed together
function getItemStockKey(item?: {
  name?: string;
  company?: string;
  batchNo?: string;
  purchaseRate?: number;
  mrp?: number;
}): string {
  const n = (item?.name || "").toLowerCase().trim();
  const c = (item?.company || "").toLowerCase().trim();
  const b = (item?.batchNo || "").toLowerCase().trim();
  const pr = Number(item?.purchaseRate || 0).toFixed(2);
  const mrp = Number(item?.mrp || 0).toFixed(2);
  return `${n}:::${c}:::${b}:::${pr}:::${mrp}`;
}

export default function ActiveBillingPage() {
  const _router = useRouter();
  const { addInvoice, inventory, parties, purchases, invoices } = useERP();

  // Invoice state
  const [customerName, setCustomerName] = useState("Cash Customer");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("INV-100001");

  useEffect(() => {
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setInvoiceNo(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
  }, []);

  // Line items in bill
  const [items, setItems] = useState<SaleItem[]>([]);

  // Current item input row state
  const [itemName, setItemName] = useState("");
  const [selectedStockItem, setSelectedStockItem] =
    useState<PurchasedStockItem | null>(null);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [itemBarcode, setItemBarcode] = useState("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemRate, setItemRate] = useState<string>(""); // Represents MRP
  const [itemDisc, setItemDisc] = useState<string>("0");
  const [itemError, setItemError] = useState<string | null>(null);
  const [warningFeedback, setWarningFeedback] = useState<string | null>(null);

  const [heldBills, setHeldBills] = useState<
    { id: string; name: string; items: SaleItem[] }[]
  >([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastSavedInvoice, setLastSavedInvoice] = useState<Invoice | null>(
    null,
  );

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Dynamic real-time reconciliation of all purchased items and live stock
  // Differentiating each item by Name, Company, Batch, and Rates so stocks are never mixed
  const purchasedItemsList = useMemo<PurchasedStockItem[]>(() => {
    const map = new Map<string, PurchasedStockItem>();

    // 1. Gather all items and quantities from Purchases safely
    for (const pur of purchases || []) {
      if (!pur || !Array.isArray(pur.items)) continue;
      for (const item of pur.items) {
        if (!item || !item.itemName) continue;
        const key = getItemStockKey({
          name: item.itemName,
          company: item.company,
          batchNo: item.batchNo,
          purchaseRate: Number(item.purchaseRate) || 0,
          mrp: Number(item.mrp) || 0,
        });

        if (!map.has(key)) {
          map.set(key, {
            key,
            name: item.itemName,
            sku: item.batchNo || "",
            batchNo: item.batchNo || "",
            mrp: Number(item.mrp) || 0,
            purchaseRate: Number(item.purchaseRate) || 0,
            currentStock: 0,
            totalPurchased: Number(item.qty) || 0,
            totalSold: 0,
            unit: "Pcs",
            company: item.company || "",
            packing: item.packing || "",
            expiryDate: item.expiryDate || "",
          });
        } else {
          const entry = map.get(key)!;
          entry.totalPurchased += Number(item.qty) || 0;
          if (Number(item.mrp) > 0) entry.mrp = Number(item.mrp);
          if (Number(item.purchaseRate) > 0)
            entry.purchaseRate = Number(item.purchaseRate);
          if (item.batchNo) entry.batchNo = item.batchNo;
          if (item.company && !entry.company) entry.company = item.company;
          if (item.packing && !entry.packing) entry.packing = item.packing;
        }
      }
    }

    // 2. Merge Inventory items metadata safely
    for (const inv of inventory || []) {
      if (!inv || !inv.name) continue;
      const key = getItemStockKey({
        name: inv.name,
        company: inv.company,
        batchNo: inv.batchNo,
        purchaseRate: Number(inv.purchaseRate) || 0,
        mrp: Number(inv.mrp || inv.salePrice) || 0,
      });

      if (!map.has(key)) {
        map.set(key, {
          key,
          id: inv.id,
          name: inv.name,
          sku: inv.sku || "",
          batchNo: inv.batchNo || "",
          mrp: Number(inv.mrp || inv.salePrice) || 0,
          purchaseRate: Number(inv.purchaseRate) || 0,
          currentStock: Number(inv.currentStock) || 0,
          totalPurchased: Number(inv.currentStock) || 0,
          totalSold: 0,
          unit: inv.unit || "Pcs",
          company: inv.company || "",
          packing: inv.packing || "",
          expiryDate: inv.expiryDate || "",
        });
      } else {
        const entry = map.get(key)!;
        if (!entry.id && inv.id) entry.id = inv.id;
        if (!entry.sku && inv.sku) entry.sku = inv.sku;
        if (!entry.mrp && (inv.mrp || inv.salePrice))
          entry.mrp = Number(inv.mrp || inv.salePrice);
        if (!entry.purchaseRate && inv.purchaseRate)
          entry.purchaseRate = Number(inv.purchaseRate);
        if (!entry.company && inv.company) entry.company = inv.company;
        if (!entry.packing && inv.packing) entry.packing = inv.packing;
        if (entry.currentStock === 0 && Number(inv.currentStock) > 0) {
          entry.currentStock = Number(inv.currentStock);
        }
      }
    }

    // 3. Compute Total Sold from Invoices matching specific variant safely
    for (const inv of invoices || []) {
      if (!inv || !Array.isArray(inv.items)) continue;
      for (const item of inv.items) {
        if (!item || !item.itemName) continue;
        const exactKey = getItemStockKey({
          name: item.itemName,
          company: item.company,
          batchNo: item.batchNo,
          purchaseRate: Number(item.purchaseRate) || 0,
          mrp: Number(item.rate) || 0,
        });

        const qtySold = Number(item.qty) || 0;

        if (map.has(exactKey)) {
          map.get(exactKey)!.totalSold += qtySold;
        } else {
          let matched = false;
          if (item.inventoryItemId) {
            for (const entry of map.values()) {
              if (entry.id === item.inventoryItemId) {
                entry.totalSold += qtySold;
                matched = true;
                break;
              }
            }
          }
          if (!matched) {
            for (const entry of map.values()) {
              const sameName =
                (entry.name || "").toLowerCase().trim() ===
                (item.itemName || "").toLowerCase().trim();
              const sameCompany =
                !item.company ||
                (entry.company || "").toLowerCase().trim() ===
                  item.company.toLowerCase().trim();
              const sameBatch =
                !item.batchNo ||
                (entry.batchNo || "").toLowerCase().trim() ===
                  item.batchNo.toLowerCase().trim();
              if (sameName && sameCompany && sameBatch) {
                entry.totalSold += qtySold;
                matched = true;
                break;
              }
            }
          }
          if (!matched) {
            for (const entry of map.values()) {
              if (
                (entry.name || "").toLowerCase().trim() ===
                (item.itemName || "").toLowerCase().trim()
              ) {
                entry.totalSold += qtySold;
                break;
              }
            }
          }
        }
      }
    }

    // 4. Calculate Net Available Stock: Total Purchased - Total Sold
    for (const entry of map.values()) {
      if (entry.totalPurchased > 0) {
        entry.currentStock = Math.max(
          0,
          entry.totalPurchased - entry.totalSold,
        );
      } else {
        entry.currentStock = Math.max(0, entry.currentStock - entry.totalSold);
      }
    }

    return Array.from(map.values());
  }, [inventory, purchases, invoices]);

  // In-stock items only: When stock is zero, do not show product in sale term
  const inStockPurchasedItems = useMemo<PurchasedStockItem[]>(() => {
    return purchasedItemsList.filter((item) => item.currentStock > 0);
  }, [purchasedItemsList]);

  // Search suggestions based on user query - strictly filtered to in-stock items only
  const searchSuggestions = useMemo(() => {
    if (!itemName.trim()) {
      return inStockPurchasedItems.slice(0, 20);
    }
    const q = itemName.toLowerCase().trim();
    return inStockPurchasedItems.filter(
      (it) =>
        (it.name || "").toLowerCase().includes(q) ||
        (it.company?.toLowerCase().includes(q) ?? false) ||
        (it.batchNo?.toLowerCase().includes(q) ?? false) ||
        (it.sku?.toLowerCase().includes(q) ?? false),
    );
  }, [itemName, inStockPurchasedItems]);

  // Live stock match for currently entered/selected item (only matches in-stock products)
  const matchedInventoryItem = useMemo(() => {
    if (selectedStockItem && selectedStockItem.currentStock > 0)
      return selectedStockItem;
    if (!itemName.trim()) return null;
    const trimmed = itemName.toLowerCase().trim();

    return (
      inStockPurchasedItems.find(
        (p) =>
          (p.name || "").toLowerCase().trim() === trimmed ||
          (p.sku && p.sku.toLowerCase().trim() === trimmed) ||
          (p.batchNo && p.batchNo.toLowerCase().trim() === trimmed),
      ) || null
    );
  }, [selectedStockItem, itemName, inStockPurchasedItems]);

  // Live loss calculation for current input values
  const lossCalculation = useMemo(() => {
    const rawRate = parseFloat(itemRate) || matchedInventoryItem?.mrp || 0;
    const discountPct = parseFloat(itemDisc) || 0;
    const effectiveSellingPrice = rawRate * (1 - discountPct / 100);
    const purchaseCost = matchedInventoryItem?.purchaseRate || 0;

    const isLoss =
      purchaseCost > 0 &&
      effectiveSellingPrice > 0 &&
      effectiveSellingPrice < purchaseCost;

    const unitLoss = Math.max(0, purchaseCost - effectiveSellingPrice);
    const totalLoss = unitLoss * (itemQty > 0 ? itemQty : 1);
    const lossPercentage =
      purchaseCost > 0 ? (unitLoss / purchaseCost) * 100 : 0;

    return {
      isLoss,
      effectiveSellingPrice,
      purchaseCost,
      unitLoss,
      totalLoss,
      lossPercentage,
    };
  }, [itemRate, itemDisc, itemQty, matchedInventoryItem]);

  // Total quantity of currently selected item already staged in bill (tracked per company & rate)
  const qtyAlreadyInBill = useMemo(() => {
    if (!matchedInventoryItem) return 0;
    return items
      .filter((it) => {
        if (it.inventoryItemId && matchedInventoryItem.id) {
          return it.inventoryItemId === matchedInventoryItem.id;
        }
        const sameName =
          (it.itemName || "").toLowerCase().trim() ===
          (matchedInventoryItem.name || "").toLowerCase().trim();
        const sameCompany =
          (it.company || "").toLowerCase().trim() ===
          (matchedInventoryItem.company || "").toLowerCase().trim();
        const sameBatch =
          (it.batchNo || "").toLowerCase().trim() ===
          (matchedInventoryItem.batchNo || "").toLowerCase().trim();
        const sameRate =
          Math.abs(
            (Number(it.rate) || 0) - (Number(matchedInventoryItem.mrp) || 0),
          ) < 0.01;
        return sameName && sameCompany && sameBatch && sameRate;
      })
      .reduce((s, it) => s + (Number(it.qty) || 0), 0);
  }, [matchedInventoryItem, items]);

  const liveAvailableStock = matchedInventoryItem
    ? matchedInventoryItem.currentStock
    : 0;
  const remainingStock = Math.max(0, liveAvailableStock - qtyAlreadyInBill);

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
  const handleSelectSuggestion = (item: PurchasedStockItem) => {
    setSelectedStockItem(item);
    setItemName(item.name);
    setItemRate(item.mrp > 0 ? item.mrp.toString() : "");
    setItemBarcode(item.sku || item.batchNo || "");
    setIsSearchDropdownOpen(false);
    setItemError(null);
  };

  const handleItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setItemName(val);
    setItemError(null);
    setIsSearchDropdownOpen(true);

    if (selectedStockItem && val.trim() !== selectedStockItem.name.trim()) {
      setSelectedStockItem(null);
      setItemRate("");
      setItemBarcode("");
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

    // Identify target item
    let target = selectedStockItem;
    if (!target) {
      // Look for match in inStockPurchasedItems
      const matchingVariants = inStockPurchasedItems.filter(
        (p) =>
          (p.name || "").toLowerCase().trim() === trimmedName.toLowerCase() ||
          (p.sku && p.sku.toLowerCase().trim() === trimmedName.toLowerCase()) ||
          (p.batchNo &&
            p.batchNo.toLowerCase().trim() === trimmedName.toLowerCase()),
      );

      if (matchingVariants.length === 0) {
        // Check if it exists in warehouse history with 0 stock
        const zeroStockVariant = purchasedItemsList.find(
          (p) =>
            (p.name || "").toLowerCase().trim() === trimmedName.toLowerCase() ||
            (p.sku &&
              p.sku.toLowerCase().trim() === trimmedName.toLowerCase()) ||
            (p.batchNo &&
              p.batchNo.toLowerCase().trim() === trimmedName.toLowerCase()),
        );

        if (zeroStockVariant) {
          setItemError(
            `Stock is zero: "${trimmedName}" (${zeroStockVariant.company || "Standard"}) has 0 available stock and cannot be added to the bill.`,
          );
        } else {
          setItemError(
            `"${trimmedName}" has not been inwarded into stock. Please inward/purchase this product in the Purchase section before billing.`,
          );
        }
        return;
      }

      if (matchingVariants.length > 1) {
        setItemError(
          `Multiple company options exist for "${trimmedName}". Please click and select your specific company/rate variant from the dropdown suggestions.`,
        );
        setIsSearchDropdownOpen(true);
        return;
      }

      target = matchingVariants[0];
    }

    // 2. Strict Stock Validation using reconciled available stock for this variant
    const availableStock = target.currentStock;

    // Condition A: 0 or Negative Stock
    if (availableStock <= 0) {
      setItemError(
        `Out of Stock: "${target.name}" (${target.company || "Standard"}) has 0 ${target.unit || "units"} available in warehouse. Total inwarded: ${target.totalPurchased}, Total sold: ${target.totalSold}.`,
      );
      return;
    }

    // Condition B: Exceeding Available Stock for this specific variant
    const existingInBillQty = items
      .filter((it) => {
        if (it.inventoryItemId && target.id) {
          return it.inventoryItemId === target.id;
        }
        const sameName =
          it.itemName.toLowerCase().trim() === target.name.toLowerCase().trim();
        const sameCompany =
          (it.company || "").toLowerCase().trim() ===
          (target.company || "").toLowerCase().trim();
        const sameBatch =
          (it.batchNo || "").toLowerCase().trim() ===
          (target.batchNo || "").toLowerCase().trim();
        const sameRate = Math.abs(it.rate - target.mrp) < 0.01;
        return sameName && sameCompany && sameBatch && sameRate;
      })
      .reduce((sum, it) => sum + it.qty, 0);

    const qtyNum = itemQty > 0 ? itemQty : 1;

    if (existingInBillQty + qtyNum > availableStock) {
      const remaining = Math.max(0, availableStock - existingInBillQty);
      setItemError(
        `Insufficient Stock for "${target.name} [${target.company || "Standard"}]": Available: ${availableStock} ${target.unit || "units"} (Already in this bill: ${existingInBillQty}). You entered ${qtyNum} units. Maximum you can add is ${remaining}.`,
      );
      return;
    }

    // 3. Price Validation
    const mrpNum = parseFloat(itemRate) || target.mrp || 0;
    if (mrpNum <= 0) {
      setItemError(`Please enter a valid MRP for "${target.name}".`);
      return;
    }

    const discNum = parseFloat(itemDisc) || 0;
    const lineTotal = qtyNum * mrpNum * (1 - discNum / 100);

    // 4. Check for Selling at a Loss (Warn and proceed)
    const effectivePrice = mrpNum * (1 - discNum / 100);
    const purchaseCost = target.purchaseRate || 0;
    if (purchaseCost > 0 && effectivePrice < purchaseCost) {
      const uLoss = purchaseCost - effectivePrice;
      setWarningFeedback(
        `⚠️ Loss Warning: Added "${target.name} [${target.company || "Standard"}]" below purchase cost (Loss: -₹${uLoss.toFixed(2)}/unit, -₹${(uLoss * qtyNum).toFixed(2)} total). Transaction proceeded.`,
      );
      setTimeout(() => setWarningFeedback(null), 5000);
    }

    const newItem: SaleItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemName: target.name,
      company: target.company,
      batchNo: target.batchNo,
      packing: target.packing,
      inventoryItemId: target.id,
      barcode:
        itemBarcode ||
        target.sku ||
        target.batchNo ||
        `BAR-${Math.floor(1000 + Math.random() * 9000)}`,
      qty: qtyNum,
      rate: mrpNum,
      discount: discNum,
      total: Math.round(lineTotal * 100) / 100,
      purchaseRate: purchaseCost,
    };

    setItems((prev) => [...prev, newItem]);

    // Reset item inputs
    setItemName("");
    setSelectedStockItem(null);
    setItemBarcode("");
    setItemQty(1);
    setItemRate("");
    setItemDisc("0");
    setItemError(null);
    setIsSearchDropdownOpen(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const totalItemsCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalLandingCost = items.reduce(
    (sum, item) => sum + (item.purchaseRate || 0) * item.qty,
    0,
  );
  const totalEstimatedMargin = subtotal - totalLandingCost;
  const tax = 0;
  const grandTotal = subtotal;

  const handleClear = () => {
    if (
      items.length === 0 ||
      confirm("Clear all line items from current bill?")
    ) {
      setItems([]);
      setItemName("");
      setSelectedStockItem(null);
      setItemRate("");
      setItemBarcode("");
      setItemError(null);
      setWarningFeedback(null);
      setIsSearchDropdownOpen(false);
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

    // Final verification against live reconciled stock for each variant
    for (const it of items) {
      const match = purchasedItemsList.find((i) => {
        if (it.inventoryItemId && i.id) {
          return i.id === it.inventoryItemId;
        }
        const sameName =
          i.name.toLowerCase().trim() === it.itemName.toLowerCase().trim();
        const sameCompany =
          !it.company ||
          (i.company || "").toLowerCase().trim() ===
            it.company.toLowerCase().trim();
        const sameBatch =
          !it.batchNo ||
          (i.batchNo || "").toLowerCase().trim() ===
            it.batchNo.toLowerCase().trim();
        return sameName && sameCompany && sameBatch;
      });
      const currentStock = match ? match.currentStock : 0;
      if (it.qty > currentStock) {
        alert(
          `Cannot complete sale: Insufficient stock for "${it.itemName}${it.company ? ` [${it.company}]` : ""}". Available in warehouse: ${currentStock}, Bill Quantity: ${it.qty}. Please adjust bill quantities before proceeding.`,
        );
        return;
      }
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

  // Billing hotkeys listener (F8=Hold, F9=Clear, Ctrl+Enter=Save & Print)
  useEffect(() => {
    if (showPrintModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Quick Save Bill: Ctrl + Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSaveAndPrint();
        return;
      }

      // Quick Hold Bill: F8
      if (e.key === "F8") {
        e.preventDefault();
        handleHold();
        return;
      }

      // Quick Clear Bill: F9
      if (e.key === "F9") {
        e.preventDefault();
        handleClear();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showPrintModal,
    items,
    invoiceNo,
    invoiceDate,
    customerName,
    paymentType,
    subtotal,
    tax,
    grandTotal,
    purchasedItemsList,
  ]);

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
              Point of sale, live stock tracking, and discount loss protection
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
              <strong>No stock inward recorded:</strong> You must inward
              products in Purchase before billing items so inventory stock and
              MRP can be retrieved.
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

      {/* Floating Warning Toast / Feedback */}
      {warningFeedback && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 rounded-sm text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{warningFeedback}</span>
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
                  <option
                    key={p.id}
                    value={p.name}
                    label={`${p.partyType || "Party"}${p.phone ? ` - 📞 ${p.phone}${p.alternatePhone ? `, ${p.alternatePhone}` : ""}` : ""}`}
                  />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">
            Add Sale Line Item
          </div>
          {/* Live stock & company & rate indicator for selected item */}
          {matchedInventoryItem && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              {matchedInventoryItem.company && (
                <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary border border-primary/20">
                  Mfg: {matchedInventoryItem.company}
                </span>
              )}
              {matchedInventoryItem.batchNo && (
                <span className="text-[11px] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-outline-variant">
                  Batch: {matchedInventoryItem.batchNo}
                </span>
              )}
              {liveAvailableStock > 0 ? (
                <span
                  className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] ${
                    itemQty > remainingStock
                      ? "bg-error/15 text-error border border-error/30"
                      : "bg-secondary-container text-on-secondary-container border border-secondary"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Warehouse Stock:{" "}
                  <strong>
                    {liveAvailableStock} {matchedInventoryItem.unit || "Pcs"}
                  </strong>
                  {qtyAlreadyInBill > 0 && ` (${qtyAlreadyInBill} in bill)`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-error bg-error-container text-on-error-container px-2 py-0.5 rounded border border-error text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" /> Out of Stock (0 units
                  available)
                </span>
              )}
              {matchedInventoryItem.purchaseRate > 0 && (
                <span className="text-[11px] font-code text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-outline-variant">
                  Cost: ₹{matchedInventoryItem.purchaseRate.toFixed(2)}/u
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Item Search box with Purchased Items suggestions separated by Company & Rate */}
          <div className="sm:col-span-5 relative" ref={searchContainerRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Purchased Item / Company / Batch
              </label>
              {selectedStockItem && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStockItem(null);
                    setItemName("");
                    setItemRate("");
                    setItemBarcode("");
                    setIsSearchDropdownOpen(true);
                  }}
                  className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  Change Item
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                value={itemName}
                onChange={handleItemNameChange}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsSearchDropdownOpen(false);
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Search item name, company, or batch..."
                className={`w-full pl-9 pr-3 py-2 border ${
                  itemError
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-outline-variant focus:border-primary focus:ring-primary"
                } bg-surface-container-lowest text-xs text-on-surface focus:ring-1 outline-none rounded-sm transition-colors`}
              />
            </div>

            {/* Interactive Dropdown displaying distinct Company variants and separated stocks */}
            {isSearchDropdownOpen && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-sm shadow-2xl z-50 divide-y divide-outline-variant animate-in fade-in">
                <div className="px-3 py-1.5 bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex justify-between items-center">
                  <span>Available Stock by Company & Rate</span>
                  <span>{searchSuggestions.length} variant(s)</span>
                </div>
                {searchSuggestions.map((item) => {
                  const isSelected = selectedStockItem?.key === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className={`w-full text-left p-2.5 hover:bg-surface-container-high transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-primary/5 border-l-2 border-primary"
                          : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-on-surface">
                            {item.name}
                          </span>
                          {item.company ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                              {item.company}
                            </span>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant italic">
                              (Standard)
                            </span>
                          )}
                          {item.batchNo && (
                            <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-1 py-0.2 rounded">
                              Bch: {item.batchNo}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-on-surface-variant flex items-center gap-3 mt-1">
                          <span>
                            MRP:{" "}
                            <strong className="text-on-surface font-code">
                              ₹{(Number(item.mrp) || 0).toFixed(2)}
                            </strong>
                          </span>
                          <span>
                            Cost:{" "}
                            <span className="font-code">
                              ₹{(Number(item.purchaseRate) || 0).toFixed(2)}
                            </span>
                          </span>
                          {item.packing && (
                            <span className="text-on-surface-variant/80">
                              Pack: {item.packing}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.currentStock > 0
                              ? "bg-secondary-container text-on-secondary-container"
                              : "bg-error-container text-on-error-container"
                          }`}
                        >
                          {item.currentStock > 0
                            ? `${item.currentStock} ${item.unit} in stock`
                            : "0 Stock"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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
              className={`w-full px-3 py-2 border ${
                matchedInventoryItem &&
                (liveAvailableStock <= 0 || itemQty > remainingStock)
                  ? "border-error text-error font-bold"
                  : "border-outline-variant text-on-surface"
              } bg-surface-container-lowest text-xs text-right font-code focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors`}
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
              className={`w-full px-3 py-2 border ${
                lossCalculation.isLoss
                  ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-bold"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface"
              } text-xs text-right font-code focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors`}
            />
          </div>

          {/* Add Button */}
          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={matchedInventoryItem ? liveAvailableStock <= 0 : false}
              className={`w-full py-2 ${
                lossCalculation.isLoss
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-primary text-on-primary hover:opacity-90"
              } disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs rounded-sm h-[38px] flex items-center justify-center transition-all cursor-pointer`}
              title={
                lossCalculation.isLoss
                  ? "Selling at a loss (Allowed)"
                  : "Add Item"
              }
            >
              <Plus className="w-4 h-4 mr-0.5" /> ADD
            </button>
          </div>
        </div>

        {/* Real-time Discount Loss Warning Banner (Informative & Non-blocking) */}
        {lossCalculation.isLoss && (
          <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/40 rounded-sm text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold flex items-center gap-2">
                <span>⚠️ Selling at a Loss Warning:</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-code">
                  -{(Number(lossCalculation.lossPercentage) || 0).toFixed(1)}%
                  Margin
                </span>
              </div>
              <p>
                Selling price after <strong>{itemDisc}% discount</strong> is{" "}
                <strong>
                  ₹
                  {(Number(lossCalculation.effectiveSellingPrice) || 0).toFixed(
                    2,
                  )}
                </strong>
                , which is lower than your purchase cost of{" "}
                <strong>
                  ₹{(Number(lossCalculation.purchaseCost) || 0).toFixed(2)}
                </strong>
                . You will incur a loss of{" "}
                <strong className="text-error font-code">
                  ₹{(Number(lossCalculation.unitLoss) || 0).toFixed(2)}/unit
                </strong>{" "}
                (Total loss:{" "}
                <strong>
                  ₹{(Number(lossCalculation.totalLoss) || 0).toFixed(2)}
                </strong>{" "}
                for {itemQty} pcs).
              </p>
              <p className="text-[11px] opacity-80">
                👉 You can still click <strong>ADD</strong> to proceed with the
                sale.
              </p>
            </div>
          </div>
        )}

        {/* Error message for Insufficient Stock or Unpurchased Items (Blocking) */}
        {itemError && (
          <div className="flex items-start gap-2 p-3 bg-error-container text-on-error-container rounded-sm text-xs font-medium animate-in fade-in border border-error">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
            <div className="space-y-0.5">
              <span className="font-bold block">Transaction Blocked:</span>
              <span>{itemError}</span>
            </div>
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
                items.map((item, idx) => {
                  const effectiveUnitPrice =
                    item.rate * (1 - item.discount / 100);
                  const isItemLoss =
                    item.purchaseRate &&
                    item.purchaseRate > 0 &&
                    effectiveUnitPrice < item.purchaseRate;
                  const itemUnitLoss = isItemLoss
                    ? (item.purchaseRate || 0) - effectiveUnitPrice
                    : 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-surface-container-low transition-colors group ${
                        isItemLoss ? "bg-amber-500/5" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-on-surface-variant">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-on-surface">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold">{item.itemName}</span>
                          {item.company && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                              {item.company}
                            </span>
                          )}
                          {item.batchNo && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono text-on-surface-variant bg-surface-container border border-outline-variant">
                              B: {item.batchNo}
                            </span>
                          )}
                          {item.packing && (
                            <span className="text-[10px] text-on-surface-variant">
                              ({item.packing})
                            </span>
                          )}
                          {isItemLoss && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded"
                              title={`Purchased at ₹${(Number(item.purchaseRate) || 0).toFixed(2)}, selling at ₹${(Number(effectiveUnitPrice) || 0).toFixed(2)}`}
                            >
                              <TrendingDown className="w-3 h-3 text-amber-600 shrink-0" />
                              Loss: -₹{(Number(itemUnitLoss) || 0).toFixed(2)}/u
                            </span>
                          )}
                        </div>
                        {item.barcode && (
                          <span className="block text-[10px] text-on-surface-variant font-code">
                            {item.barcode}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-code text-on-surface font-bold">
                        {item.qty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-code text-on-surface">
                        ₹{(Number(item.rate) || 0).toFixed(2)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-code ${
                          item.discount > 0
                            ? "text-primary font-bold"
                            : "text-on-surface"
                        }`}
                      >
                        {(Number(item.discount) || 0).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-code font-bold text-on-surface">
                        ₹{(Number(item.total) || 0).toFixed(2)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="mt-auto bg-surface-container-low border-t border-outline-variant p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-xs text-on-surface-variant space-y-1">
            <div>
              Total Items:{" "}
              <span className="font-bold text-on-surface">
                {totalItemsCount}
              </span>{" "}
              &nbsp;|&nbsp; Total Qty:{" "}
              <span className="font-bold text-on-surface">{totalQuantity}</span>
            </div>
            {totalLandingCost > 0 && (
              <div className="flex items-center gap-2">
                {totalEstimatedMargin >= 0 ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-secondary text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5" /> Est. Profit: +
                    {formatINR(totalEstimatedMargin)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />{" "}
                    Overall Loss: -{formatINR(Math.abs(totalEstimatedMargin))}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-right self-end sm:self-auto">
            <div>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase">
                ITEMS
              </div>
              <div className="text-xs font-code font-medium text-on-surface">
                {items.length} items ({items.reduce((s, it) => s + it.qty, 0)} units)
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase">
                SUBTOTAL
              </div>
              <div className="text-xs font-code font-medium text-on-surface">
                ₹ {subtotal.toFixed(2)}
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
          title="Clear current staged bill (Hotkey: F9)"
          className="px-4 py-2 bg-surface-variant text-on-surface hover:bg-surface-container-high border border-outline-variant transition-colors text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>CLEAR</span>
          <kbd className="text-[10px] font-mono opacity-70 bg-surface-container px-1 py-0.2 rounded border border-outline-variant">
            F9
          </kbd>
        </button>
        <button
          onClick={handleHold}
          title="Put bill on hold (Hotkey: F8)"
          className="px-4 py-2 bg-surface-variant text-on-surface hover:bg-surface-container-high border border-outline-variant transition-colors text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Pause className="w-3.5 h-3.5" />
          <span>HOLD</span>
          <kbd className="text-[10px] font-mono opacity-70 bg-surface-container px-1 py-0.2 rounded border border-outline-variant">
            F8
          </kbd>
        </button>
        <button
          onClick={handleSaveAndPrint}
          title="Save & Print Invoice (Hotkey: Ctrl+Enter)"
          className="px-6 py-2.5 bg-primary text-on-primary hover:opacity-90 transition-opacity text-sm font-bold rounded-sm flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>SAVE & PRINT</span>
          <kbd className="text-[10px] font-mono font-bold bg-on-primary/20 text-on-primary px-1.5 py-0.5 rounded border border-on-primary/30">
            Ctrl+↵
          </kbd>
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
                      key={
                        it.id || `${it.itemName}-${it.company}-${it.batchNo}`
                      }
                      className="flex justify-between items-start py-1 text-[11px] border-b border-outline-variant/30 last:border-0"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-on-surface">
                          {it.itemName}
                          {it.company && (
                            <span className="text-primary font-bold text-[10px] ml-1.5">
                              [{it.company}]
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-on-surface-variant">
                          {it.batchNo && <span>Batch: {it.batchNo} • </span>}
                          <span>
                            {it.qty} pcs @ ₹{(Number(it.rate) || 0).toFixed(2)}
                            {Number(it.discount) > 0 && ` (-${it.discount}%)`}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold shrink-0 font-code">
                        ₹{(Number(it.total) || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-right font-medium text-xs pt-1">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal:</span>
                    <span>
                      ₹{(Number(lastSavedInvoice.subtotal) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-primary pt-2 border-t border-outline-variant">
                    <span>Grand Total:</span>
                    <span>
                      ₹{(Number(lastSavedInvoice.grandTotal) || 0).toFixed(2)}
                    </span>
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
