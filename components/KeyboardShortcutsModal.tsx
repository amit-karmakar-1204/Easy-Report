"use client";

import {
  BookOpen,
  Command,
  FileCheck,
  Keyboard,
  Navigation,
  Search,
  Sliders,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  label: string;
  description: string;
  category: "Navigation" | "Search" | "Forms & Actions" | "System";
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation
  {
    keys: ["Esc"],
    label: "Back Button / Close",
    description:
      "Acts as Back button to navigate to previous page, or closes open dialogs",
    category: "Navigation",
  },
  {
    keys: ["Alt", "H"],
    label: "Dashboard Home",
    description: "Jump instantly to main overview dashboard",
    category: "Navigation",
  },
  {
    keys: ["Alt", "1"],
    label: "Sales & Billing",
    description: "Open active counter sale / pos billing screen",
    category: "Navigation",
  },
  {
    keys: ["Alt", "2"],
    label: "Stock Inward (Purchase)",
    description: "Open warehouse goods receipt and purchase entry",
    category: "Navigation",
  },
  {
    keys: ["Alt", "3"],
    label: "Inventory Master",
    description: "View stock levels, batches, and item catalog",
    category: "Navigation",
  },
  {
    keys: ["Alt", "4"],
    label: "Party Ledger",
    description: "View customer & vendor balances and statements",
    category: "Navigation",
  },
  {
    keys: ["Alt", "5"],
    label: "Expiry Tracker",
    description: "Monitor near-expiry and expired batch inventory",
    category: "Navigation",
  },
  {
    keys: ["Alt", "6"],
    label: "Sales History",
    description: "Modify, reprint, or inspect past sales invoices",
    category: "Navigation",
  },
  {
    keys: ["Alt", "7"],
    label: "Performance & Reorder",
    description: "Stock velocity analytics and reorder generation",
    category: "Navigation",
  },
  {
    keys: ["Alt", "8"],
    label: "Purchase History",
    description: "Audit and modify previous inward goods vouchers",
    category: "Navigation",
  },
  {
    keys: ["Alt", "9"],
    label: "Profit Analytics",
    description: "Gross margin, net profit, and expense reports",
    category: "Navigation",
  },
  {
    keys: ["Alt", "B"],
    label: "Toggle Sidebar",
    description: "Expand or collapse navigation sidebar drawer",
    category: "Navigation",
  },

  // Search & Commands
  {
    keys: ["Ctrl", "K"],
    label: "Global Search",
    description: "Focus top search bar to find invoices, items, or parties",
    category: "Search",
  },
  {
    keys: ["/"],
    label: "Quick Search",
    description: "Quickly focus search bar (when not typing in a text field)",
    category: "Search",
  },
  {
    keys: ["Enter"],
    label: "Execute Search",
    description: "Navigate directly to matched invoice or item query",
    category: "Search",
  },

  // Forms & Actions
  {
    keys: ["Ctrl", "Enter"],
    label: "Quick Save / Submit",
    description: "Submit current form or save active modal transaction",
    category: "Forms & Actions",
  },
  {
    keys: ["Tab"],
    label: "Next Input Field",
    description: "Move focus swiftly across form inputs without mouse",
    category: "Forms & Actions",
  },
  {
    keys: ["Shift", "Tab"],
    label: "Previous Input Field",
    description: "Step backward to the previous form input field",
    category: "Forms & Actions",
  },
  {
    keys: ["Esc"],
    label: "Cancel / Dismiss",
    description: "Dismiss active modal, dropdown, or search suggestions",
    category: "Forms & Actions",
  },

  // System
  {
    keys: ["Shift", "?"],
    label: "Shortcuts Cheat Sheet",
    description: "Toggle this comprehensive keyboard instructions guide",
    category: "System",
  },
  {
    keys: ["F1"],
    label: "System Help",
    description: "Open shortcut help manual from anywhere",
    category: "System",
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS.filter((s) => {
      const matchCat =
        selectedCategory === "All" || s.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.keys.some((k) => k.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  const categories = [
    "All",
    "Navigation",
    "Search",
    "Forms & Actions",
    "System",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "680px" }}
        className="bg-surface-container-lowest border border-outline-variant rounded-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3.5 bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3
                id="shortcuts-title"
                className="font-bold text-sm text-on-surface flex items-center gap-2"
              >
                <span>Keyboard Shortcuts & Controls</span>
                <span className="text-[10px] font-mono font-semibold bg-primary/10 text-primary px-1.5 py-0.2 rounded border border-primary/20">
                  Daily Life Hotkeys
                </span>
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Control the ERP with high-speed keyboard shortcuts without
                reaching for the mouse.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-1.5 rounded-sm transition-colors cursor-pointer"
            aria-label="Close shortcuts dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-outline-variant bg-surface space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcut by key or function (e.g. Esc, Back, Sale, Search)..."
              className="w-full pl-9 pr-3 py-2 border border-outline-variant bg-surface-container-lowest rounded-sm text-xs text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-xs border transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline-variant"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-outline-variant/60">
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-xs">
              <Command className="w-8 h-8 mx-auto mb-2 text-outline" />
              <p className="font-semibold">No shortcuts match &quot;{search}&quot;</p>
              <p className="text-[11px] mt-0.5">Try searching for &quot;Esc&quot;, &quot;Sale&quot;, or &quot;Search&quot;</p>
            </div>
          ) : (
            filteredShortcuts.map((s, idx) => (
              <div
                key={`${s.label}-${idx}`}
                className="py-2.5 flex items-center justify-between gap-4 hover:bg-surface-container-low px-2 rounded-xs transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-on-surface">
                      {s.label}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-on-surface-variant/80 bg-surface-container px-1 py-0.2 rounded border border-outline-variant/50">
                      {s.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {s.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {s.keys.map((k, kIdx) => (
                    <span key={kIdx} className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-surface-container-highest border border-outline-variant rounded text-[11px] font-mono font-bold text-on-surface shadow-xs min-w-[24px] text-center">
                        {k}
                      </kbd>
                      {kIdx < s.keys.length - 1 && (
                        <span className="text-xs text-on-surface-variant font-bold">
                          +
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Instructions summary */}
        <div className="border-t border-outline-variant bg-surface-container-low px-5 py-3 flex flex-wrap justify-between items-center gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-container border border-outline-variant rounded font-mono font-bold text-[10px]">
                Esc
              </kbd>
              <span>to close</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-container border border-outline-variant rounded font-mono font-bold text-[10px]">
                Shift + ?
              </kbd>
              <span>to reopen anytime</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-sm hover:opacity-90 transition-opacity cursor-pointer ml-auto"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
