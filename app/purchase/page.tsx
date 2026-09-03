"use client";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileCheck,
  History,
  PackagePlus,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Tag,
  Trash2,
  Truck,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatINR, useERP } from "@/lib/store";
import type {
  InventoryItem,
  PartyAccount,
  Purchase,
  PurchaseItem,
} from "@/lib/types";

export default function StockInwardPage() {
  const router = useRouter();
  const {
    addPurchase,
    inventory,
    parties,
    addParty,
    purchases,
    addInventoryItem,
  } = useERP();

  // Header form
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("PUR-2026-1001");
  const [inwardDate, setInwardDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    setInvoiceNumber(`PUR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  // Current item inputs
  const [itemName, setItemName] = useState("");
  const [itemCompany, setItemCompany] = useState("");
  const [itemPacking, setItemPacking] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [expiryDate, setExpiryDate] = useState("2028-12");
  const [purchaseRate, setPurchaseRate] = useState("");
  const [mrp, setMrp] = useState("");
  const [qty, setQty] = useState<number>(10);
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const itemSearchContainerRef = useRef<HTMLDivElement>(null);

  // Close item search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        itemSearchContainerRef.current &&
        !itemSearchContainerRef.current.contains(e.target as Node)
      ) {
        setIsItemDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Staged items list
  const [stagedItems, setStagedItems] = useState<PurchaseItem[]>([]);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);

  // Add Supplier Modal State
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierLicense, setNewSupplierLicense] = useState("");
  const [newSupplierGst, setNewSupplierGst] = useState("");

  // Add Item / Product Modal State
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPacking, setNewItemPacking] = useState("");
  const [newItemCompany, setNewItemCompany] = useState("");
  const [newItemRate, setNewItemRate] = useState("");
  const [newItemMrp, setNewItemMrp] = useState("");

  // Purchase Voucher Confirmation Modal State
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [lastLoggedPurchase, setLastLoggedPurchase] = useState<Purchase | null>(
    null,
  );

  // Dynamic list of unique saved suppliers (from parties and previous purchases)
  const supplierSuggestions = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        phone?: string;
        address?: string;
        gstin?: string;
        shopLicense?: string;
      }
    >();

    // 1. From Parties
    for (const p of parties) {
      if (p.name?.trim()) {
        map.set(p.name.toLowerCase().trim(), {
          name: p.name,
          phone: p.phone,
          address: p.address,
          gstin: p.gstin,
          shopLicense: p.shopLicense,
        });
      }
    }

    // 2. From recorded Purchases
    for (const pur of purchases) {
      if (pur.supplierName?.trim()) {
        const key = pur.supplierName.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, { name: pur.supplierName });
        }
      }
    }

    return Array.from(map.values());
  }, [parties, purchases]);

  // Combined product catalog (from Inventory + previous Purchase items)
  // Preserving distinct companies and tracking all previously recorded batches & expiries
  const catalogSuggestions = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        sku?: string;
        packing?: string;
        company?: string;
        purchaseRate: number;
        mrp: number;
        currentStock: number;
        unit?: string;
        batchNo?: string;
        expiryDate?: string;
        batches: {
          batchNo: string;
          expiryDate: string;
          purchaseRate: number;
          mrp: number;
        }[];
      }
    >();

    // 1. From Inventory safely
    for (const inv of inventory || []) {
      if (!inv || !inv.name) continue;
      const key = `${(inv.name || "").toLowerCase().trim()}:::${(inv.company || "").toLowerCase().trim()}`;
      const expFormatted = inv.expiryDate ? inv.expiryDate.slice(0, 7) : "";

      if (!map.has(key)) {
        map.set(key, {
          name: inv.name,
          sku: inv.sku || "",
          packing: inv.packing || "",
          company: inv.company || "",
          purchaseRate: Number(inv.purchaseRate) || 0,
          mrp: Number(inv.mrp || inv.salePrice) || 0,
          currentStock: Number(inv.currentStock) || 0,
          unit: inv.unit || "Pcs",
          batchNo: inv.batchNo || "",
          expiryDate: expFormatted,
          batches: inv.batchNo
            ? [
                {
                  batchNo: inv.batchNo,
                  expiryDate: expFormatted,
                  purchaseRate: Number(inv.purchaseRate) || 0,
                  mrp: Number(inv.mrp || inv.salePrice) || 0,
                },
              ]
            : [],
        });
      } else {
        const entry = map.get(key)!;
        entry.currentStock += Number(inv.currentStock) || 0;
        if (Number(inv.purchaseRate) > 0)
          entry.purchaseRate = Number(inv.purchaseRate);
        if (Number(inv.mrp) > 0) entry.mrp = Number(inv.mrp);
        if (inv.packing && !entry.packing) entry.packing = inv.packing;
        if (
          inv.batchNo &&
          !entry.batches.some(
            (b) =>
              b.batchNo.toLowerCase().trim() ===
              inv.batchNo!.toLowerCase().trim(),
          )
        ) {
          entry.batches.push({
            batchNo: inv.batchNo,
            expiryDate: expFormatted,
            purchaseRate: Number(inv.purchaseRate) || 0,
            mrp: Number(inv.mrp || inv.salePrice) || 0,
          });
        }
      }
    }

    // 2. From recorded Purchases safely
    for (const pur of purchases || []) {
      if (!pur || !Array.isArray(pur.items)) continue;
      for (const it of pur.items) {
        if (!it || !it.itemName) continue;
        const key = `${(it.itemName || "").toLowerCase().trim()}:::${(it.company || "").toLowerCase().trim()}`;
        const expFormatted = it.expiryDate ? it.expiryDate.slice(0, 7) : "";

        if (!map.has(key)) {
          map.set(key, {
            name: it.itemName,
            packing: it.packing || "",
            company: it.company || "",
            purchaseRate: Number(it.purchaseRate) || 0,
            mrp: Number(it.mrp) || 0,
            currentStock: Number(it.qty) || 0,
            unit: "Pcs",
            batchNo: it.batchNo || "",
            expiryDate: expFormatted,
            batches: it.batchNo
              ? [
                  {
                    batchNo: it.batchNo,
                    expiryDate: expFormatted,
                    purchaseRate: Number(it.purchaseRate) || 0,
                    mrp: Number(it.mrp) || 0,
                  },
                ]
              : [],
          });
        } else {
          const entry = map.get(key)!;
          if (Number(it.purchaseRate) > 0)
            entry.purchaseRate = Number(it.purchaseRate);
          if (Number(it.mrp) > 0) entry.mrp = Number(it.mrp);
          if (it.packing && !entry.packing) entry.packing = it.packing;
          if (
            it.batchNo &&
            !entry.batches.some(
              (b) =>
                b.batchNo.toLowerCase().trim() ===
                it.batchNo!.toLowerCase().trim(),
            )
          ) {
            entry.batches.push({
              batchNo: it.batchNo,
              expiryDate: expFormatted,
              purchaseRate: Number(it.purchaseRate) || 0,
              mrp: Number(it.mrp) || 0,
            });
          }
        }
      }
    }

    return Array.from(map.values());
  }, [inventory, purchases]);

  // Search suggestions for Inward Item entry based on user query
  const itemSearchSuggestions = useMemo(() => {
    if (!itemName.trim()) {
      return catalogSuggestions.slice(0, 15);
    }
    const q = itemName.toLowerCase().trim();
    return catalogSuggestions.filter(
      (it) =>
        (it.name || "").toLowerCase().includes(q) ||
        (it.company || "").toLowerCase().includes(q) ||
        (it.packing || "").toLowerCase().includes(q) ||
        (it.sku && it.sku.toLowerCase().includes(q)) ||
        it.batches.some((b) => b.batchNo.toLowerCase().includes(q)),
    );
  }, [itemName, catalogSuggestions]);

  // Dynamically extract all recorded batches for the currently typed/selected item
  const knownBatchesForCurrentItem = useMemo(() => {
    if (!itemName.trim()) return [];
    const clean = itemName.toLowerCase().trim();
    const batchMap = new Map<
      string,
      {
        batchNo: string;
        expiryDate: string;
        rate: number;
        mrp: number;
      }
    >();

    for (const cat of catalogSuggestions) {
      if ((cat.name || "").toLowerCase().trim() === clean) {
        for (const b of cat.batches) {
          if (b.batchNo?.trim()) {
            const bKey = b.batchNo.toLowerCase().trim();
            if (!batchMap.has(bKey)) {
              batchMap.set(bKey, {
                batchNo: b.batchNo.trim(),
                expiryDate: b.expiryDate,
                rate: b.purchaseRate,
                mrp: b.mrp,
              });
            }
          }
        }
      }
    }

    return Array.from(batchMap.values());
  }, [itemName, catalogSuggestions]);

  // Matched details of currently selected supplier
  const selectedSupplierDetails = useMemo(() => {
    if (!supplierName.trim()) return null;
    return (
      parties.find(
        (p) =>
          p.name.toLowerCase().trim() === supplierName.toLowerCase().trim(),
      ) || null
    );
  }, [supplierName, parties]);

  // Modal keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddSupplierModal(false);
        setShowAddItemModal(false);
        setShowVoucherModal(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        if (showVoucherModal) {
          e.preventDefault();
          window.print();
        }
      }
    };

    if (showAddSupplierModal || showAddItemModal || showVoucherModal) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAddSupplierModal, showAddItemModal, showVoucherModal]);

  // Open Supplier Modal
  const handleOpenAddSupplierModal = () => {
    setNewSupplierName(supplierName.trim());
    setNewSupplierAddress("");
    setNewSupplierPhone("");
    setNewSupplierLicense("");
    setNewSupplierGst("");
    setShowAddSupplierModal(true);
  };

  // Save Supplier
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newSupplierName.trim();
    if (!trimmedName) {
      alert("Please enter a supplier name.");
      return;
    }

    addParty({
      name: trimmedName,
      distributorId: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      partyType: "vendor",
      phone: newSupplierPhone.trim(),
      address: newSupplierAddress.trim(),
      shopLicense: newSupplierLicense.trim(),
      gstin: newSupplierGst.trim().toUpperCase(),
      outstandingBalance: 0,
      asOfDate: inwardDate || new Date().toISOString().split("T")[0],
    });

    setSupplierName(trimmedName);
    setShowAddSupplierModal(false);
    setBannerFeedback(`Supplier "${trimmedName}" saved and selected!`);
    setTimeout(() => setBannerFeedback(null), 4000);
  };

  // Open Add Item Modal
  const handleOpenAddItemModal = () => {
    setNewItemName(itemName.trim());
    setNewItemPacking("");
    setNewItemCompany("");
    setNewItemRate(purchaseRate);
    setNewItemMrp(mrp);
    setShowAddItemModal(true);
  };

  // Save New Item to Catalog
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedItemName = newItemName.trim();
    if (!trimmedItemName) {
      alert("Please enter an item name.");
      return;
    }

    const rateNum = parseFloat(newItemRate) || 0;
    const mrpNum = parseFloat(newItemMrp) || (rateNum > 0 ? rateNum * 1.25 : 0);

    addInventoryItem({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: trimmedItemName,
      category: "fin",
      rackLocation: "Z-A / R-01 / S-01",
      batchNo: `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: "2028-12-31",
      currentStock: 0,
      unit: "Pcs",
      purchaseRate: rateNum,
      salePrice: mrpNum > 0 ? mrpNum * 0.85 : rateNum * 1.15,
      mrp: mrpNum,
      packing: newItemPacking.trim(),
      company: newItemCompany.trim(),
      supplierName: supplierName.trim(),
      status: "OPTIMAL",
    });

    setItemName(trimmedItemName);
    if (rateNum > 0) setPurchaseRate(rateNum.toString());
    if (mrpNum > 0) setMrp(mrpNum.toString());

    setShowAddItemModal(false);
    setBannerFeedback(
      `Product "${trimmedItemName}" saved with MRP ₹${mrpNum.toFixed(2)} and Rate ₹${rateNum.toFixed(2)}!`,
    );
    setTimeout(() => setBannerFeedback(null), 4500);
  };

  // Select an item from the suggestions catalog
  const handleSelectCatalogSuggestion = (
    item: (typeof catalogSuggestions)[0],
  ) => {
    setItemName(item.name);
    setItemCompany(item.company || "");
    setItemPacking(item.packing || "");
    if (item.purchaseRate > 0) setPurchaseRate(item.purchaseRate.toString());
    if (item.mrp > 0) setMrp(item.mrp.toString());

    // Auto-fill latest recorded batch & expiry for this item
    if (item.batches && item.batches.length > 0) {
      const latestBatch = item.batches[item.batches.length - 1];
      setBatchNo(latestBatch.batchNo);
      if (latestBatch.expiryDate) {
        setExpiryDate(latestBatch.expiryDate.slice(0, 7));
      }
    } else if (item.batchNo) {
      setBatchNo(item.batchNo);
      if (item.expiryDate) {
        setExpiryDate(item.expiryDate.slice(0, 7));
      }
    }

    setIsItemDropdownOpen(false);
  };

  // Auto-fill when Item Name changes / is typed
  const handleItemNameChange = (val: string) => {
    setItemName(val);
    setIsItemDropdownOpen(true);
    const clean = val.toLowerCase().trim();
    if (!clean) return;

    const found = catalogSuggestions.find(
      (item) =>
        (item.name || "").toLowerCase().trim() === clean ||
        (item.sku && item.sku.toLowerCase().trim() === clean),
    );

    if (found) {
      if (found.company && !itemCompany) setItemCompany(found.company);
      if (found.packing && !itemPacking) setItemPacking(found.packing);
      if (found.purchaseRate > 0 && !purchaseRate) {
        setPurchaseRate(found.purchaseRate.toString());
      }
      if (found.mrp > 0 && !mrp) {
        setMrp(found.mrp.toString());
      }
      if (found.batches && found.batches.length > 0 && !batchNo) {
        const latest = found.batches[found.batches.length - 1];
        setBatchNo(latest.batchNo);
        if (latest.expiryDate) {
          setExpiryDate(latest.expiryDate.slice(0, 7));
        }
      } else if (found.batchNo && !batchNo) {
        setBatchNo(found.batchNo);
        if (found.expiryDate) {
          setExpiryDate(found.expiryDate.slice(0, 7));
        }
      }
    }
  };

  // Auto-fill expiry when Batch No is typed or selected:
  // "if same batch expiry will be same but editable"
  const handleBatchNoChange = (val: string) => {
    setBatchNo(val);
    const trimmedBatch = val.toLowerCase().trim();
    if (!trimmedBatch) return;

    // Check if this batch exists for the current item
    const matchedBatch = knownBatchesForCurrentItem.find(
      (b) => b.batchNo.toLowerCase().trim() === trimmedBatch,
    );

    if (matchedBatch) {
      if (matchedBatch.expiryDate) {
        setExpiryDate(matchedBatch.expiryDate.slice(0, 7));
      }
      if (matchedBatch.rate > 0 && !purchaseRate) {
        setPurchaseRate(matchedBatch.rate.toString());
      }
      if (matchedBatch.mrp > 0 && !mrp) {
        setMrp(matchedBatch.mrp.toString());
      }
      return;
    }

    // Secondary search across all inventory & purchases
    const matchInventory = inventory.find(
      (inv) => inv.batchNo && inv.batchNo.toLowerCase().trim() === trimmedBatch,
    );
    if (matchInventory) {
      if (!itemName) setItemName(matchInventory.name);
      if (matchInventory.company && !itemCompany)
        setItemCompany(matchInventory.company);
      if (matchInventory.packing && !itemPacking)
        setItemPacking(matchInventory.packing);
      if (matchInventory.purchaseRate > 0 && !purchaseRate) {
        setPurchaseRate(matchInventory.purchaseRate.toString());
      }
      if (matchInventory.mrp > 0 && !mrp) {
        setMrp(matchInventory.mrp.toString());
      }
      if (matchInventory.expiryDate) {
        setExpiryDate(matchInventory.expiryDate.slice(0, 7));
      }
      return;
    }

    for (const pur of purchases) {
      for (const it of pur.items || []) {
        if (it.batchNo && it.batchNo.toLowerCase().trim() === trimmedBatch) {
          if (!itemName) setItemName(it.itemName);
          if (it.company && !itemCompany) setItemCompany(it.company);
          if (it.packing && !itemPacking) setItemPacking(it.packing);
          if (it.purchaseRate > 0 && !purchaseRate) {
            setPurchaseRate(it.purchaseRate.toString());
          }
          if (it.mrp > 0 && !mrp) {
            setMrp(it.mrp.toString());
          }
          if (it.expiryDate) {
            setExpiryDate(it.expiryDate.slice(0, 7));
          }
          return;
        }
      }
    }
  };

  const handleAddStagedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert("Please enter an item name");
      return;
    }
    const rateNum = parseFloat(purchaseRate) || 0;
    const mrpNum = parseFloat(mrp) || (rateNum > 0 ? rateNum * 1.25 : 0);
    const qtyNum = qty > 0 ? qty : 1;
    const total = qtyNum * rateNum;

    const catalogMatch = catalogSuggestions.find(
      (it) => it.name.toLowerCase().trim() === itemName.toLowerCase().trim(),
    );

    const finalCompany = itemCompany.trim() || catalogMatch?.company || "";
    const finalPacking = itemPacking.trim() || catalogMatch?.packing || "";

    const newItem: PurchaseItem = {
      id: `stg-${Date.now()}`,
      itemName: itemName.trim(),
      batchNo:
        batchNo.trim() || `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: expiryDate || "2028-12",
      purchaseRate: rateNum,
      mrp: mrpNum,
      qty: qtyNum,
      total: Math.round(total * 100) / 100,
      packing: finalPacking,
      company: finalCompany,
    };

    setStagedItems((prev) => [...prev, newItem]);
    setItemName("");
    setItemCompany("");
    setItemPacking("");
    setBatchNo("");
    setPurchaseRate("");
    setMrp("");
    setQty(10);
    setIsItemDropdownOpen(false);
  };

  const handleRemoveStagedItem = (id: string) => {
    setStagedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const invoiceTotal = stagedItems.reduce((acc, item) => acc + item.total, 0);
  const totalStockQty = stagedItems.reduce((acc, item) => acc + item.qty, 0);

  // Log Purchase & Synchronize Store Conclusion
  const handleLogPurchase = () => {
    if (!supplierName.trim()) {
      alert("Please select or enter a Supplier Name / Vendor first.");
      return;
    }

    if (stagedItems.length === 0) {
      alert(
        "Cannot log purchase with 0 staged items. Please add at least one inward item.",
      );
      return;
    }

    const saved = addPurchase({
      purchaseId: invoiceNumber,
      date: inwardDate,
      supplierName: supplierName.trim(),
      items: stagedItems,
      totalCost: invoiceTotal,
      status: "Completed",
    });

    setLastLoggedPurchase(saved);
    setShowVoucherModal(true);
    setShowSuccessToast(true);

    // Reset inward form for next transaction
    setStagedItems([]);
    setInvoiceNumber(`PUR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
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

      {/* Banner Feedback */}
      {bannerFeedback && (
        <div className="p-3 bg-secondary-container text-on-secondary-container border border-secondary rounded-sm text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
          <span>{bannerFeedback}</span>
        </div>
      )}

      {/* Live Purchase Conclusion & Connection Bar */}
      <div className="bg-primary/5 border border-primary/20 rounded-sm p-3.5 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-primary text-sm">
            <FileCheck className="w-4 h-4 text-primary" />
            <span>Store Inward Conclusion & Bill Connection</span>
          </div>
          <p className="text-on-surface-variant text-xs">
            From store / vendor:{" "}
            <strong className="text-primary font-semibold">
              {supplierName.trim() || "— (Select Supplier)"}
            </strong>
            {selectedSupplierDetails?.phone &&
              ` [📞 ${selectedSupplierDetails.phone}]`}
            {selectedSupplierDetails?.gstin &&
              ` [GST: ${selectedSupplierDetails.gstin}]`}{" "}
            on{" "}
            <strong className="text-on-surface font-semibold">
              {inwardDate}
            </strong>{" "}
            (Bill Ref:{" "}
            <span className="font-code text-primary font-bold">
              {invoiceNumber}
            </span>
            ).
          </p>
        </div>
        <div className="flex items-center gap-4 text-right shrink-0">
          <div className="border-r border-outline-variant pr-4">
            <div className="text-[10px] uppercase font-bold text-on-surface-variant">
              Staged Items / Qty
            </div>
            <div className="font-code font-bold text-on-surface">
              {stagedItems.length} items ({totalStockQty} units)
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-primary">
              Inward Bill Total
            </div>
            <div className="font-code font-bold text-primary text-base">
              {formatINR(invoiceTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier & Header Information */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Supplier Name / Vendor with + Add Supplier Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Supplier Name / Vendor <span className="text-error">*</span>
              </label>
              <button
                type="button"
                onClick={handleOpenAddSupplierModal}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-surface-container px-2 py-0.5 rounded border border-outline-variant hover:bg-surface-container-high transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Supplier
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                list="supplierSuggestionsDatalist"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Search or enter supplier name..."
                required
                className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors font-medium"
              />
            </div>
            <datalist id="supplierSuggestionsDatalist">
              {supplierSuggestions.map((s, idx) => (
                <option key={`${s.name}-${idx}`} value={s.name}>
                  {s.name}
                  {s.phone ? ` | 📞 ${s.phone}` : ""}
                  {s.gstin ? ` | GST: ${s.gstin}` : ""}
                  {s.shopLicense ? ` | Lic: ${s.shopLicense}` : ""}
                </option>
              ))}
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

      {/* Item Inward Entry Row with + Add Item button and Auto-fill */}
      <form
        onSubmit={handleAddStagedItem}
        className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">
            Add Inward Item Entry
          </div>
          <span className="text-[11px] text-on-surface-variant">
            ⚡ Selecting product or typing batch code auto-fills Rate & MRP
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-end">
          {/* Item Name with Suggestions Dropdown + Add Item Button */}
          <div
            className="col-span-2 sm:col-span-4 relative"
            ref={itemSearchContainerRef}
          >
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Item Name / Description
              </label>
              <button
                type="button"
                onClick={handleOpenAddItemModal}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant hover:bg-surface-container-high transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={itemName}
                onChange={(e) => handleItemNameChange(e.target.value)}
                onFocus={() => setIsItemDropdownOpen(true)}
                placeholder="Search product from system..."
                className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
              />
            </div>

            {/* Interactive suggestions dropdown */}
            {isItemDropdownOpen && itemSearchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-sm shadow-2xl z-50 divide-y divide-outline-variant animate-in fade-in">
                <div className="px-3 py-1.5 bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex justify-between items-center">
                  <span>Existing Products in System</span>
                  <span>{itemSearchSuggestions.length} found</span>
                </div>
                {itemSearchSuggestions.map((item, idx) => (
                  <button
                    key={`${item.name}-${item.company}-${idx}`}
                    type="button"
                    onClick={() => handleSelectCatalogSuggestion(item)}
                    className="w-full text-left p-2 hover:bg-surface-container-high transition-colors flex flex-col gap-0.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-on-surface">
                        {item.name}
                      </span>
                      {item.company && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                          {item.company}
                        </span>
                      )}
                      {item.packing && (
                        <span className="text-[10px] text-on-surface-variant">
                          ({item.packing})
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-on-surface-variant flex items-center gap-3">
                      <span>
                        Rate:{" "}
                        <strong className="text-on-surface font-code">
                          ₹{(Number(item.purchaseRate) || 0).toFixed(2)}
                        </strong>
                      </span>
                      <span>
                        MRP:{" "}
                        <span className="font-code">
                          ₹{(Number(item.mrp) || 0).toFixed(2)}
                        </span>
                      </span>
                      {item.batches && item.batches.length > 0 && (
                        <span className="text-primary font-mono text-[9px] bg-primary/5 px-1 py-0.2 rounded">
                          {item.batches.length} batch(es) recorded
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Batch Code with Auto-match */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Batch Code
            </label>
            <input
              type="text"
              value={batchNo}
              onChange={(e) => handleBatchNoChange(e.target.value)}
              placeholder="e.g. BCH-8821"
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
          </div>

          {/* Expiry Date (Fully Editable) */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Expiry Date
            </label>
            <input
              type="month"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
          </div>

          {/* Purchase Rate */}
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
              className="w-full px-2 py-2 border border-outline-variant bg-surface-container-lowest text-xs text-right font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors font-medium"
            />
          </div>

          {/* MRP */}
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
              className="w-full px-2 py-2 border border-outline-variant bg-surface-container-lowest text-xs text-right font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors font-bold text-primary"
            />
          </div>

          {/* Quantity */}
          <div className="col-span-1 sm:col-span-1">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Qty
            </label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
              className="w-full px-2 py-2 border border-outline-variant bg-surface-container-lowest text-xs text-right font-code text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-colors"
            />
          </div>

          {/* Add Button */}
          <div className="col-span-1 sm:col-span-1">
            <button
              type="submit"
              className="w-full py-2 bg-primary text-on-primary font-bold text-xs rounded-sm h-[38px] flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
              title="Add to Staged Inventory"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Helper chips for recorded batches of the selected item */}
        {knownBatchesForCurrentItem.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-[11px] bg-surface-container-low p-2 rounded-xs border border-outline-variant/60 mt-2">
            <span className="font-bold text-primary text-[10px] uppercase tracking-wider">
              ⚡ Recorded Batches for {itemName}:
            </span>
            {knownBatchesForCurrentItem.map((b) => {
              const isSelected =
                batchNo.toLowerCase().trim() === b.batchNo.toLowerCase().trim();
              return (
                <button
                  key={b.batchNo}
                  type="button"
                  onClick={() => {
                    setBatchNo(b.batchNo);
                    if (b.expiryDate) setExpiryDate(b.expiryDate.slice(0, 7));
                    if (b.rate && !purchaseRate)
                      setPurchaseRate(b.rate.toString());
                    if (b.mrp && !mrp) setMrp(b.mrp.toString());
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-code border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary text-on-primary border-primary font-bold shadow-xs"
                      : "bg-surface-container hover:bg-surface-container-high border-outline-variant text-on-surface"
                  }`}
                  title={`Click to set Batch ${b.batchNo} and its expiry ${b.expiryDate || "N/A"} (both remain editable)`}
                >
                  {b.batchNo} {b.expiryDate ? `(Exp: ${b.expiryDate})` : ""}
                </button>
              );
            })}
            <span className="text-[10px] text-on-surface-variant italic ml-auto">
              Click batch to auto-set expiry (both remain fully editable)
            </span>
          </div>
        )}
      </form>

      {/* Staged Inventory Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm flex flex-col min-h-[300px] overflow-hidden shadow-none">
        <div className="p-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider">
              Staged Inward Items
            </h3>
            {supplierName.trim() && (
              <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-xs border border-primary/20">
                Supplier: {supplierName.trim()}
              </span>
            )}
          </div>
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
                      Enter product details above to stage stock under{" "}
                      {supplierName.trim() || "supplier"}
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
                      {(item.company || item.packing) && (
                        <span className="block text-[10px] text-on-surface-variant">
                          {[item.company, item.packing]
                            .filter(Boolean)
                            .join(" • ")}
                        </span>
                      )}
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
                    <td className="py-2.5 px-3 text-right font-code font-bold text-primary">
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
                        className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
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
              Total Inward Bill from {supplierName.trim() || "Supplier"}
            </span>
            <span className="text-2xl font-bold text-primary tracking-tight font-code">
              {formatINR(invoiceTotal)}
            </span>
          </div>
          <button
            onClick={handleLogPurchase}
            className="w-full sm:w-auto bg-primary text-on-primary font-bold text-xs uppercase px-8 py-3 rounded-sm hover:opacity-90 transition-opacity tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Truck className="w-4 h-4" /> Log Purchase & Synchronize Stock
          </button>
        </div>
      </div>

      {/* 1. Add Supplier Pop-up Modal */}
      {showAddSupplierModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-supplier-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddSupplierModal(false);
            }
          }}
          className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "520px" }}
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3.5 bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <h3 id="add-supplier-title">Add New Supplier / Vendor</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSaveSupplier}
              className="p-5 space-y-4 overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  1. Supplier Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Apex Industrial Solutions Ltd."
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  2. Address
                </label>
                <textarea
                  rows={2}
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  placeholder="e.g. Plot 42, Sector-5, Industrial Area, New Delhi"
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  3. Phone Number
                </label>
                <input
                  type="tel"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-code"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    4. Shop License
                  </label>
                  <input
                    type="text"
                    value={newSupplierLicense}
                    onChange={(e) => setNewSupplierLicense(e.target.value)}
                    placeholder="e.g. DL-2024-LIC-8812"
                    className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-code"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    5. GST No.
                  </label>
                  <input
                    type="text"
                    value={newSupplierGst}
                    onChange={(e) =>
                      setNewSupplierGst(e.target.value.toUpperCase())
                    }
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-code uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant flex justify-end items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-sm text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-sm hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Item / Product Pop-up Modal */}
      {showAddItemModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddItemModal(false);
            }
          }}
          className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "520px" }}
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3.5 bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <PackagePlus className="w-5 h-5 text-primary shrink-0" />
                <h3 id="add-item-title">Add New Product / Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSaveItem}
              className="p-5 space-y-4 overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  1. Item Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Paracetamol 650mg, Steel Bearing X-1"
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    2. Packing
                  </label>
                  <input
                    type="text"
                    value={newItemPacking}
                    onChange={(e) => setNewItemPacking(e.target.value)}
                    placeholder="e.g. 10x10, 100ml, 1kg, 25kg"
                    className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-code"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    3. Company / Mfr
                  </label>
                  <input
                    type="text"
                    value={newItemCompany}
                    onChange={(e) => setNewItemCompany(e.target.value)}
                    placeholder="e.g. Sun Pharma, Tata, Bosch"
                    className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    4. Purchase Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-code"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    5. MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItemMrp}
                    onChange={(e) => setNewItemMrp(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-code font-bold text-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant flex justify-end items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-sm text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-sm hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save & Select Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Purchase Inward Voucher Confirmation Modal */}
      {showVoucherModal && lastLoggedPurchase && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="voucher-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVoucherModal(false);
            }
          }}
          className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "600px" }}
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3.5 bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2.5 text-secondary">
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                <div>
                  <h3
                    id="voucher-title"
                    className="font-bold text-sm text-primary"
                  >
                    Purchase Inward Logged & Stock Synchronized
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-code">
                    {lastLoggedPurchase.purchaseId} • {lastLoggedPurchase.date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Inward Voucher Preview */}
            <div className="p-5 overflow-y-auto flex-1 text-xs space-y-4">
              <div className="border border-outline-variant rounded-sm p-4 bg-surface-container-low text-xs space-y-3 font-code shadow-xs">
                {/* Store Header */}
                <div className="text-center border-b border-outline-variant pb-2.5">
                  <div className="font-bold text-sm text-primary tracking-wide">
                    EASY REPORT ERP - STOCK INWARD VOUCHER
                  </div>
                  <div className="text-[10px] text-on-surface-variant">
                    Warehouse Alpha Central Inventory Log
                  </div>
                </div>

                {/* Supplier & Bill Conclusion */}
                <div className="bg-surface-container p-2.5 rounded-sm border border-outline-variant/60 space-y-1">
                  <div className="flex justify-between font-sans">
                    <span className="text-on-surface-variant text-[11px]">
                      Vendor / Supplier:
                    </span>
                    <span className="font-bold text-on-surface text-xs">
                      {lastLoggedPurchase.supplierName}
                    </span>
                  </div>
                  <div className="flex justify-between font-sans">
                    <span className="text-on-surface-variant text-[11px]">
                      Invoice / Bill Ref:
                    </span>
                    <span className="font-bold text-primary font-code">
                      {lastLoggedPurchase.purchaseId}
                    </span>
                  </div>
                  <div className="flex justify-between font-sans">
                    <span className="text-on-surface-variant text-[11px]">
                      Inward Date:
                    </span>
                    <span className="font-medium text-on-surface">
                      {lastLoggedPurchase.date}
                    </span>
                  </div>
                  <div className="flex justify-between font-sans">
                    <span className="text-on-surface-variant text-[11px]">
                      Status:
                    </span>
                    <span className="font-bold text-secondary uppercase text-[10px]">
                      {lastLoggedPurchase.status}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div className="border-t border-b border-outline-variant py-2">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Purchased Item Breakdown
                  </div>
                  <div className="space-y-1.5">
                    {lastLoggedPurchase.items.map((it, idx) => (
                      <div
                        key={it.id || idx}
                        className="flex justify-between items-start py-1 border-b border-outline-variant/40 last:border-0 text-[11px]"
                      >
                        <div className="truncate pr-2 font-sans">
                          <span className="font-semibold text-on-surface">
                            {it.itemName}
                          </span>
                          <span className="block text-[10px] text-on-surface-variant font-code">
                            Batch: {it.batchNo} | Exp: {it.expiryDate} | MRP: ₹
                            {it.mrp.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right shrink-0 font-code">
                          <div>
                            {it.qty} x ₹{it.purchaseRate.toFixed(2)}
                          </div>
                          <div className="font-bold text-primary">
                            ₹{it.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voucher Total */}
                <div className="flex justify-between items-center pt-2 font-bold text-sm text-primary">
                  <span>Total Purchase Cost:</span>
                  <span className="text-base font-code">
                    {formatINR(lastLoggedPurchase.totalCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-outline-variant bg-surface-container-low px-5 py-3 flex flex-wrap justify-between items-center gap-2 shrink-0">
              <Link
                href="/purchase-modify"
                className="px-3 py-1.5 border border-outline-variant rounded-sm text-xs font-semibold hover:bg-surface-container transition-colors"
              >
                View in History
              </Link>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-1.5 border border-outline-variant rounded-sm text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-primary text-on-primary rounded-sm text-xs font-bold hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-primary text-on-primary px-4 py-3 rounded-sm shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-secondary-container" />
          <div className="text-xs">
            <p className="font-bold">Purchase Logged Successfully!</p>
            <p className="opacity-80">
              Linked to supplier account and warehouse stock updated.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
