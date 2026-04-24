"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_ON = ["/", "/ambient", "/explore", "/camera/"];

export function AppFooter() {
  const pathname = usePathname() ?? "";

  if (HIDDEN_ON.some((route) => (route === "/" ? pathname === "/" : pathname.startsWith(route)))) {
    return null;
  }

  return (
    <footer className="border-t border-[var(--color-border)] px-4 sm:px-6 py-6">
      <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/about"
            className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            About
          </Link>
          <Link
            href="/legal/privacy"
            className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/legal/terms"
            className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            Terms
          </Link>
        </div>
        <a
          href="https://webcams.nyctmc.org"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          Data: NYC Department of Transportation ↗
        </a>
      </div>
    </footer>
  );
}
