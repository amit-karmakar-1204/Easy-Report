"use client";

import {
  ArrowLeft,
  Banknote,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileEdit,
  FileText,
  Mail,
  MapPin,
  Percent,
  Phone,
  Plus,
  QrCode,
  Receipt,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { formatINR, useERP } from "@/lib/store";
import type { PartyAccount } from "@/lib/types";

export default function LedgerAccountBookPage() {
  const {
    parties,
    selectedPartyId,
    setSelectedPartyId,
    recordPartyPayment,
    updateParty,
    addParty,
  } = useERP();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<
    "NEFT" | "UPI" | "CHEQUE" | "CASH"
  >("NEFT");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("NEFT-");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentNotes, setPaymentNotes] = useState("");

  // Edit Party Modal State
  const [showEditPartyModal, setShowEditPartyModal] = useState(false);
  const [editTab, setEditTab] = useState<"profile" | "compliance" | "balance">(
    "profile",
  );
  const [editName, setEditName] = useState("");
  const [editDistributorId, setEditDistributorId] = useState("");
  const [editPartyType, setEditPartyType] = useState<
    "customer" | "distributor" | "vendor"
  >("distributor");
  const [editPhone, setEditPhone] = useState("");
  const [editAlternatePhone, setEditAlternatePhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editGstin, setEditGstin] = useState("");
  const [editCreditLimit, setEditCreditLimit] = useState("");
  const [editPaymentTerms, setEditPaymentTerms] = useState("Net 30 Days");
  const [editBalance, setEditBalance] = useState("");
  const [editBalanceReason, setEditBalanceReason] = useState(
    "Opening Balance Reconciliation",
  );

  // Add Party Modal State
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDistributorId, setNewDistributorId] = useState("");
  const [newPartyType, setNewPartyType] = useState<
    "customer" | "distributor" | "vendor"
  >("customer");
  const [newPhone, setNewPhone] = useState("");
  const [newAlternatePhone, setNewAlternatePhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newGstin, setNewGstin] = useState("");
  const [newCreditLimit, setNewCreditLimit] = useState("100000");
  const [newPaymentTerms, setNewPaymentTerms] = useState("Net 30 Days");
  const [newOpeningBalance, setNewOpeningBalance] = useState("0");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentParty = useMemo(() => {
    return parties.find((p) => p.id === selectedPartyId) || parties[0];
  }, [parties, selectedPartyId]);

  // Handle Modal Keyboard Listeners & Body Scroll Lock
  useEffect(() => {
    if (!showPaymentModal && !showEditPartyModal && !showAddPartyModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPaymentModal(false);
        setShowEditPartyModal(false);
        setShowAddPartyModal(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (showPaymentModal) {
          const form = document.getElementById(
            "payment-modal-form",
          ) as HTMLFormElement | null;
          if (form) form.requestSubmit();
        } else if (showEditPartyModal) {
          const form = document.getElementById(
            "edit-party-form",
          ) as HTMLFormElement | null;
          if (form) form.requestSubmit();
        } else if (showAddPartyModal) {
          const form = document.getElementById(
            "add-party-form",
          ) as HTMLFormElement | null;
          if (form) form.requestSubmit();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [showPaymentModal, showEditPartyModal, showAddPartyModal]);

  const filteredTransactions = useMemo(() => {
    if (!currentParty) return [];
    return currentParty.transactions.filter((tx) => {
      const matchStart = !startDate || tx.date >= startDate;
      const matchEnd = !endDate || tx.date <= endDate;
      return matchStart && matchEnd;
    });
  }, [currentParty, startDate, endDate]);

  const handleOpenEditParty = () => {
    if (!currentParty) return;
    setEditTab("profile");
    setEditName(currentParty.name);
    setEditDistributorId(currentParty.distributorId);
    setEditPartyType(currentParty.partyType || "distributor");
    setEditPhone(currentParty.phone || "");
    setEditAlternatePhone(currentParty.alternatePhone || "");
    setEditEmail(currentParty.email || "");
    setEditAddress(currentParty.address || "");
    setEditGstin(currentParty.gstin || "");
    setEditCreditLimit((currentParty.creditLimit || 100000).toString());
    setEditPaymentTerms(currentParty.paymentTerms || "Net 30 Days");
    setEditBalance(currentParty.outstandingBalance.toString());
    setEditBalanceReason("Opening Balance Reconciliation");
    setShowEditPartyModal(true);
  };

  const handleSavePartyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParty) return;

    const cleanPhone = editPhone.replace(/\D/g, "").slice(0, 10);
    const cleanAltPhone = editAlternatePhone.replace(/\D/g, "").slice(0, 10);

    if (editPhone.trim() && cleanPhone.length !== 10) {
      alert("Primary phone number must be exactly 10 digits.");
      return;
    }

    if (editAlternatePhone.trim() && cleanAltPhone.length !== 10) {
      alert("Alternate phone number must be exactly 10 digits.");
      return;
    }

    const balanceNum =
      parseFloat(editBalance) >= 0
        ? parseFloat(editBalance)
        : currentParty.outstandingBalance;
    const creditLimitNum =
      parseFloat(editCreditLimit) > 0 ? parseFloat(editCreditLimit) : 100000;

    updateParty(currentParty.id, {
      name: editName,
      distributorId: editDistributorId,
      partyType: editPartyType,
      phone: cleanPhone,
      alternatePhone: cleanAltPhone,
      email: editEmail,
      address: editAddress,
      gstin: editGstin,
      creditLimit: creditLimitNum,
      paymentTerms: editPaymentTerms,
      outstandingBalance: balanceNum,
    });

    setToastMessage(`Account details for "${editName}" updated successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
    setShowEditPartyModal(false);
  };

  const handleSaveNewParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const cleanPhone = newPhone.replace(/\D/g, "").slice(0, 10);
    const cleanAltPhone = newAlternatePhone.replace(/\D/g, "").slice(0, 10);

    if (newPhone.trim() && cleanPhone.length !== 10) {
      alert("Primary phone number must be exactly 10 digits.");
      return;
    }

    if (newAlternatePhone.trim() && cleanAltPhone.length !== 10) {
      alert("Alternate phone number must be exactly 10 digits.");
      return;
    }

    const openingBal = parseFloat(newOpeningBalance) || 0;
    const creditLim = parseFloat(newCreditLimit) || 100000;
    const generatedDistId =
      newDistributorId.trim() ||
      `${newPartyType === "customer" ? "CUST" : newPartyType === "vendor" ? "VND" : "DIST"}-${Date.now().toString().slice(-4)}`;

    const created = addParty({
      name: newName.trim(),
      distributorId: generatedDistId,
      partyType: newPartyType,
      phone: cleanPhone,
      alternatePhone: cleanAltPhone,
      email: newEmail.trim(),
      address: newAddress.trim(),
      gstin: newGstin.trim(),
      creditLimit: creditLim,
      paymentTerms: newPaymentTerms,
      outstandingBalance: openingBal,
      asOfDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });

    setSelectedPartyId(created.id);
    setToastMessage(`New account "${created.name}" created successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
    setShowAddPartyModal(false);

    // Reset form
    setNewName("");
    setNewDistributorId("");
    setNewPartyType("customer");
    setNewPhone("");
    setNewAlternatePhone("");
    setNewEmail("");
    setNewAddress("");
    setNewGstin("");
    setNewCreditLimit("100000");
    setNewOpeningBalance("0");
  };

  const handlePaymentModeChange = (
    mode: "NEFT" | "UPI" | "CHEQUE" | "CASH",
  ) => {
    setPaymentMode(mode);
    if (mode === "NEFT") setPaymentRef("NEFT-");
    else if (mode === "UPI") setPaymentRef("UPI-");
    else if (mode === "CHEQUE") setPaymentRef("CHQ-");
    else if (mode === "CASH") setPaymentRef("CASH-RCPT-");
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Please enter a valid positive payment amount");
      return;
    }

    const description = `Payment Received (${paymentMode}) - ${paymentRef}${
      paymentNotes ? ` [${paymentNotes}]` : ""
    }`;

    recordPartyPayment(currentParty.id, amountNum, description, paymentDate);

    setToastMessage(
      `Payment receipt of ${formatINR(amountNum)} recorded for ${currentParty.name}`,
    );
    setTimeout(() => setToastMessage(null), 3000);

    setShowPaymentModal(false);
    setPaymentAmount("");
    setPaymentRef("NEFT-");
    setPaymentNotes("");
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const creditLimit = currentParty?.creditLimit || 100000;
  const utilizationPct = Math.min(
    100,
    Math.round(((currentParty?.outstandingBalance || 0) / creditLimit) * 100),
  );

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
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Ledger Account Book (Party Khata)
            </h1>
            <p className="text-xs text-on-surface-variant">
              Customer, Distributor & Vendor ledger accounts, credit monitoring,
              and settlement vouchers
            </p>
          </div>
        </div>

        {/* Distributor Switcher & Add Party */}
        <div className="flex items-center gap-2 text-xs">
          <label className="font-bold text-on-surface-variant uppercase shrink-0">
            Switch Party:
          </label>
          <select
            value={selectedPartyId}
            onChange={(e) => setSelectedPartyId(e.target.value)}
            className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-sm font-semibold text-primary focus:border-primary outline-none"
          >
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.distributorId})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAddPartyModal(true)}
            className="px-3 py-1.5 bg-primary text-on-primary font-semibold text-xs rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            title="Create New Account"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add Party</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-primary text-on-primary border border-outline px-4 py-2.5 rounded-sm text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-secondary-container" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Header Card */}
      {currentParty && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
          <div className="p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded">
                  {currentParty.partyType === "customer"
                    ? "Customer Account"
                    : currentParty.partyType === "vendor"
                      ? "Vendor / Supplier Account"
                      : "Distributor / Stockist"}
                </span>
                <span className="font-code text-xs font-semibold text-primary">
                  ID: {currentParty.distributorId}
                </span>
                {currentParty.paymentTerms && (
                  <span className="text-[10px] bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded font-medium">
                    {currentParty.paymentTerms}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary">
                {currentParty.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                {(currentParty.phone || currentParty.alternatePhone) && (
                  <span className="flex items-center gap-1 font-code">
                    <Phone className="w-3 h-3 text-on-surface-variant" />{" "}
                    {currentParty.phone || ""}
                    {currentParty.alternatePhone && (
                      <span className="text-on-surface-variant/80 font-normal">
                        {currentParty.phone
                          ? ` / ${currentParty.alternatePhone}`
                          : currentParty.alternatePhone}
                      </span>
                    )}
                  </span>
                )}
                {currentParty.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-on-surface-variant" />{" "}
                    {currentParty.email}
                  </span>
                )}
                {currentParty.gstin && (
                  <span className="font-code font-medium bg-surface-container px-1.5 py-0.5 rounded text-[11px]">
                    GSTIN: {currentParty.gstin}
                  </span>
                )}
              </div>
            </div>

            {/* Balances & Credit Limit Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              {/* Credit Limit Meter */}
              <div className="bg-surface-container-low p-3 rounded-sm border border-outline-variant min-w-[210px] w-full sm:w-auto">
                <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant mb-1">
                  <span>Approved Credit Limit</span>
                  <span className="font-code font-bold text-primary">
                    {formatINR(creditLimit)}
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      utilizationPct > 80
                        ? "bg-error"
                        : utilizationPct > 50
                          ? "bg-amber-500"
                          : "bg-secondary"
                    }`}
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-1.5">
                  <span className="font-semibold">
                    {utilizationPct}% Utilized
                  </span>
                  <span>
                    Available:{" "}
                    <strong className="text-primary font-code">
                      {formatINR(
                        Math.max(
                          0,
                          creditLimit - currentParty.outstandingBalance,
                        ),
                      )}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Outstanding Balance */}
              <div className="text-left sm:text-right bg-surface-container-low p-3 rounded-sm border border-outline-variant min-w-[180px] w-full sm:w-auto">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                  Current Balance Due
                </p>
                <h2 className="text-2xl font-bold text-error font-code tracking-tight">
                  {formatINR(currentParty.outstandingBalance)}
                </h2>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  As of {currentParty.asOfDate}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant p-3 bg-surface-container-low flex flex-wrap gap-2.5">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-primary text-on-primary text-xs font-semibold px-4 py-2 rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" /> Record Payment
            </button>
            <button
              onClick={handleOpenEditParty}
              className="bg-surface-container-highest text-on-surface text-xs font-semibold px-4 py-2 rounded-sm border border-outline-variant hover:bg-outline-variant transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5 text-primary" /> Edit Party
              Profile
            </button>
            <button
              onClick={() => setShowAddPartyModal(true)}
              className="bg-surface-container-highest text-on-surface text-xs font-semibold px-4 py-2 rounded-sm border border-outline-variant hover:bg-outline-variant transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-secondary" /> New Account
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-surface-container-highest text-on-surface text-xs font-semibold px-4 py-2 rounded-sm border border-outline-variant hover:bg-outline-variant transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Download className="w-3.5 h-3.5" /> Print Statement
            </button>
          </div>
        </div>
      )}

      {/* Statement Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
        <div className="border-b border-outline-variant p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-lowest">
          <div>
            <h3 className="font-bold text-sm text-on-surface">
              Statement & Transaction Ledger
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Chronological ledger of debits (invoices), credits (receipts), and
              net running balances
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center text-xs">
            <span className="text-on-surface-variant font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-outline-variant rounded-sm px-2 py-1 font-code text-on-surface focus:border-primary outline-none"
            />
            <span className="text-on-surface-variant">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-outline-variant rounded-sm px-2 py-1 font-code text-on-surface focus:border-primary outline-none"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-[11px] underline text-on-surface-variant hover:text-primary cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider">
                  Date
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider w-full">
                  Description / Particulars
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Debit / Bill (₹)
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Credit / Paid (₹)
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Net Balance (₹)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-outline" />
                    <p className="font-semibold">
                      No transactions recorded for this date range
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-3 px-4 font-code text-on-surface-variant">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4 text-on-surface font-medium">
                      {tx.description}
                      {tx.referenceNo && (
                        <span className="ml-2 text-[10px] bg-surface-container px-1.5 py-0.5 rounded-xs font-code text-on-surface-variant">
                          {tx.referenceNo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-code text-on-surface">
                      {tx.debit > 0 ? formatINR(tx.debit) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-code text-secondary font-medium">
                      {tx.credit > 0 ? formatINR(tx.credit) : "-"}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-code font-bold ${
                        tx.balance > 0 ? "text-error" : "text-primary"
                      }`}
                    >
                      {formatINR(tx.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EDIT PARTY PROFILE MODAL (MULTI-TAB ADVANCED MASTER)                   */}
      {/* ========================================================================= */}
      {showEditPartyModal && currentParty && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-party-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditPartyModal(false);
            }
          }}
          className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "672px" }}
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex flex-row items-start justify-between gap-4 border-b border-outline-variant px-5 py-3.5 bg-surface-container-low shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="edit-party-title"
                    className="text-base font-bold text-primary flex items-center gap-2"
                  >
                    <FileEdit className="w-4 h-4 text-primary" /> Edit Party
                    Profile & Khata Master
                  </h3>
                  <span className="font-code text-xs px-2 py-0.5 bg-surface-container border border-outline-variant rounded text-primary font-semibold">
                    {currentParty.distributorId}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                  {currentParty.name} •{" "}
                  <span className="capitalize font-semibold text-primary">
                    {currentParty.partyType || "Distributor Account"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-code text-on-surface-variant bg-surface-container border border-outline-variant rounded">
                  ESC
                </span>
                <button
                  type="button"
                  onClick={() => setShowEditPartyModal(false)}
                  className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Segmented Navigation Tabs */}
            <div className="flex border-b border-outline-variant bg-surface-container-low/60 px-5 shrink-0">
              <button
                type="button"
                onClick={() => setEditTab("profile")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  editTab === "profile"
                    ? "border-primary text-primary bg-surface-container-lowest"
                    : "border-transparent text-on-surface-variant hover:text-primary"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Business & Contact
              </button>
              <button
                type="button"
                onClick={() => setEditTab("compliance")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  editTab === "compliance"
                    ? "border-primary text-primary bg-surface-container-lowest"
                    : "border-transparent text-on-surface-variant hover:text-primary"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Credit & Account Terms
              </button>
              <button
                type="button"
                onClick={() => setEditTab("balance")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  editTab === "balance"
                    ? "border-primary text-primary bg-surface-container-lowest"
                    : "border-transparent text-on-surface-variant hover:text-primary"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> Balance Adjustments
              </button>
            </div>

            {/* Modal Body Form */}
            <form
              id="edit-party-form"
              onSubmit={handleSavePartyEdit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="space-y-4 p-5 overflow-y-auto flex-1 text-xs">
                {editTab === "profile" && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Party / Business Name{" "}
                          <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-semibold text-xs text-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Distributor / Account ID{" "}
                          <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editDistributorId}
                          onChange={(e) => setEditDistributorId(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code text-xs text-on-surface"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                        Account Category / Classification
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { id: "customer", label: "Customer / Buyer" },
                            {
                              id: "distributor",
                              label: "Distributor / Stockist",
                            },
                            { id: "vendor", label: "Vendor / Supplier" },
                          ] as const
                        ).map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setEditPartyType(type.id)}
                            className={`py-1.5 px-2 text-xs font-semibold rounded-xs border transition-colors cursor-pointer text-center ${
                              editPartyType === type.id
                                ? "bg-primary text-on-primary border-primary"
                                : "bg-surface-container hover:bg-surface-container-high border-outline-variant text-on-surface"
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Primary Phone
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-code text-on-surface-variant/70 font-semibold select-none">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="Phone number"
                            value={editPhone}
                            onChange={(e) =>
                              setEditPhone(
                                e.target.value.replace(/\D/g, "").slice(0, 10),
                              )
                            }
                            className="w-full pl-11 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs text-on-surface font-code tracking-wider"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Alternate Phone (Optional)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-code text-on-surface-variant/70 font-semibold select-none">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="Optional number"
                            value={editAlternatePhone}
                            onChange={(e) =>
                              setEditAlternatePhone(
                                e.target.value.replace(/\D/g, "").slice(0, 10),
                              )
                            }
                            className="w-full pl-11 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs text-on-surface font-code tracking-wider"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="accounts@company.com"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs text-on-surface"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                        Registered Billing Address
                      </label>
                      <input
                        type="text"
                        placeholder="Industrial Area, Sector / Ward, City, State"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs text-on-surface"
                      />
                    </div>
                  </div>
                )}

                {editTab === "compliance" && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          GSTIN Identification
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 07AAAAA0000A1Z5"
                          value={editGstin}
                          onChange={(e) =>
                            setEditGstin(e.target.value.toUpperCase())
                          }
                          className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code text-xs text-on-surface"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Approved Credit Limit (₹){" "}
                          <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            required
                            value={editCreditLimit}
                            onChange={(e) => setEditCreditLimit(e.target.value)}
                            className="w-full pl-6 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code font-bold text-xs text-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                        Settlement Payment Terms
                      </label>
                      <select
                        value={editPaymentTerms}
                        onChange={(e) => setEditPaymentTerms(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-medium text-xs text-on-surface"
                      >
                        <option value="Immediate / COD">
                          Immediate / COD (Cash on Delivery)
                        </option>
                        <option value="Net 7 Days">Net 7 Days</option>
                        <option value="Net 15 Days">Net 15 Days</option>
                        <option value="Net 30 Days">
                          Net 30 Days (Standard)
                        </option>
                        <option value="Net 45 Days">Net 45 Days</option>
                        <option value="Net 60 Days">Net 60 Days</option>
                      </select>
                    </div>

                    {/* Credit Utilization Card */}
                    <div className="bg-surface-container-low p-3.5 rounded-sm border border-outline-variant space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-primary flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-secondary" />{" "}
                          Credit Limit Assessment
                        </span>
                        <span className="font-code font-bold text-xs">
                          {utilizationPct}% Utilized
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            utilizationPct > 80
                              ? "bg-error"
                              : utilizationPct > 50
                                ? "bg-amber-500"
                                : "bg-secondary"
                          }`}
                          style={{ width: `${utilizationPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-on-surface-variant">
                        <span>
                          Current Dues:{" "}
                          {formatINR(currentParty.outstandingBalance)}
                        </span>
                        <span>
                          Available Credit:{" "}
                          <strong>
                            {formatINR(
                              Math.max(
                                0,
                                (parseFloat(editCreditLimit) || 100000) -
                                  currentParty.outstandingBalance,
                              ),
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {editTab === "balance" && (
                  <div className="space-y-3.5">
                    <div className="bg-surface-container-low p-3.5 rounded-sm border border-outline-variant space-y-3">
                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Current Outstanding Balance (₹){" "}
                          <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editBalance}
                            onChange={(e) => setEditBalance(e.target.value)}
                            required
                            className="w-full pl-6 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code font-bold text-base text-error"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                          Adjustment Audit Reason
                        </label>
                        <select
                          value={editBalanceReason}
                          onChange={(e) => setEditBalanceReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-medium text-xs text-on-surface"
                        >
                          <option value="Opening Balance Reconciliation">
                            Opening Balance Reconciliation
                          </option>
                          <option value="Inward Credit / Return Adjustment">
                            Inward Credit / Return Adjustment
                          </option>
                          <option value="Discount / Rebate Settlement">
                            Discount / Rebate Settlement
                          </option>
                          <option value="Bad Debt / Write-off Correction">
                            Bad Debt / Write-off Correction
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
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
                      Enter
                    </kbd>{" "}
                    to save
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowEditPartyModal(false)}
                    className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-semibold rounded-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Account Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RECORD PARTY PAYMENT MODAL (WITH BALANCE RUNWAY & SMART SHORTCUTS)    */}
      {/* ========================================================================= */}
      {showPaymentModal && currentParty && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPaymentModal(false);
            }
          }}
          className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "576px" }}
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex flex-row items-start justify-between gap-4 border-b border-outline-variant px-5 py-3.5 bg-surface-container-low shrink-0">
              <div className="min-w-0 flex-1">
                <h3
                  id="payment-modal-title"
                  className="text-base font-bold text-primary flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4 text-primary" /> Record Party
                  Payment Receipt
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Party:{" "}
                  <span className="font-semibold text-primary">
                    {currentParty.name}
                  </span>{" "}
                  ({currentParty.distributorId})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-code text-on-surface-variant bg-surface-container border border-outline-variant rounded">
                  ESC
                </span>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form
              id="payment-modal-form"
              onSubmit={handleRecordPaymentSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="space-y-4 p-5 overflow-y-auto flex-1 text-xs">
                {/* Visual Financial Runway Card */}
                <div className="bg-surface-container-low p-3.5 rounded-sm border border-outline-variant space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-surface-container-lowest p-2.5 rounded-sm border border-outline-variant/60">
                      <span className="text-[10px] text-on-surface-variant block uppercase font-semibold">
                        1. Current Dues
                      </span>
                      <span className="font-bold font-code text-error text-sm">
                        {formatINR(currentParty.outstandingBalance)}
                      </span>
                    </div>

                    <div className="bg-surface-container-lowest p-2.5 rounded-sm border border-outline-variant/60">
                      <span className="text-[10px] text-on-surface-variant block uppercase font-semibold">
                        2. Paying Amount
                      </span>
                      <span className="font-bold font-code text-secondary text-sm">
                        {parseFloat(paymentAmount) > 0
                          ? `-${formatINR(parseFloat(paymentAmount))}`
                          : "₹0.00"}
                      </span>
                    </div>

                    <div className="bg-surface-container-lowest p-2.5 rounded-sm border border-outline-variant/60">
                      <span className="text-[10px] text-on-surface-variant block uppercase font-semibold">
                        3. Projected Due
                      </span>
                      <span className="font-bold font-code text-primary text-sm">
                        {formatINR(
                          Math.max(
                            0,
                            currentParty.outstandingBalance -
                              (parseFloat(paymentAmount) || 0),
                          ),
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Payment Mode Selector Cards */}
                  <div className="pt-2 border-t border-outline-variant/60">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1.5">
                      Select Payment Mode:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(
                        [
                          {
                            id: "NEFT",
                            label: "Bank NEFT / RTGS",
                            icon: Building2,
                          },
                          { id: "UPI", label: "UPI / QR Code", icon: QrCode },
                          {
                            id: "CHEQUE",
                            label: "Cheque / DD",
                            icon: Banknote,
                          },
                          {
                            id: "CASH",
                            label: "Cash Counter",
                            icon: Wallet,
                          },
                        ] as const
                      ).map((m) => {
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handlePaymentModeChange(m.id)}
                            className={`py-2 px-2 text-xs font-semibold rounded-xs border transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                              paymentMode === m.id
                                ? "bg-primary text-on-primary border-primary shadow-xs"
                                : "bg-surface-container hover:bg-surface-container-high border-outline-variant text-on-surface"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[11px] leading-tight">
                              {m.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px]">
                      Received Payment Amount (₹){" "}
                      <span className="text-error">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code text-base font-bold text-primary"
                    />
                  </div>

                  {/* Quick percentage shortcuts */}
                  {currentParty.outstandingBalance > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentAmount(
                            currentParty.outstandingBalance.toString(),
                          )
                        }
                        className="px-3 py-1 text-[11px] font-bold bg-primary text-on-primary hover:opacity-90 rounded-xs cursor-pointer shadow-xs"
                      >
                        Pay Full ({formatINR(currentParty.outstandingBalance)})
                      </button>
                      {[0.75, 0.5, 0.25].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() =>
                            setPaymentAmount(
                              (currentParty.outstandingBalance * pct).toFixed(
                                2,
                              ),
                            )
                          }
                          className="px-2.5 py-1 text-[11px] font-semibold border border-outline-variant bg-surface-container hover:bg-surface-container-high rounded-xs text-on-surface cursor-pointer"
                        >
                          {`${pct * 100}%`}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPaymentAmount("")}
                        className="px-2 py-1 text-[11px] text-on-surface-variant border border-outline-variant bg-surface-container hover:bg-surface-container-high rounded-xs ml-auto cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      {paymentMode === "CHEQUE"
                        ? "Cheque Number & Bank Name"
                        : paymentMode === "UPI"
                          ? "UPI Transaction ID / UTR #"
                          : paymentMode === "CASH"
                            ? "Cash Receipt Voucher #"
                            : "NEFT / RTGS Reference #"}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        paymentMode === "CHEQUE"
                          ? "e.g. CHQ-4455 / HDFC Bank"
                          : paymentMode === "UPI"
                            ? "e.g. UPI-2026-998811"
                            : paymentMode === "CASH"
                              ? "e.g. CASH-RCPT-004"
                              : "e.g. NEFT-HDFC-9912"
                      }
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs text-on-surface font-code"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Payment / Receipt Date{" "}
                      <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code text-xs text-on-surface"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Accountant Remarks / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Optional remarks regarding this settlement"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs text-on-surface"
                  />
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
                      Enter
                    </kbd>{" "}
                    to save
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-semibold rounded-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Payment Receipt
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADD NEW PARTY / ACCOUNT MODAL                                         */}
      {/* ========================================================================= */}
      {showAddPartyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-party-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddPartyModal(false);
            }
          }}
          className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "576px" }}
            className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex flex-row items-start justify-between gap-4 border-b border-outline-variant px-5 py-3.5 bg-surface-container-low shrink-0">
              <div className="min-w-0 flex-1">
                <h3
                  id="add-party-title"
                  className="text-base font-bold text-primary flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-primary" /> Add New Customer
                  / Distributor Account
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Register a verified ledger khata master with opening balance
                  and credit terms
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-code text-on-surface-variant bg-surface-container border border-outline-variant rounded">
                  ESC
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form
              id="add-party-form"
              onSubmit={handleSaveNewParty}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="space-y-3.5 p-5 overflow-y-auto flex-1 text-xs">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Account Type / Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "customer", label: "Customer / Buyer" },
                        { id: "distributor", label: "Distributor / Stockist" },
                        { id: "vendor", label: "Vendor / Supplier" },
                      ] as const
                    ).map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setNewPartyType(type.id)}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xs border transition-colors cursor-pointer text-center ${
                          newPartyType === type.id
                            ? "bg-primary text-on-primary border-primary shadow-xs"
                            : "bg-surface-container hover:bg-surface-container-high border-outline-variant text-on-surface"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Party / Business Name{" "}
                      <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Engineering Ltd."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-semibold text-xs text-primary"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-bold text-on-surface-variant uppercase text-[10px]">
                        Distributor / Party ID
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setNewDistributorId(
                            `${newPartyType === "customer" ? "CUST" : newPartyType === "vendor" ? "VND" : "DIST"}-${Date.now().toString().slice(-4)}`,
                          )
                        }
                        className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" /> Auto ID
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. DIST-2024-001"
                      value={newDistributorId}
                      onChange={(e) => setNewDistributorId(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code text-xs text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Primary Phone
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-code text-on-surface-variant/70 font-semibold select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Phone number"
                        value={newPhone}
                        onChange={(e) =>
                          setNewPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        className="w-full pl-11 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs text-on-surface font-code tracking-wider"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Alternate Phone (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-code text-on-surface-variant/70 font-semibold select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Optional number"
                        value={newAlternatePhone}
                        onChange={(e) =>
                          setNewAlternatePhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        className="w-full pl-11 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs text-on-surface font-code tracking-wider"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="billing@party.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      GSTIN Identification
                    </label>
                    <input
                      type="text"
                      placeholder="07AAAAA0000A1Z5"
                      value={newGstin}
                      onChange={(e) =>
                        setNewGstin(e.target.value.toUpperCase())
                      }
                      className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code text-xs text-on-surface"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Approved Credit Limit (₹){" "}
                      <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        required
                        value={newCreditLimit}
                        onChange={(e) => setNewCreditLimit(e.target.value)}
                        className="w-full pl-6 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Opening Outstanding Balance (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newOpeningBalance}
                        onChange={(e) => setNewOpeningBalance(e.target.value)}
                        className="w-full pl-6 pr-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-code font-bold text-xs text-error"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={newPaymentTerms}
                      onChange={(e) => setNewPaymentTerms(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none font-medium text-xs text-on-surface"
                    >
                      <option value="Immediate / COD">Immediate / COD</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 30 Days">
                        Net 30 Days (Standard)
                      </option>
                      <option value="Net 45 Days">Net 45 Days</option>
                      <option value="Net 60 Days">Net 60 Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase text-[10px] mb-1">
                    Registered Billing Address
                  </label>
                  <input
                    type="text"
                    placeholder="City, State"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm focus:border-primary outline-none text-xs text-on-surface"
                  />
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
                      Enter
                    </kbd>{" "}
                    to save
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddPartyModal(false)}
                    className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-xs font-semibold rounded-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Create Account
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
