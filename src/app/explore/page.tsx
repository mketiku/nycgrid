import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore — nycgrid",
  description: "Browse all NYC public traffic cameras on an interactive map.",
  robots: { index: false },
};

export default function ExplorePage() {
  return (
    <div
      aria-label="Explore legal links"
      className="pointer-events-none fixed bottom-3 right-3 z-10 hidden items-center gap-3 rounded px-2 py-1 backdrop-blur-sm md:flex"
      style={{ backgroundColor: "color-mix(in srgb, var(--color-base) 75%, transparent)" }}
    >
      <a
        href="https://webcams.nyctmc.org"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        Data: NYC Department of Transportation ↗
      </a>
      <Link
        href="/about"
        className="pointer-events-auto font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        About
      </Link>
      <Link
        href="/legal/terms"
        className="pointer-events-auto font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        Terms
      </Link>
      <Link
        href="/legal/privacy"
        className="pointer-events-auto font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        Privacy
      </Link>
    </div>
  );
}
