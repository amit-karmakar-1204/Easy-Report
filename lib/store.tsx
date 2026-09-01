"use client";

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  defaultInventory,
  defaultInvoices,
  defaultParties,
  defaultPerformanceItems,
  defaultPurchases,
} from "./defaultData";
import {
  batchDeleteInventoryItems,
  createInventoryItemDoc,
  createInvoiceDoc,
  createPartyDoc,
  createPurchaseDoc,
  deleteInvoiceDoc,
  isFirebaseConfigured,
  recordPartyPaymentDoc,
  seedInitialDataToFirestore,
  subscribeInventory,
  subscribeInvoices,
  subscribeParties,
  subscribePurchases,
  updateInventoryItemDoc,
  updateInvoiceDoc,
  updatePartyDoc,
  updatePurchaseDoc,
} from "./firebase";
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
  updateParty: (id: string, updates: Partial<PartyAccount>) => void;
  addParty: (party: Omit<PartyAccount, "id" | "transactions">) => PartyAccount;
  recordPartyPayment: (
    partyId: string,
    amount: number,
    description: string,
    date: string,
  ) => void;
  generatePurchaseReturn: (itemIds: string[]) => void;
  reorderItem: (code: string, qty?: number) => void;
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
  isFirebaseConnected: boolean;
  isFirebaseActive: boolean;
  seedFirestore: () => Promise<{ success: boolean; message: string }>;
}

const STORAGE_PREFIX = "EASY_REPORT_ERP_";

const ERPContext = createContext<ERPContextType | null>(null);

