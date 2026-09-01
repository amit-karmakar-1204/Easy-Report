export type PaymentType = "cash" | "credit";

export type InvoiceStatus = "Paid" | "Pending" | "Overdue";

export interface SaleItem {
  id: string;
  itemName: string;
  barcode?: string;
  qty: number;
  rate: number;
  discount: number; // percentage
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  paymentType: PaymentType;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  status: InvoiceStatus;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  itemName: string;
  batchNo: string;
  expiryDate: string; // YYYY-MM
  purchaseRate: number;
  mrp: number;
  qty: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchaseId: string;
  date: string;
  supplierName: string;
  items: PurchaseItem[];
  totalCost: number;
  status: "Completed" | "Pending" | "Cancelled";
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: "raw" | "pkg" | "fin";
  rackLocation: string;
  batchNo: string;
  expiryDate: string; // YYYY-MM-DD
  currentStock: number;
  unit: string;
  purchaseRate: number;
  salePrice: number;
  mrp: number;
  status: "OPTIMAL" | "LOW" | "CRITICAL" | "EXPIRED";
}

export interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  referenceNo?: string;
}

export interface PartyAccount {
  id: string;
  name: string;
  distributorId: string;
  phone?: string;
  outstandingBalance: number;
  asOfDate: string;
  transactions: LedgerTransaction[];
}

export interface PerformanceItem {
  id: string;
  code: string;
  name: string;
  totalPurchased: number;
  totalSold: number;
  currentStock: number;
  velocity: "Fast Moving" | "Average" | "Slow Moving";
  reorderRequired: boolean;
}
