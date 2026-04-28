"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

const RESOURCES = [
  { label: "NYC Open Data", url: "https://opendata.cityofnewyork.us/" },
  { label: "NYC DOT Transportation Data", url: "https://data.cityofnewyork.us/Transportation" },
  { label: "BetaNYC", url: "https://beta.nyc/" },
  { label: "Webcam API (this site's source)", url: "https://webcams.nyctmc.org" },
] as const;

interface OpendataToastProps {
  open: boolean;
  onClose: () => void;
}

export function OpendataToast({ open, onClose }: OpendataToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 12_000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-[200] w-full max-w-xs sm:max-w-sm"
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
        >
          <div className="bg-[var(--color-base)] border border-[var(--color-border)] rounded-lg shadow-2xl overflow-hidden">
            <div className="h-px w-full" style={{ backgroundColor: "var(--color-accent)" }} />
            <div className="px-4 py-3 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
                    B.R.A.K.E. — DECLASSIFIED UPLINK
                  </p>
                  <p className="font-mono text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
                    NYC Open Data Resources
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-0.5 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="flex flex-col gap-1.5">
                {RESOURCES.map(({ label, url }) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1.5"
                    >
                      <span className="text-[var(--color-text-muted)]">↗</span>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
