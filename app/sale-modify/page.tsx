"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileEdit,
  Plus,
  Receipt,
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
import type {
  Invoice,
  InvoiceStatus,
  PaymentType,
  SaleItem,
} from "@/lib/types";

export default function SaleModifyPage() {
  const { invoices, updateInvoice, deleteInvoice, inventory, parties } =
    useERP();

  // Search filters
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | InvoiceStatus>(
    "All",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected invoice for edit modal
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editCustomer, setEditCustomer] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPaymentType, setEditPaymentType] = useState<PaymentType>("cash");
  const [editStatus, setEditStatus] = useState<InvoiceStatus>("Paid");
  const [editItems, setEditItems] = useState<SaleItem[]>([]);

  // Add new item within edit modal
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemRate, setNewItemRate] = useState("");
  const [newItemDisc, setNewItemDisc] = useState("0");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchQuery =
        !searchQuery.trim() ||
        inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStart = !startDate || inv.date >= startDate;
      const matchEnd = !endDate || inv.date <= endDate;
      const matchStatus = statusFilter === "All" || inv.status === statusFilter;

      return matchQuery && matchStart && matchEnd && matchStatus;
    });
  }, [invoices, searchQuery, startDate, endDate, statusFilter]);

  // Pagination calculation
  const totalEntries = filteredInvoices.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  const handleReset = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditCustomer(inv.customerName);
    setEditDate(inv.date);
    setEditPaymentType(inv.paymentType);
    setEditStatus(inv.status);
    setEditItems(JSON.parse(JSON.stringify(inv.items))); // deep clone
    setNewItemName("");
    setNewItemQty(1);
    setNewItemRate("");
    setNewItemDisc("0");
  };

  // Line item editing inside modal
  const handleUpdateItem = (
    index: number,
    field: keyof SaleItem,
    value: string | number,
  ) => {
    setEditItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };
      const qty =
        field === "qty" ? parseFloat(String(value)) || 0 : current.qty;
      const rate =
        field === "rate" ? parseFloat(String(value)) || 0 : current.rate;
      const disc =
        field === "discount"
          ? parseFloat(String(value)) || 0
          : current.discount;
      current.total = Math.round(qty * rate * (1 - disc / 100) * 100) / 100;
      updated[index] = current;
      return updated;
    });
  };

  const handleRemoveItemFromEdit = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItemToEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      alert("Please enter an item name");
      return;
    }
    const rateNum = parseFloat(newItemRate) || 0;
    const discNum = parseFloat(newItemDisc) || 0;
    const qtyNum = newItemQty > 0 ? newItemQty : 1;
    const total =
      Math.round(qtyNum * rateNum * (1 - discNum / 100) * 100) / 100;

    const newItem: SaleItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      itemName: newItemName.trim(),
      barcode: `BAR-${Math.floor(1000 + Math.random() * 9000)}`,
      qty: qtyNum,
      rate: rateNum,
      discount: discNum,
      total,
    };

    setEditItems((prev) => [...prev, newItem]);
    setNewItemName("");
    setNewItemQty(1);
    setNewItemRate("");
    setNewItemDisc("0");
  };

  // Calculations for edit modal
  const editSubtotal = editItems.reduce((s, it) => s + it.total, 0);
  const editTax = editSubtotal * 0.1;
  const editGrandTotal = editSubtotal + editTax;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if (editItems.length === 0) {
      alert("Invoice must contain at least one line item.");
      return;
    }

    updateInvoice(editingInvoice.id, {
      customerName: editCustomer,
      date: editDate,
      paymentType: editPaymentType,
      status: editStatus,
      items: editItems,
      subtotal: editSubtotal,
      tax: editTax,
      grandTotal: editGrandTotal,
    });

    setToastMessage(
      `Invoice ${editingInvoice.invoiceNo} successfully updated!`,
    );
    setTimeout(() => setToastMessage(null), 3000);
    setEditingInvoice(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice record?")) {
      deleteInvoice(id);
      setToastMessage("Invoice record deleted.");
      setTimeout(() => setToastMessage(null), 3000);
      if (editingInvoice?.id === id) {
        setEditingInvoice(null);
      }
    }
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
              Invoice Search List (Sale Modify)
            </h1>
            <p className="text-xs text-on-surface-variant">
              Lookup, review, and modify registered customer invoices
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-on-surface-variant">Fiscal Year: 2023-24</span>
          <span className="w-1 h-1 rounded-full bg-outline"></span>
          <span className="text-secondary font-semibold">System Online</span>
          <Link
            href="/sale"
            className="ml-2 px-3 py-1.5 bg-primary text-on-primary font-semibold rounded-sm hover:opacity-90 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New Sale
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

      {/* Filter Control Box */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Query */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-on-surface uppercase tracking-wider mb-1">
              Search Query
            </label>
            <div className="relative">
              <Receipt className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Invoice Number or Customer Name"
                className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-outline-variant rounded-sm font-code focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold text-on-surface uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-surface border border-outline-variant rounded-sm font-code focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold text-on-surface uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-surface border border-outline-variant rounded-sm font-code focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-outline-variant">
          {/* Quick status tabs */}
          <div className="flex items-center gap-1 text-xs">
            {(["All", "Paid", "Pending", "Overdue"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-xs font-semibold text-[11px] transition-colors cursor-pointer ${
                  statusFilter === status
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 border border-outline-variant text-on-surface text-xs font-semibold rounded-sm hover:bg-surface-container-high transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" /> Execute Search
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider">
                  Date
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider">
                  Customer
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Total Amount
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider">
                  Status
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    <Search className="w-8 h-8 mx-auto mb-2 text-outline" />
                    <p className="font-semibold">
                      No invoices match your filter criteria
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-2 text-xs text-primary font-semibold underline cursor-pointer"
                    >
                      Clear Search Filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-surface-container-low cursor-pointer transition-colors group"
                  >
                    <td
                      onClick={() => handleOpenEdit(inv)}
                      className="py-3 px-4 font-code font-bold text-primary group-hover:underline"
                    >
                      {inv.invoiceNo}
                    </td>
                    <td
                      onClick={() => handleOpenEdit(inv)}
                      className="py-3 px-4 text-on-surface-variant"
                    >
                      {inv.date}
                    </td>
                    <td
                      onClick={() => handleOpenEdit(inv)}
                      className="py-3 px-4 font-medium text-on-surface"
                    >
                      {inv.customerName}
                    </td>
                    <td
                      onClick={() => handleOpenEdit(inv)}
                      className="py-3 px-4 font-code font-bold text-right text-on-surface"
                    >
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-xs font-bold text-[10px] uppercase tracking-wider ${
                            inv.status === "Paid"
                              ? "bg-secondary-container text-on-secondary-container"
                              : inv.status === "Pending"
                                ? "bg-tertiary-fixed text-on-tertiary-fixed"
                                : "bg-error-container text-on-error-container"
                          }`}
                        >
                          {inv.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(inv);
                          }}
                          className="text-on-surface-variant hover:text-primary p-0.5 cursor-pointer"
                          title="Modify invoice details"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(inv);
                          }}
                          className="text-on-surface-variant hover:text-primary transition-colors p-1 cursor-pointer"
                          title="Modify Invoice"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(inv.id);
                          }}
                          className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-surface-container-low border-t border-outline-variant p-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-on-surface-variant text-xs">
          <span>
            Showing{" "}
            {totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalEntries)} of{" "}
            {totalEntries} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-outline-variant rounded-xs hover:bg-surface-container-high disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCurrentPage(num)}
                className={`w-6 h-6 flex items-center justify-center rounded-xs text-xs font-semibold cursor-pointer ${
                  currentPage === num
                    ? "bg-primary text-on-primary"
                    : "hover:bg-surface-container-high"
                }`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2 py-1 border border-outline-variant rounded-xs hover:bg-surface-container-high disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Full-Featured Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-sm max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-outline-variant pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-primary">
                  Modify Invoice
                </h3>
                <p className="text-xs text-on-surface-variant font-code mt-0.5">
                  Editing record: {editingInvoice.invoiceNo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="text-on-surface-variant hover:text-primary cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              className="space-y-4 text-xs flex-1 overflow-y-auto pr-1"
            >
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-container-low p-3 rounded-sm">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    list="modalPartyList"
                    value={editCustomer}
                    onChange={(e) => setEditCustomer(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-medium"
                  />
                  <datalist id="modalPartyList">
                    <option value="Cash Customer" />
                    {parties.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Invoice Date
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
                    Payment Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as InvoiceStatus)
                    }
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-bold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Line Items Management Table */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">
                    Line Items in Invoice ({editItems.length})
                  </label>
                  <span className="text-[11px] text-on-surface-variant font-code">
                    Editable Qty & Rates
                  </span>
                </div>

                <div className="border border-outline-variant rounded-sm overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-surface-container-low sticky top-0 border-b border-outline-variant text-[10px]">
                      <tr>
                        <th className="py-2 px-3 font-bold text-on-surface-variant">
                          Item Description
                        </th>
                        <th className="py-2 px-2 font-bold text-on-surface-variant w-16 text-right">
                          Qty
                        </th>
                        <th className="py-2 px-2 font-bold text-on-surface-variant w-20 text-right">
                          Rate (₹)
                        </th>
                        <th className="py-2 px-2 font-bold text-on-surface-variant w-16 text-right">
                          Disc%
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
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) =>
                                handleUpdateItem(idx, "qty", e.target.value)
                              }
                              className="w-full text-right bg-surface border border-outline-variant rounded-xs px-1 py-0.5 font-code"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) =>
                                handleUpdateItem(idx, "rate", e.target.value)
                              }
                              className="w-full text-right bg-surface border border-outline-variant rounded-xs px-1 py-0.5 font-code"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              step="0.1"
                              value={item.discount}
                              onChange={(e) =>
                                handleUpdateItem(
                                  idx,
                                  "discount",
                                  e.target.value,
                                )
                              }
                              className="w-full text-right bg-surface border border-outline-variant rounded-xs px-1 py-0.5 font-code"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-right font-code font-bold text-primary">
                            ₹{item.total.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromEdit(idx)}
                              className="text-on-surface-variant hover:text-error transition-colors p-1"
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
                  + Add Line Item
                </span>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <input
                      type="text"
                      list="inventoryModalItems"
                      placeholder="Item name / search"
                      value={newItemName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewItemName(val);
                        const match = inventory.find(
                          (inv) => inv.name.toLowerCase() === val.toLowerCase(),
                        );
                        if (match) setNewItemRate(match.salePrice.toString());
                      }}
                      className="w-full px-2 py-1 bg-surface border border-outline-variant rounded-xs text-xs"
                    />
                    <datalist id="inventoryModalItems">
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-span-2">
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
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Disc%"
                      value={newItemDisc}
                      onChange={(e) => setNewItemDisc(e.target.value)}
                      className="w-full px-2 py-1 bg-surface border border-outline-variant rounded-xs text-xs text-right font-code"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={handleAddItemToEdit}
                      className="w-full py-1 bg-primary text-on-primary rounded-xs text-xs font-bold hover:opacity-90 flex items-center justify-center h-[26px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="bg-surface-container-low p-3 rounded-sm flex justify-between items-center text-xs">
                <div className="text-on-surface-variant">
                  Items:{" "}
                  <span className="font-bold text-on-surface">
                    {editItems.length}
                  </span>
                </div>
                <div className="flex gap-4 font-code text-right">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">
                      Subtotal:
                    </span>
                    <span className="font-semibold">
                      ₹{editSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">
                      Tax (10%):
                    </span>
                    <span className="font-semibold">₹{editTax.toFixed(2)}</span>
                  </div>
                  <div className="border-l border-outline-variant pl-3">
                    <span className="text-[10px] text-primary font-bold block">
                      Grand Total:
                    </span>
                    <span className="font-bold text-sm text-primary">
                      ₹{editGrandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-outline-variant shrink-0">
                <button
                  type="button"
                  onClick={() => handleDelete(editingInvoice.id)}
                  className="px-3.5 py-2 bg-error-container text-on-error-container font-semibold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Invoice
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingInvoice(null)}
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
