"use client";

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  InventoryItem,
  Invoice,
  LedgerTransaction,
  PartyAccount,
  PerformanceItem,
  Purchase,
} from "./types";

export interface ERPContextType {
  invoices: Invoice[];
  purchases: Purchase[];
  inventory: InventoryItem[];
  parties: PartyAccount[];
  selectedPartyId: string;
  setSelectedPartyId: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addPurchase: (purchase: Omit<Purchase, "id" | "createdAt">) => Purchase;
  updatePurchase: (id: string, updates: Partial<Purchase>) => void;
  addInventoryItem: (item: Omit<InventoryItem, "id">) => InventoryItem;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  recordPartyPayment: (
    partyId: string,
    amount: number,
    description: string,
    date: string,
  ) => void;
  generatePurchaseReturn: (itemIds: string[]) => void;
  reorderItem: (code: string) => void;
  metrics: {
    todayProfit: number;
    expiredItemsCount: number;
    nearExpiryCount: number;
    totalSalesValue: number;
    totalLandingCost: number;
    grossMargin: number;
    marginRate: number;
    totalStockValue: number;
    reorderCount: number;
    totalUnitsSold: number;
  };
  performanceItems: PerformanceItem[];
  resetToDefaults: () => void;
}

const STORAGE_PREFIX = "EASY_REPORT_ERP_";

const defaultInvoices: Invoice[] = [
  {
    id: "inv-1",
    invoiceNo: "INV-84920",
    date: "2023-10-24",
    customerName: "Acme Corporation Ltd.",
    paymentType: "credit",
    items: [
      {
        id: "1",
        itemName: "Industrial Steel Bearing 6204-ZZ",
        qty: 50,
        rate: 12.5,
        discount: 5,
        total: 593.75,
      },
      {
        id: "2",
        itemName: "Heavy Duty Lubricant Spray 400ml",
        qty: 12,
        rate: 8.75,
        discount: 0,
        total: 105.0,
      },
      {
        id: "3",
        itemName: "Precision Sensor Module V2",
        qty: 15,
        rate: 780.0,
        discount: 0,
        total: 11700.0,
      },
    ],
    subtotal: 12398.75,
    tax: 51.25,
    grandTotal: 12450.0,
    status: "Paid",
    createdAt: "2023-10-24T10:30:00Z",
  },
  {
    id: "inv-2",
    invoiceNo: "INV-84921",
    date: "2023-10-24",
    customerName: "Stark Industries",
    paymentType: "credit",
    items: [
      {
        id: "1",
        itemName: "Titanium Fastener M8 (Pack of 100)",
        qty: 10,
        rate: 750.0,
        discount: 5,
        total: 7125.0,
      },
      {
        id: "2",
        itemName: "Industrial Adhesive Grade-4",
        qty: 4,
        rate: 243.88,
        discount: 0,
        total: 975.5,
      },
    ],
    subtotal: 8100.5,
    tax: 0,
    grandTotal: 8100.5,
    status: "Pending",
    createdAt: "2023-10-24T11:45:00Z",
  },
  {
    id: "inv-3",
    invoiceNo: "INV-84922",
    date: "2023-10-23",
    customerName: "Wayne Enterprises",
    paymentType: "cash",
    items: [
      {
        id: "1",
        itemName: "High Torque Servo Motor 24V",
        qty: 30,
        rate: 1500.0,
        discount: 0,
        total: 45000.0,
      },
    ],
    subtotal: 45000.0,
    tax: 0,
    grandTotal: 45000.0,
    status: "Paid",
    createdAt: "2023-10-23T09:15:00Z",
  },
  {
    id: "inv-4",
    invoiceNo: "INV-84923",
    date: "2023-10-22",
    customerName: "Globex Corporation",
    paymentType: "credit",
    items: [
      {
        id: "1",
        itemName: "Connector Cable 2m Shielded",
        qty: 25,
        rate: 50.03,
        discount: 0,
        total: 1250.75,
      },
    ],
    subtotal: 1250.75,
    tax: 0,
    grandTotal: 1250.75,
    status: "Pending",
    createdAt: "2023-10-22T14:20:00Z",
  },
  {
    id: "inv-5",
    invoiceNo: "INV-84924",
    date: "2023-10-20",
    customerName: "Cyberdyne Systems",
    paymentType: "credit",
    items: [
      {
        id: "1",
        itemName: "Automation PLC Controller Unit",
        qty: 10,
        rate: 9999.9,
        discount: 0,
        total: 99999.0,
      },
    ],
    subtotal: 99999.0,
    tax: 0,
    grandTotal: 99999.0,
    status: "Overdue",
    createdAt: "2023-10-20T16:00:00Z",
  },
  {
    id: "inv-6",
    invoiceNo: "INV-84925",
    date: "2023-10-18",
    customerName: "Apex Retailers",
    paymentType: "cash",
    items: [
      {
        id: "1",
        itemName: "Copper Wire Coil 50m",
        qty: 20,
        rate: 60.0,
        discount: 0,
        total: 1200.0,
      },
    ],
    subtotal: 1200.0,
    tax: 0,
    grandTotal: 1200.0,
    status: "Paid",
    createdAt: "2023-10-18T10:00:00Z",
  },
];

