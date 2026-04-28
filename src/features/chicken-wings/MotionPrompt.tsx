"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface MotionPromptProps {
  requestMotionPermission: () => Promise<"granted" | "denied">;
}

export function MotionPrompt({ requestMotionPermission }: MotionPromptProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("brake-motion-armed") === "1";
  });
  const [status, setStatus] = useState<"idle" | "granted" | "denied">("idle");

  async function handleArm() {
    const state = await requestMotionPermission();
    setStatus(state);
    if (state === "granted") {
      localStorage.setItem("brake-motion-armed", "1");
      setTimeout(() => setDismissed(true), 2000);
    }
  }

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="status"
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] left-4 right-4 z-[199] max-w-sm mx-auto"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        <div className="bg-[var(--color-base)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden">
          <div className="h-px w-full bg-[var(--color-border)]" />
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
                B.R.A.K.E. — MOTION PROTOCOL
              </p>
              {status === "idle" && (
                <p className="font-mono text-xs text-[var(--color-text-primary)]">
                  Shake detection offline
                </p>
              )}
              {status === "granted" && (
                <p className="font-mono text-xs" style={{ color: "var(--color-online)" }}>
                  SHAKE PROTOCOL ARMED
                </p>
              )}
              {status === "denied" && (
                <p className="font-mono text-xs" style={{ color: "var(--color-error, #ef4444)" }}>
                  MOTION ACCESS DENIED
                </p>
              )}
            </div>
            {status === "idle" && (
              <button
                onClick={handleArm}
                aria-label="Arm shake detection"
                className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-[var(--color-border)] rounded text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
              >
                ARM
              </button>
            )}
            {status === "denied" && (
              <button
                onClick={() => setDismissed(true)}
                aria-label="Close motion prompt"
                className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
