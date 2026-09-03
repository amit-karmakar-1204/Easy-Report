"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Easy Report Application Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-error-container/30 border border-error/20 flex items-center justify-center mb-4 text-error">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-primary mb-2">
        Something went wrong
      </h2>

      <p className="text-sm text-on-surface-variant max-w-md mb-6">
        {error.message ||
          "An unexpected error occurred while loading this page. Please try again or return to the dashboard."}
      </p>

      {error.digest && (
        <p className="text-xs font-mono text-outline mb-6">
          Digest: {error.digest}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-sm hover:opacity-90 flex items-center gap-2 transition-opacity cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Try Again
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-surface-container-high border border-outline-variant text-on-surface font-semibold text-xs rounded-sm hover:bg-surface-container-highest flex items-center gap-2 transition-colors"
        >
          <Home className="w-3.5 h-3.5" /> Dashboard
        </Link>
      </div>
    </div>
  );
}
