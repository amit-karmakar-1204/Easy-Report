"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface KeyboardShortcutsOptions {
  onToggleShortcutsModal: () => void;
  onToggleSidebar: () => void;
}

export function useGlobalKeyboardShortcuts({
  onToggleShortcutsModal,
  onToggleSidebar,
}: KeyboardShortcutsOptions) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // 1. ESCAPE: Priority Hierarchy
      // Step A: If an open modal exists in DOM, modal handles its own Escape.
      // Step B: If an input is focused, blur it.
      // Step C: If no modal and not typing, navigate Back (router.back).
      if (e.key === "Escape") {
        const hasOpenModal = document.querySelector(
          '[role="dialog"], [aria-modal="true"], .fixed.inset-0',
        );

        if (hasOpenModal) {
          // A modal is actively open in the DOM; let the modal's Esc listener close it
          return;
        }

        if (isInputFocused) {
          target?.blur();
          return;
        }

        // When no modal or input is active, use Esc as Back button
        if (pathname !== "/") {
          e.preventDefault();
          router.back();
        }
        return;
      }

      // 2. HELP / SHORTCUTS MODAL: Shift + ? or F1
      if ((e.key === "?" && !isInputFocused) || e.key === "F1") {
        e.preventDefault();
        onToggleShortcutsModal();
        return;
      }

      // 3. GLOBAL SEARCH: Ctrl + K, Cmd + K, or "/" when not typing
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) ||
        (e.key === "/" && !isInputFocused)
      ) {
        e.preventDefault();
        const searchInput = document.getElementById(
          "global-search-input",
        ) as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // 4. SIDEBAR TOGGLE: Alt + B or Ctrl + \
      if (
        (e.altKey && (e.key === "b" || e.key === "B")) ||
        ((e.ctrlKey || e.metaKey) && e.key === "\\")
      ) {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // 5. MODULE NAVIGATION (Alt + 0..9 or Alt + H)
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "h":
          case "0":
            e.preventDefault();
            router.push("/");
            break;
          case "1":
            e.preventDefault();
            router.push("/sale");
            break;
          case "2":
            e.preventDefault();
            router.push("/purchase");
            break;
          case "3":
            e.preventDefault();
            router.push("/inventory");
            break;
          case "4":
            e.preventDefault();
            router.push("/ledger");
            break;
          case "5":
            e.preventDefault();
            router.push("/expiry");
            break;
          case "6":
            e.preventDefault();
            router.push("/sale-modify");
            break;
          case "7":
            e.preventDefault();
            router.push("/performance");
            break;
          case "8":
            e.preventDefault();
            router.push("/purchase-modify");
            break;
          case "9":
            e.preventDefault();
            router.push("/profit");
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname, onToggleShortcutsModal, onToggleSidebar]);
}
