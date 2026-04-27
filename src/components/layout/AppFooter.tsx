"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Coffee } from "lucide-react";

const HIDDEN_ON = ["/", "/ambient", "/explore"];

export function AppFooter() {
  const pathname = usePathname() ?? "";

  if (HIDDEN_ON.some((route) => (route === "/" ? pathname === "/" : pathname.startsWith(route)))) {
    return null;
  }

  return (
    <footer className="border-t border-[var(--color-border)] px-4 sm:px-6 py-6">
      <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {/* Left: legal + attribution */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/about" className={linkClass}>
            About
          </Link>
          <Link href="/legal/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/legal/terms" className={linkClass}>
            Terms
          </Link>
          <a
            href="https://webcams.nyctmc.org"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Data: NYC DOT ↗
          </a>
        </div>
        {/* Right: action + support */}
        <div className="flex items-center gap-x-6 gap-y-2">
          <ComplaintDropdown />
          <a
            href="https://www.buymeacoffee.com/mketiku"
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} flex items-center gap-1.5`}
          >
            <Coffee className="w-3 h-3" />
            Buy me a coffee
          </a>
        </div>
      </div>
    </footer>
  );
}

const linkClass =
  "font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors";

const menuItemClass =
  "font-mono text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-elevated)] px-4 py-2.5 transition-colors";

function ComplaintDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`${linkClass} flex items-center gap-1`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        File a complaint
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="inline-block leading-none"
        >
          ↓
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="absolute bottom-full left-0 mb-2 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
          >
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] px-4 pt-3 pb-2">
              What are we complaining about?
            </p>
            <div className="flex flex-col pb-2">
              <a
                href="https://portal.311.nyc.gov"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={menuItemClass}
              >
                The city →
              </a>
              <a
                href="https://www.mygovnyc.org"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={menuItemClass}
              >
                The people running it →
              </a>
              <a
                href="https://github.com/mketiku/nycgrid/issues"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={menuItemClass}
              >
                This website →
              </a>
              <Link
                href="/foia"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={menuItemClass}
              >
                The developer →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