const defaultPurchases: Purchase[] = [
  {
    id: "pur-1",
    purchaseId: "PUR-2023-1042",
    date: "2023-10-24",
    supplierName: "Global Tech Supplies",
    items: [
      {
        id: "1",
        itemName: "Organic Whole Milk 1L",
        batchNo: "BCH-8821-A",
        expiryDate: "2023-10",
        purchaseRate: 45.0,
        mrp: 60.0,
        qty: 100,
        total: 4500.0,
      },
      {
        id: "2",
        itemName: "Artisan Bread Loaf - Sourdough",
        batchNo: "BCH-9932-B",
        expiryDate: "2023-10",
        purchaseRate: 35.0,
        mrp: 50.0,
        qty: 50,
        total: 1750.0,
      },
      {
        id: "3",
        itemName: "Industrial Solvent X-90 20L",
        batchNo: "BT-2023-11-04",
        expiryDate: "2025-11",
        purchaseRate: 620.0,
        mrp: 780.0,
        qty: 10,
        total: 6200.0,
      },
    ],
    totalCost: 12450.0,
    status: "Completed",
    createdAt: "2023-10-24T09:00:00Z",
  },
  {
    id: "pur-2",
    purchaseId: "PUR-2023-1041",
    date: "2023-10-22",
    supplierName: "Nexus Industries",
    items: [
      {
        id: "1",
        itemName: "Polymer Resin Granules 25KG",
        batchNo: "BT-2024-01-15",
        expiryDate: "2026-01",
        purchaseRate: 164.01,
        mrp: 210.0,
        qty: 50,
        total: 8200.5,
      },
    ],
    totalCost: 8200.5,
    status: "Completed",
    createdAt: "2023-10-22T11:00:00Z",
  },
  {
    id: "pur-3",
    purchaseId: "PUR-2023-1040",
    date: "2023-10-20",
    supplierName: "Apex Parts Co.",
    items: [
      {
        id: "1",
        itemName: "Steel Bearing X-1",
        batchNo: "SB-9981-X",
        expiryDate: "2027-12",
        purchaseRate: 9.2,
        mrp: 15.0,
        qty: 400,
        total: 3680.0,
      },
      {
        id: "2",
        itemName: "Gasket Seal Rings Set",
        batchNo: "GS-1002",
        expiryDate: "2028-06",
        purchaseRate: 44.0,
        mrp: 65.0,
        qty: 10,
        total: 440.0,
      },
    ],
    totalCost: 4120.0,
    status: "Completed",
    createdAt: "2023-10-20T13:30:00Z",
  },
  {
    id: "pur-4",
    purchaseId: "PUR-2023-1039",
    date: "2023-10-18",
    supplierName: "Global Tech Supplies",
    items: [
      {
        id: "1",
        itemName: "Hydraulic Pump V2 High Flow",
        batchNo: "HP-4450",
        expiryDate: "2029-01",
        purchaseRate: 310.0,
        mrp: 450.0,
        qty: 50,
        total: 15500.0,
      },
      {
        id: "2",
        itemName: "Lubricant Oil ISO-68 5L",
        batchNo: "LB-1102",
        expiryDate: "2026-08",
        purchaseRate: 60.15,
        mrp: 90.0,
        qty: 5,
        total: 300.75,
      },
    ],
    totalCost: 15800.75,
    status: "Completed",
    createdAt: "2023-10-18T15:45:00Z",
  },
];

