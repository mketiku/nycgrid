"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, LayoutGrid, Tv2, Search } from "lucide-react";
import { ThemeToggle } from "@/features/theme/ThemeToggle";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/collections", label: "Collections" },
  { href: "/ambient", label: "Ambient" },
];

export function AppNav() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isAmbient = pathname === "/ambient";

  // Don't show nav on landing or ambient (both have their own full-screen UI)
  if (isLanding || isAmbient) return null;

  return (
    <>
      {/* ── Desktop top nav ── */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-40 h-12 items-center justify-between px-5 border-b border-[var(--color-border)] bg-[var(--color-base)]/90 backdrop-blur-sm">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-tighter text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
        >
          NYC<span className="text-[var(--color-accent)]">GRID</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              className={`px-3 min-h-[44px] flex items-center font-mono text-xs rounded-md transition-colors ${
                pathname.startsWith(href)
                  ? "text-[var(--color-accent)] bg-[var(--color-surface)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-base)]/95 backdrop-blur-sm"
      >
        <MobileNavItem href="/explore" icon={<Map className="w-5 h-5" />} label="Map" />
        <MobileNavItem
          href="/collections"
          icon={<LayoutGrid className="w-5 h-5" />}
          label="Collections"
        />
        <MobileNavItem href="/ambient" icon={<Tv2 className="w-5 h-5" />} label="Ambient" />
        {pathname.startsWith("/explore") && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("map:openBrowser"))}
            className="flex flex-col items-center justify-center gap-0.5 px-4 min-h-[44px] flex-1 transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          >
            <Search className="w-5 h-5" />
            <span className="font-mono text-[9px] uppercase tracking-widest">Browse</span>
          </button>
        )}
      </nav>

      {/* Spacer so content isn't hidden behind desktop nav */}
      <div className="hidden md:block h-12" />
    </>
  );
}

function MobileNavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center gap-0.5 px-4 min-h-[44px] flex-1 transition-colors ${
        active
          ? "text-[var(--color-accent)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
      }`}
    >
      {icon}
      <span className="font-mono text-[9px] uppercase tracking-widest">{label}</span>
    </Link>
  );
}
