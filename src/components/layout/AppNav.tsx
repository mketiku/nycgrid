"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Map,
  LayoutGrid,
  Tv2,
  GalleryHorizontal,
  MoreHorizontal,
  X,
  Search,
  Info,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { MOBILE_NAV_SAFE_HEIGHT_CLASS } from "@/components/layout/mobileNav";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/ambient", label: "Ambient" },
  { href: "/collections", label: "Collections" },
  { href: "/gallery", label: "Gallery" },
  { href: "/postcard", label: "Postcard" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const isLanding = pathname === "/";
  const isAmbient = pathname === "/ambient";

  useEffect(() => {
    const handler = (e: Event) => {
      setIsBrowserOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    };
    window.addEventListener("map:browserState", handler);
    return () => window.removeEventListener("map:browserState", handler);
  }, []);

  // Don't show nav on landing or ambient (both have their own full-screen UI)
  if (isLanding || isAmbient) return null;

  const handleCameraSearch = () => {
    if (pathname.startsWith("/explore")) {
      window.dispatchEvent(new CustomEvent("map:openBrowser"));
    } else {
      router.push("/explore");
    }
  };

  return (
    <>
      {/* ── Desktop top nav ── */}
      <header className="hidden desktop-layout:flex fixed top-0 left-0 right-0 z-40 h-12 items-center justify-between px-5 border-b border-[var(--color-border)] bg-[var(--color-base)]/90 backdrop-blur-sm">
        <Link
          href="/"
          onClick={() => window.dispatchEvent(new CustomEvent("nav:logoClick"))}
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
        data-testid="mobile-nav"
        aria-label="Primary"
        className={`desktop-layout:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-base)]/95 backdrop-blur-sm ${MOBILE_NAV_SAFE_HEIGHT_CLASS} pb-[env(safe-area-inset-bottom)]`}
      >
        {/* MAP tab: closes the camera browser if open, otherwise navigates */}
        {isBrowserOpen ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("map:closeBrowser"))}
            aria-label="Back to map"
            className="flex flex-col items-center justify-center gap-0.5 px-4 min-h-[44px] flex-1 transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          >
            <Map className="w-5 h-5" />
            <span className="font-mono text-[9px] uppercase tracking-widest">Map</span>
          </button>
        ) : (
          <MobileNavItem href="/explore" icon={<Map className="w-5 h-5" />} label="Map" />
        )}
        <MobileNavItem
          href="/collections"
          icon={<LayoutGrid className="w-5 h-5" />}
          label="Collections"
        />
        <MobileNavItem href="/ambient" icon={<Tv2 className="w-5 h-5" />} label="Ambient" />
        <button
          type="button"
          onClick={handleCameraSearch}
          aria-label="Search cameras"
          className={`flex flex-col items-center justify-center gap-0.5 px-4 min-h-[44px] flex-1 transition-colors ${
            isBrowserOpen
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="font-mono text-[9px] uppercase tracking-widest">Search</span>
        </button>
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-label="More options"
          onClick={() => setMoreOpen((o) => !o)}
          className={`flex flex-col items-center justify-center gap-0.5 px-4 min-h-[44px] flex-1 transition-colors ${
            moreOpen
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          {moreOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
          <span className="font-mono text-[9px] uppercase tracking-widest">More</span>
        </button>
      </nav>

      {/* ── More sheet (mobile only) ── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="desktop-layout:hidden fixed inset-0 z-30 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMoreOpen(false)}
            />
            {/* Sheet */}
            <motion.div
              className="desktop-layout:hidden fixed left-0 right-0 z-35 border-t border-[var(--color-border)] bg-[var(--color-base)] px-4 py-3"
              style={{ bottom: `calc(3.5rem + env(safe-area-inset-bottom, 0px))` }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300, mass: 0.8 }}
            >
              <p className="mb-3 font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
                More
              </p>
              <div className="flex flex-col gap-1">
                <Link
                  href="/"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
                >
                  <Home className="w-5 h-5 text-[var(--color-text-muted)]" />
                  <span>Home</span>
                </Link>
                <Link
                  href="/gallery"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
                >
                  <GalleryHorizontal className="w-5 h-5 text-[var(--color-text-muted)]" />
                  <span>My Gallery</span>
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
                >
                  <Info className="w-5 h-5 text-[var(--color-text-muted)]" />
                  <span>About</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer so content isn't hidden behind desktop nav */}
      <div className="hidden desktop-layout:block h-12" />
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