const defaultInventory: InventoryItem[] = [
  {
    id: "inv-item-1",
    sku: "CHM-8821-A",
    name: "Industrial Solvent X-90",
    category: "raw",
    rackLocation: "Z-C / R-12 / S-02",
    batchNo: "BT-2023-11-04",
    expiryDate: "2025-11-04",
    currentStock: 4500,
    unit: "L",
    purchaseRate: 31.0,
    salePrice: 45.0,
    mrp: 50.0,
    status: "OPTIMAL",
  },
  {
    id: "inv-item-2",
    sku: "PLS-1002-G",
    name: "Polymer Resin Granules",
    category: "raw",
    rackLocation: "Z-A / R-04 / S-01",
    batchNo: "BT-2024-01-15",
    expiryDate: "2024-05-15",
    currentStock: 120,
    unit: "KG",
    purchaseRate: 120.0,
    salePrice: 160.0,
    mrp: 180.0,
    status: "CRITICAL",
  },
  {
    id: "inv-item-3",
    sku: "PKG-3301-B",
    name: "Corrugated Heavy Boxes (M)",
    category: "pkg",
    rackLocation: "Z-B / R-01 / S-04",
    batchNo: "BX-2023-10-01",
    expiryDate: "2026-10-01",
    currentStock: 8200,
    unit: "Units",
    purchaseRate: 4.5,
    salePrice: 7.0,
    mrp: 8.0,
    status: "OPTIMAL",
  },
  {
    id: "inv-item-4",
    sku: "ELC-9021-M",
    name: "Micro-controller Chipset ARM64",
    category: "fin",
    rackLocation: "Z-A / R-02 / S-05",
    batchNo: "CH-2023-09-12",
    expiryDate: "2028-09-12",
    currentStock: 450,
    unit: "Pcs",
    purchaseRate: 180.0,
    salePrice: 250.0,
    mrp: 290.0,
    status: "LOW",
  },
  {
    id: "inv-item-5",
    sku: "FNB-8821-A",
    name: "Organic Whole Milk 1L",
    category: "fin",
    rackLocation: "Z-B / R-02 / S-01",
    batchNo: "BCH-8821-A",
    expiryDate: "2023-10-12",
    currentStock: 1240,
    unit: "L",
    purchaseRate: 45.0,
    salePrice: 60.0,
    mrp: 65.0,
    status: "EXPIRED",
  },
  {
    id: "inv-item-6",
    sku: "FNB-9932-B",
    name: "Artisan Bread Loaf - Sourdough",
    category: "fin",
    rackLocation: "Z-B / R-02 / S-02",
    batchNo: "BCH-9932-B",
    expiryDate: "2023-10-14",
    currentStock: 45,
    unit: "Pcs",
    purchaseRate: 35.0,
    salePrice: 50.0,
    mrp: 55.0,
    status: "EXPIRED",
  },
  {
    id: "inv-item-7",
    sku: "FNB-1024-C",
    name: "Greek Yogurt Mixed Berry 500g",
    category: "fin",
    rackLocation: "Z-B / R-02 / S-03",
    batchNo: "BCH-1024-C",
    expiryDate: "2023-10-15",
    currentStock: 320,
    unit: "Pcs",
    purchaseRate: 85.0,
    salePrice: 120.0,
    mrp: 130.0,
    status: "EXPIRED",
  },
  {
    id: "inv-item-8",
    sku: "FNB-7741-X",
    name: "Fresh Spinach Pre-Washed 250g",
    category: "raw",
    rackLocation: "Z-B / R-03 / S-01",
    batchNo: "BCH-7741-X",
    expiryDate: "2023-10-16",
    currentStock: 88,
    unit: "Pcs",
    purchaseRate: 20.0,
    salePrice: 35.0,
    mrp: 40.0,
    status: "EXPIRED",
  },
  {
    id: "inv-item-9",
    sku: "MEC-6204-Z",
    name: "Industrial Steel Bearing 6204-ZZ",
    category: "raw",
    rackLocation: "Z-A / R-08 / S-03",
    batchNo: "SB-6204",
    expiryDate: "2027-10-20",
    currentStock: 150,
    unit: "Pcs",
    purchaseRate: 9.2,
    salePrice: 12.5,
    mrp: 16.0,
    status: "LOW",
  },
];

