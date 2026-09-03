"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function useArrowKeyNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const activeElementRef = useRef<HTMLElement | null>(null);

  // Clear focused attribute whenever the route changes
  useEffect(() => {
    if (activeElementRef.current) {
      activeElementRef.current.removeAttribute("data-keyboard-focused");
      activeElementRef.current.removeAttribute("data-keyboard-pressed");
      activeElementRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    // Clear keyboard focus if user clicks with a mouse
    const handlePointerDown = () => {
      if (activeElementRef.current) {
        activeElementRef.current.removeAttribute("data-keyboard-focused");
        activeElementRef.current.removeAttribute("data-keyboard-pressed");
        activeElementRef.current = null;
      }
    };

    const getNavigableElements = (): HTMLElement[] => {
      // If a modal or dialog is open, constrain navigation to inside the modal
      const openModal = document.querySelector(
        '[role="dialog"], [aria-modal="true"], .fixed.inset-0',
      ) as HTMLElement | null;

      const root = openModal || document;
      const selector =
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex="0"]';

      const candidates = Array.from(root.querySelectorAll(selector)) as HTMLElement[];

      return candidates.filter((el) => {
        // Exclude elements that are hidden, zero-sized, or have aria-hidden
        if (el.getAttribute("aria-hidden") === "true") return false;
        if (el.tabIndex === -1) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // 1. ESCAPE KEY -> Back Button or Close
      if (e.key === "Escape") {
        const openModal = document.querySelector(
          '[role="dialog"], [aria-modal="true"], .fixed.inset-0',
        );

        if (openModal) {
          // Modal handles its own escape
          return;
        }

        if (isInput) {
          target?.blur();
          if (activeElementRef.current) {
            activeElementRef.current.removeAttribute("data-keyboard-focused");
            activeElementRef.current = null;
          }
          return;
        }

        if (activeElementRef.current) {
          activeElementRef.current.removeAttribute("data-keyboard-focused");
          activeElementRef.current = null;
        }

        // On child screens, Esc navigates back like a back button
        if (pathname !== "/") {
          e.preventDefault();
          router.back();
        }
        return;
      }

      // If user is actively typing inside an input/textarea, do not intercept arrow keys
      if (isInput && !["Escape"].includes(e.key)) {
        return;
      }

      // 2. ARROW KEYS -> Traverse options
      const isDownOrRight = e.key === "ArrowDown" || e.key === "ArrowRight";
      const isUpOrLeft = e.key === "ArrowUp" || e.key === "ArrowLeft";

      if (isDownOrRight || isUpOrLeft) {
        e.preventDefault();
        const elements = getNavigableElements();
        if (elements.length === 0) return;

        let currentIndex = -1;
        if (activeElementRef.current) {
          currentIndex = elements.indexOf(activeElementRef.current);
        }
        if (currentIndex === -1 && document.activeElement) {
          currentIndex = elements.indexOf(document.activeElement as HTMLElement);
        }

        let nextIndex = 0;
        if (isDownOrRight) {
          nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % elements.length;
        } else if (isUpOrLeft) {
          nextIndex =
            currentIndex === -1
              ? elements.length - 1
              : (currentIndex - 1 + elements.length) % elements.length;
        }

        const nextEl = elements[nextIndex];
        if (nextEl) {
          if (activeElementRef.current) {
            activeElementRef.current.removeAttribute("data-keyboard-focused");
          }
          nextEl.setAttribute("data-keyboard-focused", "true");
          activeElementRef.current = nextEl;
          nextEl.focus();
          nextEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        return;
      }

      // 3. ENTER -> Animated Button Press & Selection
      if (e.key === "Enter" && activeElementRef.current) {
        const currentEl = activeElementRef.current;
        e.preventDefault();

        // Animate button press effect
        currentEl.setAttribute("data-keyboard-pressed", "true");

        setTimeout(() => {
          currentEl.removeAttribute("data-keyboard-pressed");
          currentEl.click();
        }, 120);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [router, pathname]);
}
