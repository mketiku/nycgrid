"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface BadgeToastProps {
  open: boolean;
  onClose: () => void;
}

export function BadgeToast({ open, onClose }: BadgeToastProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-[200] max-w-xs w-full sm:w-80"
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          onClick={onClose}
        >
          <BadgeToastContent onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function randomBadgeNumber() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function expiredDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 30);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function BadgeToastContent({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<"issued" | "revoked">("issued");
  const [badgeNumber] = useState(() => randomBadgeNumber());
  const [validUntil] = useState(() => expiredDate());

  useEffect(() => {
    const revoke = setTimeout(() => setPhase("revoked"), 3000);
    const close = setTimeout(() => onClose(), 7000);
    return () => {
      clearTimeout(revoke);
      clearTimeout(close);
    };
  }, [onClose]);

  return (
    <div className="bg-[var(--color-base)] border border-[var(--color-border)] rounded-lg shadow-2xl overflow-hidden cursor-pointer">
      <div className="h-1 w-full" style={{ backgroundColor: "var(--color-accent)" }} />
      <div className="px-4 py-3 flex flex-col gap-2">
        <AnimatePresence mode="wait">
          {phase === "issued" ? (
            <motion.div
              key="issued"
              className="flex flex-col gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
                B.R.A.K.E. — ACCESS CONTROL
              </p>
              <p className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
                INTERNAL ACCESS BADGE ISSUED
              </p>
              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                  Badge #{badgeNumber}
                </span>
                <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                  Valid until: {validUntil}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="revoked"
              className="flex flex-col gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
                B.R.A.K.E. — ACCESS CONTROL
              </p>
              <p
                className="font-mono text-sm font-bold uppercase tracking-wide"
                style={{ color: "var(--color-error, #ef4444)" }}
              >
                BADGE REVOKED
              </p>
              <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
                Please report to your nearest Borough HQ immediately.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