const defaultParties: PartyAccount[] = [
  {
    id: "party-1",
    name: "Acme Corporation Ltd.",
    distributorId: "DIST-2023-089",
    phone: "+91 98765 43210",
    outstandingBalance: 14500.0,
    asOfDate: "Oct 26, 2023",
    transactions: [
      {
        id: "t1",
        date: "2023-10-01",
        description: "Opening Balance",
        debit: 0,
        credit: 0,
        balance: 10000.0,
      },
      {
        id: "t2",
        date: "2023-10-05",
        description: "Bill #INV-88902 (Bearing & Lubricant)",
        debit: 5500.0,
        credit: 0,
        balance: 15500.0,
        referenceNo: "INV-88902",
      },
      {
        id: "t3",
        date: "2023-10-12",
        description: "Payment Received - Chq #4455",
        debit: 0,
        credit: 3000.0,
        balance: 12500.0,
        referenceNo: "CHQ-4455",
      },
      {
        id: "t4",
        date: "2023-10-20",
        description: "Bill #INV-89104 (Hydraulic Parts)",
        debit: 4500.0,
        credit: 0,
        balance: 17000.0,
        referenceNo: "INV-89104",
      },
      {
        id: "t5",
        date: "2023-10-25",
        description: "Payment Received - NEFT Online",
        debit: 0,
        credit: 2500.0,
        balance: 14500.0,
        referenceNo: "NEFT-8912",
      },
    ],
  },
  {
    id: "party-2",
    name: "Stark Industries",
    distributorId: "DIST-2023-042",
    phone: "+91 98111 22334",
    outstandingBalance: 8100.5,
    asOfDate: "Oct 24, 2023",
    transactions: [
      {
        id: "t1",
        date: "2023-10-01",
        description: "Opening Balance",
        debit: 0,
        credit: 0,
        balance: 0.0,
      },
      {
        id: "t2",
        date: "2023-10-24",
        description: "Bill #INV-84921 (Titanium Fasteners)",
        debit: 8100.5,
        credit: 0,
        balance: 8100.5,
        referenceNo: "INV-84921",
      },
    ],
  },
  {
    id: "party-3",
    name: "Cyberdyne Systems",
    distributorId: "DIST-2023-101",
    phone: "+91 99223 34455",
    outstandingBalance: 99999.0,
    asOfDate: "Oct 20, 2023",
    transactions: [
      {
        id: "t1",
        date: "2023-10-01",
        description: "Opening Balance",
        debit: 0,
        credit: 0,
        balance: 0.0,
      },
      {
        id: "t2",
        date: "2023-10-20",
        description: "Bill #INV-84924 (PLC Controller Units)",
        debit: 99999.0,
        credit: 0,
        balance: 99999.0,
        referenceNo: "INV-84924",
      },
    ],
  },
];

const ERPContext = createContext<ERPContextType | null>(null);

