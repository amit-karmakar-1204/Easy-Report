"use client";

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CreditCard,
  Download,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useMemo, useState } from "react";
import { formatINR, useERP } from "@/lib/store";

export default function LedgerAccountBookPage() {
  const { parties, selectedPartyId, setSelectedPartyId, recordPartyPayment } =
    useERP();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("Chq #");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const currentParty = useMemo(() => {
    return parties.find((p) => p.id === selectedPartyId) || parties[0];
  }, [parties, selectedPartyId]);

  const filteredTransactions = useMemo(() => {
    if (!currentParty) return [];
    return currentParty.transactions.filter((tx) => {
      const matchStart = !startDate || tx.date >= startDate;
      const matchEnd = !endDate || tx.date <= endDate;
      return matchStart && matchEnd;
    });
  }, [currentParty, startDate, endDate]);

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Please enter a valid positive payment amount");
      return;
    }

    recordPartyPayment(
      currentParty.id,
      amountNum,
      `Payment Received - ${paymentRef}`,
      paymentDate,
    );

    setShowPaymentModal(false);
    setPaymentAmount("");
    setPaymentRef("Chq #");
  };

  const handleDownloadPDF = () => {
    window.print();
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
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Ledger Account Book (Party Khata)
            </h1>
            <p className="text-xs text-on-surface-variant">
              Customer & Distributor balance tracking and payment reconciliation
            </p>
          </div>
        </div>

        {/* Distributor Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <label className="font-bold text-on-surface-variant uppercase">
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
        </div>
      </div>

      {/* Profile Header Card */}
      {currentParty && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
          <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Selected Account
              </p>
              <h2 className="text-xl font-bold text-primary">
                {currentParty.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1">
                <span className="font-code font-medium">
                  Distributor ID: {currentParty.distributorId}
                </span>
                {currentParty.phone && (
                  <span>| Phone: {currentParty.phone}</span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Total Outstanding Balance
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-error font-code tracking-tight">
                {formatINR(currentParty.outstandingBalance)}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                As of {currentParty.asOfDate}
              </p>
            </div>
          </div>

          <div className="border-t border-outline-variant p-3 bg-surface-container-low flex flex-wrap gap-3">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-primary text-on-primary text-xs font-semibold px-4 py-2 rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" /> Record Payment
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-surface-container-highest text-on-surface text-xs font-semibold px-4 py-2 rounded-sm border border-outline-variant hover:bg-outline-variant transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Print / Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Statement Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-sm overflow-hidden shadow-none">
        <div className="border-b border-outline-variant p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-lowest">
          <h3 className="font-bold text-sm text-on-surface">
            Statement Details
          </h3>
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
                className="text-[11px] underline text-on-surface-variant hover:text-primary"
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
                  Description
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Debit (₹)
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Credit (₹)
                </th>
                <th className="py-2.5 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Balance (₹)
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

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-sm max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-outline-variant pb-3">
              <div>
                <h3 className="text-base font-bold text-primary">
                  Record Party Payment
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {currentParty.name}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleRecordPaymentSubmit}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Payment Mode / Reference No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #4455, NEFT Ref, Cash"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface rounded-sm focus:border-primary outline-none font-code"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-outline-variant text-xs font-semibold rounded-sm hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary text-xs font-semibold rounded-sm hover:opacity-90"
                >
                  Save Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
