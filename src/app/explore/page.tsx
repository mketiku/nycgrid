import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore — nycgrid",
  description: "Browse all NYC public traffic cameras on an interactive map.",
  robots: { index: false },
};

const linkCls =
  "pointer-events-auto font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors";

export default function ExplorePage() {
  return (
    <div
      aria-label="Map attribution and legal links"
      className="pointer-events-none fixed bottom-3 right-3 z-10 hidden md:flex items-center gap-2 rounded px-2 py-1 backdrop-blur-sm md:gap-3"
      style={{ backgroundColor: "color-mix(in srgb, var(--color-base) 75%, transparent)" }}
    >
      <a
        href="https://carto.com/attributions"
        target="_blank"
        rel="noopener noreferrer"
        className={linkCls}
      >
        © Carto
      </a>
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className={linkCls}
      >
        © OpenStreetMap
      </a>
      <a
        href="https://webcams.nyctmc.org"
        target="_blank"
        rel="noopener noreferrer"
        className={`${linkCls} hidden md:inline`}
      >
        Data: NYC Department of Transportation ↗
      </a>
      <Link href="/about" className={`${linkCls} hidden md:inline`}>
        About
      </Link>
      <Link href="/legal/terms" className={`${linkCls} hidden md:inline`}>
        Terms
      </Link>
      <Link href="/legal/privacy" className={`${linkCls} hidden md:inline`}>
        Privacy
      </Link>
    </div>
  );
}