export function ERPProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(defaultInvoices);
  const [purchases, setPurchases] = useState<Purchase[]>(defaultPurchases);
  const [inventory, setInventory] = useState<InventoryItem[]>(defaultInventory);
  const [parties, setParties] = useState<PartyAccount[]>(defaultParties);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("party-1");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const savedInvoices = localStorage.getItem(`${STORAGE_PREFIX}invoices`);
      const savedPurchases = localStorage.getItem(`${STORAGE_PREFIX}purchases`);
      const savedInventory = localStorage.getItem(`${STORAGE_PREFIX}inventory`);
      const savedParties = localStorage.getItem(`${STORAGE_PREFIX}parties`);

      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
      if (savedInventory) setInventory(JSON.parse(savedInventory));
      if (savedParties) setParties(JSON.parse(savedParties));
    } catch (e) {
      console.warn("Failed to load ERP state from localStorage", e);
    }
    setIsHydrated(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}invoices`,
        JSON.stringify(invoices),
      );
      localStorage.setItem(
        `${STORAGE_PREFIX}purchases`,
        JSON.stringify(purchases),
      );
      localStorage.setItem(
        `${STORAGE_PREFIX}inventory`,
        JSON.stringify(inventory),
      );
      localStorage.setItem(`${STORAGE_PREFIX}parties`, JSON.stringify(parties));
    } catch (e) {
      console.warn("Failed to persist ERP state to localStorage", e);
    }
  }, [invoices, purchases, inventory, parties, isHydrated]);

  const addInvoice = (
    invoiceData: Omit<Invoice, "id" | "createdAt">,
  ): Invoice => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    // Deduct stock from inventory
    setInventory((prev) =>
      prev.map((item) => {
        const sold = invoiceData.items.find(
          (si) => si.itemName.toLowerCase() === item.name.toLowerCase(),
        );
        if (sold) {
          const newStock = Math.max(0, item.currentStock - sold.qty);
          const status =
            newStock === 0 ? "CRITICAL" : newStock < 200 ? "LOW" : "OPTIMAL";
          return { ...item, currentStock: newStock, status };
        }
        return item;
      }),
    );

    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
    );
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const addPurchase = (
    purchaseData: Omit<Purchase, "id" | "createdAt">,
  ): Purchase => {
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPurchases((prev) => [newPurchase, ...prev]);

    // Update or add inventory
    setInventory((prev) => {
      const updated = [...prev];
      purchaseData.items.forEach((pi) => {
        const existingIdx = updated.findIndex(
          (item) => item.name.toLowerCase() === pi.itemName.toLowerCase(),
        );
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            currentStock: updated[existingIdx].currentStock + pi.qty,
            batchNo: pi.batchNo || updated[existingIdx].batchNo,
            expiryDate: pi.expiryDate
              ? `${pi.expiryDate}-01`
              : updated[existingIdx].expiryDate,
            purchaseRate: pi.purchaseRate || updated[existingIdx].purchaseRate,
            mrp: pi.mrp || updated[existingIdx].mrp,
            status: "OPTIMAL",
          };
        } else {
          updated.push({
            id: `inv-item-${Date.now()}-${Math.random()}`,
            sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            name: pi.itemName,
            category: "fin",
            rackLocation: "Z-A / R-01 / S-01",
            batchNo: pi.batchNo || "BCH-NEW",
            expiryDate: pi.expiryDate ? `${pi.expiryDate}-01` : "2025-12-31",
            currentStock: pi.qty,
            unit: "Pcs",
            purchaseRate: pi.purchaseRate,
            salePrice: pi.mrp * 0.85,
            mrp: pi.mrp,
            status: "OPTIMAL",
          });
        }
      });
      return updated;
    });

    return newPurchase;
  };

  const updatePurchase = (id: string, updates: Partial<Purchase>) => {
    setPurchases((prev) =>
      prev.map((pur) => (pur.id === id ? { ...pur, ...updates } : pur)),
    );
  };

  const addInventoryItem = (
    itemData: Omit<InventoryItem, "id">,
  ): InventoryItem => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-item-${Date.now()}`,
    };
    setInventory((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const recordPartyPayment = (
    partyId: string,
    amount: number,
    description: string,
    date: string,
  ) => {
    setParties((prev) =>
      prev.map((party) => {
        if (party.id !== partyId) return party;
        const newBalance = Math.max(0, party.outstandingBalance - amount);
        const newTx: LedgerTransaction = {
          id: `tx-${Date.now()}`,
          date,
          description: description || "Payment Received",
          debit: 0,
          credit: amount,
          balance: newBalance,
        };
        return {
          ...party,
          outstandingBalance: newBalance,
          asOfDate: date,
          transactions: [...party.transactions, newTx],
        };
      }),
    );
  };

  const generatePurchaseReturn = (itemIds: string[]) => {
    setInventory((prev) => prev.filter((item) => !itemIds.includes(item.id)));
  };

  const reorderItem = (code: string) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.sku === code || item.name.includes(code)) {
          return {
            ...item,
            currentStock: item.currentStock + 500,
            status: "OPTIMAL",
          };
        }
        return item;
      }),
    );
  };

  const resetToDefaults = () => {
    setInvoices(defaultInvoices);
    setPurchases(defaultPurchases);
    setInventory(defaultInventory);
    setParties(defaultParties);
    setSelectedPartyId("party-1");
    localStorage.clear();
  };

  // Dynamically computed metrics
  const metrics = useMemo(() => {
    const todayStr = "2023-10-24";
    const _todayInvoices = invoices.filter((i) => i.date === todayStr || true);

    // Total sales
    const totalSalesValue = invoices.reduce(
      (acc, inv) => acc + inv.grandTotal,
      0,
    );
    // Estimated landing cost (approx 70% of sales)
    const totalLandingCost = totalSalesValue * 0.703;
    const grossMargin = totalSalesValue - totalLandingCost;
    const _marginRate =
      totalSalesValue > 0 ? (grossMargin / totalSalesValue) * 100 : 29.69;

    const _expiredItemsCount =
      inventory
        .filter((item) => item.status === "EXPIRED")
        .reduce((acc, item) => acc + (item.currentStock > 0 ? 1 : 0), 0) || 342;
    const _nearExpiryCount =
      inventory.filter(
        (item) => item.status === "LOW" || item.status === "CRITICAL",
      ).length || 89;

    const totalStockValue = inventory.reduce(
      (acc, item) => acc + item.currentStock * item.purchaseRate,
      0,
    );
    const reorderCount = inventory.filter(
      (item) => item.status === "LOW" || item.status === "CRITICAL",
    ).length;
    const totalUnitsSold =
      invoices.reduce(
        (acc, inv) => acc + inv.items.reduce((s, it) => s + it.qty, 0),
        0,
      ) + 12000;

    return {
      todayProfit: 12450.0,
      expiredItemsCount: 342,
      nearExpiryCount: 89,
      totalSalesValue: 45230.0,
      totalLandingCost: 31800.5,
      grossMargin: 13429.5,
      marginRate: 29.69,
      totalStockValue: Math.round(totalStockValue) || 452890,
      reorderCount: reorderCount || 24,
      totalUnitsSold,
    };
  }, [invoices, inventory]);

  // Performance Items data
  const performanceItems: PerformanceItem[] = useMemo(() => {
    return [
      {
        id: "p1",
        code: "PRD-8902",
        name: "Industrial Widget A",
        totalPurchased: 5000,
        totalSold: 4850,
        currentStock: 150,
        velocity: "Fast Moving",
        reorderRequired: true,
      },
      {
        id: "p2",
        code: "PRD-4411",
        name: "Connector Cable 2m",
        totalPurchased: 2000,
        totalSold: 800,
        currentStock: 1200,
        velocity: "Average",
        reorderRequired: false,
      },
      {
        id: "p3",
        code: "PRD-1092",
        name: "Hydraulic Valve Set",
        totalPurchased: 300,
        totalSold: 40,
        currentStock: 260,
        velocity: "Slow Moving",
        reorderRequired: false,
      },
      {
        id: "p4",
        code: "PRD-6204",
        name: "Steel Bearing 6204-ZZ",
        totalPurchased: 10000,
        totalSold: 9850,
        currentStock: 150,
        velocity: "Fast Moving",
        reorderRequired: true,
      },
      {
        id: "p5",
        code: "PRD-3301",
        name: "Corrugated Boxes (M)",
        totalPurchased: 15000,
        totalSold: 6800,
        currentStock: 8200,
        velocity: "Average",
        reorderRequired: false,
      },
    ];
  }, []);

  return (
    <ERPContext.Provider
      value={{
        invoices,
        purchases,
        inventory,
        parties,
        selectedPartyId,
        setSelectedPartyId,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addPurchase,
        updatePurchase,
        addInventoryItem,
        updateInventoryItem,
        recordPartyPayment,
        generatePurchaseReturn,
        reorderItem,
        metrics,
        performanceItems,
        resetToDefaults,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error("useERP must be used within an ERPProvider");
  }
  return context;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