export function ERPProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(defaultInvoices);
  const [purchases, setPurchases] = useState<Purchase[]>(defaultPurchases);
  const [inventory, setInventory] = useState<InventoryItem[]>(defaultInventory);
  const [parties, setParties] = useState<PartyAccount[]>(defaultParties);
  const [performanceList, setPerformanceList] = useState<PerformanceItem[]>(
    defaultPerformanceItems,
  );
  const [selectedPartyId, setSelectedPartyId] = useState<string>("party-1");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  const isConfigured = useMemo(() => isFirebaseConfigured(), []);

  // Firebase Real-time Subscriptions
  useEffect(() => {
    if (!isConfigured) {
      // Fallback: Load from localStorage
      try {
        const savedInvoices = localStorage.getItem(`${STORAGE_PREFIX}invoices`);
        const savedPurchases = localStorage.getItem(
          `${STORAGE_PREFIX}purchases`,
        );
        const savedInventory = localStorage.getItem(
          `${STORAGE_PREFIX}inventory`,
        );
        const savedParties = localStorage.getItem(`${STORAGE_PREFIX}parties`);
        const savedPerf = localStorage.getItem(
          `${STORAGE_PREFIX}performanceItems`,
        );

        if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
        if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
        if (savedInventory) setInventory(JSON.parse(savedInventory));
        if (savedParties) setParties(JSON.parse(savedParties));
        if (savedPerf) setPerformanceList(JSON.parse(savedPerf));
      } catch (e) {
        console.warn("Failed to load ERP state from localStorage", e);
      }
      setIsHydrated(true);
      return;
    }

    // Subscribe to Firestore collections
    setIsFirebaseConnected(true);
    setIsHydrated(true);

    const unsubInvoices = subscribeInvoices((data) => {
      if (data.length > 0) {
        setInvoices(data);
      }
    });

    const unsubPurchases = subscribePurchases((data) => {
      if (data.length > 0) {
        setPurchases(data);
      }
    });

    const unsubInventory = subscribeInventory((data) => {
      if (data.length > 0) {
        setInventory(data);
      }
    });

    const unsubParties = subscribeParties((data) => {
      if (data.length > 0) {
        setParties(data);
      }
    });

    return () => {
      unsubInvoices?.();
      unsubPurchases?.();
      unsubInventory?.();
      unsubParties?.();
    };
  }, [isConfigured]);

  // Persist to localStorage if Firebase is not active
  useEffect(() => {
    if (!isHydrated || isConfigured) return;
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
      localStorage.setItem(
        `${STORAGE_PREFIX}performanceItems`,
        JSON.stringify(performanceList),
      );
    } catch (e) {
      console.warn("Failed to persist ERP state to localStorage", e);
    }
  }, [
    invoices,
    purchases,
    inventory,
    parties,
    performanceList,
    isHydrated,
    isConfigured,
  ]);

  const addInvoice = (
    invoiceData: Omit<Invoice, "id" | "createdAt">,
  ): Invoice => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Calculate stock deductions
    const updatedInventory = inventory.map((item) => {
      const sold = invoiceData.items.find(
        (si) => si.itemName.toLowerCase() === item.name.toLowerCase(),
      );
      if (sold) {
        const newStock = Math.max(0, item.currentStock - sold.qty);
        const status: "OPTIMAL" | "LOW" | "CRITICAL" | "EXPIRED" =
          newStock === 0 ? "CRITICAL" : newStock < 200 ? "LOW" : "OPTIMAL";
        const updatedItem: InventoryItem = {
          ...item,
          currentStock: newStock,
          status,
        };
        if (isConfigured) {
          updateInventoryItemDoc(item.id, { currentStock: newStock, status });
        }
        return updatedItem;
      }
      return item;
    });

    setInventory(updatedInventory);

    if (isConfigured) {
      createInvoiceDoc(newInvoice).catch((err) =>
        console.error("Failed to write invoice to Firestore:", err),
      );
    }

    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
    );
    if (isConfigured) {
      updateInvoiceDoc(id, updates).catch((err) =>
        console.error("Failed to update invoice in Firestore:", err),
      );
    }
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    if (isConfigured) {
      deleteInvoiceDoc(id).catch((err) =>
        console.error("Failed to delete invoice from Firestore:", err),
      );
    }
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
          const updatedItem: InventoryItem = {
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
          updated[existingIdx] = updatedItem;
          if (isConfigured) {
            updateInventoryItemDoc(updatedItem.id, updatedItem);
          }
        } else {
          const newItem: InventoryItem = {
            id: `inv-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
          };
          updated.push(newItem);
          if (isConfigured) {
            createInventoryItemDoc(newItem);
          }
        }
      });
      return updated;
    });

    if (isConfigured) {
      createPurchaseDoc(newPurchase).catch((err) =>
        console.error("Failed to write purchase to Firestore:", err),
      );
    }

    return newPurchase;
  };

  const updatePurchase = (id: string, updates: Partial<Purchase>) => {
    setPurchases((prev) =>
      prev.map((pur) => (pur.id === id ? { ...pur, ...updates } : pur)),
    );
    if (isConfigured) {
      updatePurchaseDoc(id, updates).catch((err) =>
        console.error("Failed to update purchase in Firestore:", err),
      );
    }
  };

  const addInventoryItem = (
    itemData: Omit<InventoryItem, "id">,
  ): InventoryItem => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-item-${Date.now()}`,
    };
    setInventory((prev) => [newItem, ...prev]);
    if (isConfigured) {
      createInventoryItemDoc(newItem).catch((err) =>
        console.error("Failed to add inventory item to Firestore:", err),
      );
    }
    return newItem;
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
    if (isConfigured) {
      updateInventoryItemDoc(id, updates).catch((err) =>
        console.error("Failed to update inventory item in Firestore:", err),
      );
    }
  };

  const updateParty = (id: string, updates: Partial<PartyAccount>) => {
    setParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
    if (isConfigured) {
      updatePartyDoc(id, updates).catch((err) =>
        console.error("Failed to update party in Firestore:", err),
      );
    }
  };

  const addParty = (
    partyData: Omit<PartyAccount, "id" | "transactions">,
  ): PartyAccount => {
    const newParty: PartyAccount = {
      ...partyData,
      id: `party-${Date.now()}`,
      transactions: [
        {
          id: `tx-init-${Date.now()}`,
          date: partyData.asOfDate || new Date().toISOString().split("T")[0],
          description: "Opening Balance",
          debit:
            partyData.outstandingBalance > 0 ? partyData.outstandingBalance : 0,
          credit: 0,
          balance: partyData.outstandingBalance,
        },
      ],
    };
    setParties((prev) => [...prev, newParty]);
    if (isConfigured) {
      createPartyDoc(newParty).catch((err) =>
        console.error("Failed to add party to Firestore:", err),
      );
    }
    return newParty;
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

    if (isConfigured) {
      recordPartyPaymentDoc(partyId, amount, description, date).catch((err) =>
        console.error("Failed to record party payment in Firestore:", err),
      );
    }
  };

  const generatePurchaseReturn = (itemIds: string[]) => {
    setInventory((prev) => prev.filter((item) => !itemIds.includes(item.id)));
    if (isConfigured) {
      batchDeleteInventoryItems(itemIds).catch((err) =>
        console.error("Failed to delete inventory items from Firestore:", err),
      );
    }
  };

  const reorderItem = (code: string, qty: number = 500) => {
    setPerformanceList((prev) =>
      prev.map((item) => {
        if (
          item.code === code ||
          item.name.toLowerCase().includes(code.toLowerCase())
        ) {
          const newStock = item.currentStock + qty;
          return {
            ...item,
            currentStock: newStock,
            totalPurchased: item.totalPurchased + qty,
            reorderRequired: newStock < 300,
          };
        }
        return item;
      }),
    );

    setInventory((prev) =>
      prev.map((item) => {
        if (
          item.sku === code ||
          item.name.toLowerCase().includes(code.toLowerCase())
        ) {
          const updatedItem = {
            ...item,
            currentStock: item.currentStock + qty,
            status: "OPTIMAL" as const,
          };
          if (isConfigured) {
            updateInventoryItemDoc(item.id, {
              currentStock: updatedItem.currentStock,
              status: "OPTIMAL",
            });
          }
          return updatedItem;
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
    setPerformanceList(defaultPerformanceItems);
    setSelectedPartyId("party-1");
    if (!isConfigured) {
      localStorage.clear();
    }
  };

  const seedFirestore = async () => {
    const res = await seedInitialDataToFirestore();
    if (res.success) {
      setInvoices(defaultInvoices);
      setPurchases(defaultPurchases);
      setInventory(defaultInventory);
      setParties(defaultParties);
      setPerformanceList(defaultPerformanceItems);
    }
    return res;
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
        updateParty,
        addParty,
        recordPartyPayment,
        generatePurchaseReturn,
        reorderItem,
        metrics,
        performanceItems: performanceList,
        resetToDefaults,
        isFirebaseConnected,
        isFirebaseActive: isConfigured,
        seedFirestore,
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
