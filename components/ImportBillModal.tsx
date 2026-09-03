"use client";

import type React from "react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Key,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import type { PurchaseItem } from "@/lib/types";

export interface ExtractedBillItem {
  id: string;
  selected: boolean;
  itemName: string;
  packing: string;
  company: string;
  purchaseRate: number;
  mrp: number;
  qty: number;
  batchNo: string;
  expiryDate: string;
}

interface ImportBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: PurchaseItem[]) => void;
}

export default function ImportBillModal({
  isOpen,
  onClose,
  onImport,
}: ImportBillModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted items preview
  const [extractedItems, setExtractedItems] = useState<ExtractedBillItem[]>([]);

  // Text / JSON paste state
  const [pastedContent, setPastedContent] = useState("");

  // Gemini API Key state
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("gemini_api_key") || "";
      setApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("gemini_api_key", key.trim());
    }
  };

  if (!isOpen) return null;

  // 1. Process Excel or CSV files client-side
  const handleProcessExcelOrCsv = async (file: File) => {
    setIsProcessing(true);
    setStatusText(`Parsing ${file.name}...`);
    setErrorMessage(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("No sheet found in uploaded Excel workbook.");
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
      });

      if (rawRows.length === 0) {
        throw new Error("The selected Excel/CSV file has no data rows.");
      }

      // Map rows by inspecting column names
      const mapped: ExtractedBillItem[] = rawRows.map((row, idx) => {
        const keys = Object.keys(row);

        const findVal = (regex: RegExp): string => {
          const matchedKey = keys.find((k) => regex.test(k.trim()));
          return matchedKey ? String(row[matchedKey]).trim() : "";
        };

        const name =
          findVal(
            /item\s*name|product\s*name|product|item|description|particulars/i,
          ) || `Item ${idx + 1}`;

        const packing = findVal(/pack|pkg|unit/i);
        const company = findVal(/comp|mfr|manufacturer|brand|make/i);

        const rateStr = findVal(
          /purchase.*rate|pur.*rate|wholesale|rate|cost|price/i,
        );
        const mrpStr = findVal(/mrp|retail.*price/i);
        const qtyStr = findVal(/qty|quantity|units|nos|pcs/i);
        const batchStr = findVal(/batch/i);
        const expStr = findVal(/exp/i);

        const purchaseRate = parseFloat(rateStr.replace(/[^0-9.]/g, "")) || 0;
        const mrp =
          parseFloat(mrpStr.replace(/[^0-9.]/g, "")) ||
          (purchaseRate > 0 ? Math.round(purchaseRate * 1.25 * 100) / 100 : 0);
        const qty = parseInt(qtyStr.replace(/[^0-9]/g, ""), 10) || 1;

        return {
          id: `imp-${Date.now()}-${idx}`,
          selected: true,
          itemName: name,
          packing: packing,
          company: company,
          purchaseRate: purchaseRate,
          mrp: mrp,
          qty: qty > 0 ? qty : 1,
          batchNo: batchStr || `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: expStr ? expStr.slice(0, 7) : "2028-12",
        };
      });

      setExtractedItems(mapped);
      setStatusText(`Extracted ${mapped.length} items from Excel/CSV.`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to parse Excel/CSV document.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Process Image or PDF via Gemini API
  const handleProcessImageOrPdf = async (file: File) => {
    setIsProcessing(true);
    setStatusText(`Scanning ${file.name} with AI Vision...`);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract pure base64 without prefix
          const commaIdx = result.indexOf(",");
          if (commaIdx !== -1) {
            resolve(result.substring(commaIdx + 1));
          } else {
            resolve(result);
          }
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);

      const base64Data = await base64Promise;

      const res = await fetch("/api/extract-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType:
            file.type ||
            (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data?.error === "MISSING_API_KEY") {
          setShowApiKeyInput(true);
          throw new Error(
            "Google Gemini API Key is required to scan Image & PDF bills. Enter your API key below or paste the JSON text directly.",
          );
        }
        throw new Error(
          data?.message || "AI extraction failed for this document.",
        );
      }

      const items: ExtractedBillItem[] = (data.items || []).map(
        (it: any, idx: number) => ({
          id: `imp-${Date.now()}-${idx}`,
          selected: true,
          itemName: it.itemName || `Item ${idx + 1}`,
          packing: it.packing || "",
          company: it.company || "",
          purchaseRate: Number(it.purchaseRate) || 0,
          mrp: Number(it.mrp) || 0,
          qty: Number(it.qty) > 0 ? Number(it.qty) : 1,
          batchNo:
            it.batchNo || `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: it.expiryDate || "2028-12",
        }),
      );

      if (items.length === 0) {
        throw new Error("No bill items could be detected from this document.");
      }

      setExtractedItems(items);
      setStatusText(
        `Successfully scanned and extracted ${items.length} items!`,
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Error processing image or PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file drop / selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      name.endsWith(".csv")
    ) {
      handleProcessExcelOrCsv(file);
    } else if (
      name.endsWith(".pdf") ||
      file.type.startsWith("image/") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".webp")
    ) {
      handleProcessImageOrPdf(file);
    } else {
      setErrorMessage(
        "Unsupported file format. Please upload an Excel (.xlsx, .xls), CSV, PDF, or Image file (.png, .jpg, .jpeg).",
      );
    }
  };

  // 3. Parse pasted JSON or tabular text
  const handleParsePastedText = () => {
    if (!pastedContent.trim()) {
      setErrorMessage("Please paste JSON array or tabular text first.");
      return;
    }

    setErrorMessage(null);
    let text = pastedContent.trim();

    // Strip markdown code fences if present
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    try {
      // Try parsing as JSON array
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.items)
          ? parsed.items
          : [];

      if (list.length === 0) {
        throw new Error("JSON must contain an array of item objects.");
      }

      const mapped: ExtractedBillItem[] = list.map((it: any, idx: number) => {
        const name =
          it.itemName ||
          it["Item Name"] ||
          it.name ||
          it.product ||
          `Item ${idx + 1}`;
        const packing = it.packing || it.Packing || it.unit || "";
        const company =
          it.company ||
          it["Company / Mfr"] ||
          it["Company/Mfr"] ||
          it.mfr ||
          "";
        const rate =
          parseFloat(
            String(
              it.purchaseRate ?? it["Purchase Rate (₹)"] ?? it.rate ?? 0,
            ).replace(/[^0-9.]/g, ""),
          ) || 0;
        const mrp =
          parseFloat(
            String(it.mrp ?? it["MRP (₹)"] ?? 0).replace(/[^0-9.]/g, ""),
          ) || (rate > 0 ? Math.round(rate * 1.25 * 100) / 100 : 0);
        const qty =
          parseInt(
            String(it.qty ?? it.QTY ?? it.quantity ?? 1).replace(/[^0-9]/g, ""),
            10,
          ) || 1;

        return {
          id: `imp-${Date.now()}-${idx}`,
          selected: true,
          itemName: String(name).trim(),
          packing: String(packing).trim(),
          company: String(company).trim(),
          purchaseRate: rate,
          mrp: mrp,
          qty: qty > 0 ? qty : 1,
          batchNo:
            it.batchNo || `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: it.expiryDate || "2028-12",
        };
      });

      setExtractedItems(mapped);
      setStatusText(`Parsed ${mapped.length} items from JSON.`);
    } catch {
      // Try parsing CSV or tab-delimited text
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 1) {
        const sep = lines[0].includes("\t") ? "\t" : ",";
        const headers = lines[0]
          .split(sep)
          .map((h) => h.replace(/["']/g, "").trim().toLowerCase());
        const mapped: ExtractedBillItem[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i]
            .split(sep)
            .map((c) => c.replace(/["']/g, "").trim());
          if (cells.length === 0 || !cells[0]) continue;

          const getItemField = (regex: RegExp): string => {
            const hIdx = headers.findIndex((h) => regex.test(h));
            return hIdx !== -1 && cells[hIdx] !== undefined ? cells[hIdx] : "";
          };

          const name = getItemField(/item|product|desc|name/) || cells[0];
          const packing = getItemField(/pack|pkg|unit/);
          const company = getItemField(/comp|mfr|brand/);
          const rate =
            parseFloat(
              getItemField(/rate|cost|price/).replace(/[^0-9.]/g, ""),
            ) || 0;
          const mrp =
            parseFloat(getItemField(/mrp/).replace(/[^0-9.]/g, "")) ||
            (rate > 0 ? rate * 1.25 : 0);
          const qty =
            parseInt(getItemField(/qty|quantity/).replace(/[^0-9]/g, ""), 10) ||
            1;

          mapped.push({
            id: `imp-${Date.now()}-${i}`,
            selected: true,
            itemName: name,
            packing: packing,
            company: company,
            purchaseRate: rate,
            mrp: mrp,
            qty: qty,
            batchNo: `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
            expiryDate: "2028-12",
          });
        }

        if (mapped.length > 0) {
          setExtractedItems(mapped);
          setStatusText(`Parsed ${mapped.length} items from text/CSV.`);
          return;
        }
      }

      setErrorMessage(
        "Could not parse text. Ensure it is either valid JSON array of items or CSV/Tab-separated rows.",
      );
    }
  };

  // Modify individual row in preview
  const handleUpdateItem = (
    id: string,
    field: keyof ExtractedBillItem,
    val: any,
  ) => {
    setExtractedItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)),
    );
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    const allSelected = extractedItems.every((it) => it.selected);
    setExtractedItems((prev) =>
      prev.map((it) => ({ ...it, selected: !allSelected })),
    );
  };

  const handleToggleSelectItem = (id: string) => {
    setExtractedItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it)),
    );
  };

  const handleDeleteItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Import selected items into main Purchase Staged List
  const handleConfirmImport = () => {
    const selected = extractedItems.filter((it) => it.selected);
    if (selected.length === 0) {
      alert("Please select at least one item to import.");
      return;
    }

    const readyItems: PurchaseItem[] = selected.map((it) => {
      const rate = Number(it.purchaseRate) || 0;
      const qty = Number(it.qty) > 0 ? Number(it.qty) : 1;
      const total = Math.round(rate * qty * 100) / 100;

      return {
        id: `stg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemName: it.itemName.trim(),
        packing: it.packing.trim(),
        company: it.company.trim(),
        purchaseRate: rate,
        mrp:
          Number(it.mrp) ||
          (rate > 0 ? Math.round(rate * 1.25 * 100) / 100 : 0),
        qty: qty,
        total: total,
        batchNo:
          it.batchNo.trim() || `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: it.expiryDate.trim() || "2028-12",
      };
    });

    onImport(readyItems);
    onClose();
  };

  const selectedCount = extractedItems.filter((it) => it.selected).length;
  const totalAmount = extractedItems
    .filter((it) => it.selected)
    .reduce((acc, it) => acc + (it.purchaseRate || 0) * (it.qty || 1), 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-bill-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "900px" }}
        className="bg-surface-container-lowest border border-outline-variant rounded-md w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3 bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3
                id="import-bill-modal-title"
                className="text-sm font-bold text-primary tracking-tight"
              >
                Import Invoice / Scan Bill Items
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Upload Image, PDF, Excel (.xlsx, .xls), or CSV to auto-extract
                purchase line items
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("file")}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === "file"
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Document (Image / PDF / Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("paste")}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === "paste"
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste JSON / CSV Text</span>
              </button>
            </div>

            {/* API Key settings toggle */}
            <button
              type="button"
              onClick={() => setShowApiKeyInput((prev) => !prev)}
              className="text-[11px] text-on-surface-variant hover:text-primary flex items-center gap-1 cursor-pointer font-medium"
              title="Configure Google Gemini API Key for image & PDF scanning"
            >
              <Key className="w-3 h-3 text-primary" />
              <span>{apiKey ? "Gemini Key Configured" : "Add Gemini Key"}</span>
            </button>
          </div>

          {/* Optional API Key Input Banner */}
          {showApiKeyInput && (
            <div className="p-3 bg-surface-container-low border border-outline-variant rounded-sm text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" /> Google Gemini API
                  Key (For Image & PDF Scanning)
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-[11px] font-semibold"
                >
                  Get free key from Google AI Studio &rarr;
                </a>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Paste your Gemini API key (AIzaSy...)"
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs text-on-surface font-code outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(false)}
                  className="px-3 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-sm cursor-pointer hover:opacity-90"
                >
                  Save
                </button>
              </div>
              <p className="text-[10px] text-on-surface-variant">
                Note: Excel (.xlsx, .xls) and CSV files are parsed 100% locally
                in your browser without requiring an API key. An API key is only
                needed for AI Vision scanning of camera photos, invoice
                screenshots, and PDFs.
              </p>
            </div>
          )}

          {/* Tab 1: File Upload */}
          {activeTab === "file" && (
            <div className="space-y-3">
              <label
                htmlFor="bill-file-upload-input"
                className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors ${
                  isProcessing
                    ? "bg-surface-container-high border-outline-variant pointer-events-none"
                    : "border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <input
                  id="bill-file-upload-input"
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                />

                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="font-bold text-xs text-primary">
                      {statusText || "Processing Document..."}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      Extracting product names, packaging, rates, and
                      quantities...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-primary/10 text-primary rounded-full">
                      <UploadCloud className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">
                        Click or drag & drop invoice document here
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Supports <strong>Images (.png, .jpg)</strong>,{" "}
                        <strong>PDF bills (.pdf)</strong>, and{" "}
                        <strong>Excel sheets (.xlsx, .xls, .csv)</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-primary/80 bg-surface-container px-2.5 py-1 rounded border border-outline-variant/50 mt-1">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Instant
                      Excel/CSV Parser
                      <span>•</span>
                      <Sparkles className="w-3.5 h-3.5" /> Multimodal AI
                      Image/PDF Extractor
                    </div>
                  </>
                )}
              </label>
            </div>
          )}

          {/* Tab 2: Paste Content */}
          {activeTab === "paste" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-on-surface-variant uppercase text-[10px]">
                  Paste JSON Array or Tab-Separated / CSV Text
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setPastedContent(
                      JSON.stringify(
                        [
                          {
                            "Item Name": "Whole Wheat Atta",
                            Packing: "5 kg",
                            "Company / Mfr": "ITC Limited",
                            "Purchase Rate (₹)": 210,
                            "MRP (₹)": 240,
                            QTY: 10,
                          },
                          {
                            "Item Name": "Basmati Rice",
                            Packing: "1 kg",
                            "Company / Mfr": "Kohinoor Foods",
                            "Purchase Rate (₹)": 135,
                            "MRP (₹)": 165,
                            QTY: 5,
                          },
                        ],
                        null,
                        2,
                      ),
                    )
                  }
                  className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  Load Example JSON
                </button>
              </div>

              <textarea
                rows={6}
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder='[ { "Item Name": "...", "Packing": "...", "Company / Mfr": "...", "Purchase Rate (₹)": 150, "MRP (₹)": 180, "QTY": 10 } ]'
                className="w-full p-3 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs font-code text-on-surface focus:border-primary outline-none resize-none"
              />

              <button
                type="button"
                onClick={handleParsePastedText}
                className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-sm flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Parse & Extract Items
              </button>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 bg-error/10 text-error border border-error/20 rounded-sm text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Extraction notice:</span>{" "}
                {errorMessage}
              </div>
            </div>
          )}

          {/* Status badge */}
          {statusText && !errorMessage && !isProcessing && (
            <div className="p-2.5 bg-secondary-container text-on-secondary-container border border-secondary rounded-sm text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
              <span>{statusText}</span>
            </div>
          )}

          {/* 3. Extracted Items Preview Table */}
          {extractedItems.length > 0 && (
            <div className="border border-outline-variant rounded-sm overflow-hidden space-y-0">
              <div className="p-3 bg-surface-container-low border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all-extracted"
                    checked={
                      extractedItems.length > 0 &&
                      extractedItems.every((it) => it.selected)
                    }
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="select-all-extracted"
                    className="text-xs font-bold text-on-surface cursor-pointer select-none"
                  >
                    Select All ({selectedCount} / {extractedItems.length}{" "}
                    selected)
                  </label>
                </div>
                <div className="text-xs text-on-surface-variant font-code">
                  Selected Total:{" "}
                  <strong className="text-primary font-bold">
                    ₹{totalAmount.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead className="bg-surface font-bold text-on-surface-variant uppercase border-b border-outline-variant sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3 w-8 text-center">✓</th>
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-2">Packing</th>
                      <th className="py-2 px-2">Company</th>
                      <th className="py-2 px-2">Batch</th>
                      <th className="py-2 px-2">Expiry</th>
                      <th className="py-2 px-2 text-right">Rate (₹)</th>
                      <th className="py-2 px-2 text-right">MRP (₹)</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Total (₹)</th>
                      <th className="py-2 px-2 text-center w-8">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant bg-surface-container-lowest">
                    {extractedItems.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-surface-container-low transition-colors ${
                          !item.selected ? "opacity-50" : ""
                        }`}
                      >
                        <td className="py-1.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleSelectItem(item.id)}
                            className="w-3.5 h-3.5 accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="py-1.5 px-2 min-w-[160px]">
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "itemName",
                                e.target.value,
                              )
                            }
                            className="w-full px-1.5 py-1 border border-outline-variant/60 rounded-xs bg-surface text-xs font-semibold text-on-surface outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-24">
                          <input
                            type="text"
                            value={item.packing}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "packing",
                                e.target.value,
                              )
                            }
                            className="w-full px-1.5 py-1 border border-outline-variant/60 rounded-xs bg-surface text-xs text-on-surface outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-1.5 px-2 min-w-[120px]">
                          <input
                            type="text"
                            value={item.company}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "company",
                                e.target.value,
                              )
                            }
                            className="w-full px-1.5 py-1 border border-outline-variant/60 rounded-xs bg-surface text-xs text-on-surface outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-24">
                          <input
                            type="text"
                            value={item.batchNo}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "batchNo",
                                e.target.value,
                              )
                            }
                            className="w-full px-1.5 py-1 border border-outline-variant/60 rounded-xs bg-surface text-xs font-code text-on-surface outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-24">
                          <input
                            type="month"
                            value={item.expiryDate}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "expiryDate",
                                e.target.value,
                              )
                            }
                            className="w-full px-1 py-1 border border-outline-variant/60 rounded-xs bg-surface text-xs font-code text-on-surface outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-20 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.purchaseRate || ""}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "purchaseRate",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full px-1.5 py-1 border border-outline-variant/60 rounded-xs bg-surface text-xs font-code text-right text-on-surface outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-20 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.mrp || ""}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "mrp",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full px-1.5 py-1 border border-outline-variant/60 rounded-xs bg-surface text-xs font-code text-right text-on-surface outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-1.5 px-2 w-16 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.qty || ""}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "qty",
                                parseInt(e.target.value, 10) || 1,
                              )
                            }
                            className="w-full px-1.5 py-1 border border-outline-variant/60 rounded-xs bg-surface text-xs font-code text-right text-on-surface outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-1.5 px-3 text-right font-code font-bold text-primary">
                          ₹
                          {((item.purchaseRate || 0) * (item.qty || 1)).toFixed(
                            2,
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-on-surface-variant hover:text-error p-1 transition-colors cursor-pointer"
                            title="Remove row"
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-xs text-on-surface-variant">
            {extractedItems.length > 0 ? (
              <span>
                Ready to add{" "}
                <strong className="text-primary font-bold">
                  {selectedCount}
                </strong>{" "}
                item(s) to Inward Bill
              </span>
            ) : (
              <span>
                Upload or paste an invoice document above to begin extraction
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 border border-outline-variant rounded-sm text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedCount === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="flex-1 sm:flex-initial px-6 py-2 bg-primary text-on-primary text-xs font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>
                Import {selectedCount} Item{selectedCount === 1 ? "" : "s"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
