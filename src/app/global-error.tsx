"use client";

import { useEffect } from "react";
import Link from "next/link";
import { captureAppError } from "@/lib/monitoring/sentry";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureAppError(error, { feature: "global-error-boundary", level: "fatal" });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[var(--color-base)] text-[var(--color-text-primary)] font-mono flex min-h-screen flex-col items-center justify-center gap-5 px-6">
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
          nycgrid
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">Something went wrong.</p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            Try again
          </button>
          <span className="text-[var(--color-text-muted)]">·</span>
          <Link
            href="/"
            className="text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
