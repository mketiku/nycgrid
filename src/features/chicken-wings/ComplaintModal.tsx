"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

interface ComplaintModalProps {
  open: boolean;
  onClose: () => void;
}

function randomCaseNumber() {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ComplaintModal({ open, onClose }: ComplaintModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [caseNumber] = useState(() => randomCaseNumber());
  const dialogRef = useRef<HTMLDivElement>(null);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    el?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trap = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled")
      );
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSubmit() {
    setSubmitted(true);
  }

  function handleClose() {
    setSubmitted(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="NYC 311 Complaint Form"
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div
              ref={dialogRef}
              className="w-full max-w-md bg-[var(--color-base)] border border-[var(--color-border)] rounded-lg overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] mb-0.5">
                    NYC 311 — RESIDENT SERVICES PORTAL
                  </p>
                  <p className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
                    SUBMIT A COMPLAINT
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close"
                  className="mt-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 py-5">
                {!submitted ? (
                  <div className="flex flex-col gap-4">
                    <Field label="COMPLAINT TYPE">
                      <p className="font-mono text-xs text-[var(--color-text-primary)]">
                        Excessive Use of Public Surveillance Infrastructure
                      </p>
                    </Field>

                    <Field label="AGENCY">
                      <p className="font-mono text-xs text-[var(--color-text-primary)]">
                        NYC Bureau of Road Access and Kinetics Engineering (B.R.A.K.E.)
                      </p>
                    </Field>

                    <Field label="LOCATION">
                      <p className="font-mono text-xs text-[var(--color-text-primary)]">
                        [Intersection Unknown — GPS Refused]
                      </p>
                    </Field>

                    <Field label="DATE FILED">
                      <p className="font-mono text-xs text-[var(--color-text-primary)]">{today}</p>
                    </Field>

                    <Field label="ADDITIONAL COMMENTS">
                      <div className="border border-[var(--color-border)] rounded px-3 py-2 bg-[var(--color-surface)]">
                        <p className="font-mono text-xs text-[var(--color-text-muted)] italic">
                          I was just looking at cameras.
                        </p>
                      </div>
                    </Field>

                    <div className="flex items-center justify-between pt-2 gap-3">
                      <button
                        onClick={handleClose}
                        className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        Never mind, it&apos;s fine
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="font-mono text-xs uppercase tracking-widest px-4 py-2 bg-[var(--color-accent)] text-[var(--color-base)] rounded hover:opacity-90 transition-opacity font-semibold"
                      >
                        Submit Complaint
                      </button>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    className="flex flex-col gap-4 py-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: "var(--color-online)" }}
                      />
                      <p className="font-mono text-xs font-bold text-[var(--color-online)] uppercase tracking-widest">
                        Complaint Received
                      </p>
                    </div>

                    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded p-4 flex flex-col gap-2">
                      <Row label="Case #" value={caseNumber} />
                      <Row label="Status" value="PENDING REVIEW" />
                      <Row label="Est. Resolution" value="6–8 business weeks" />
                      <Row label="Filed with" value="B.R.A.K.E." />
                    </div>

                    <p className="font-mono text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                      You will be contacted at the address on file. If you do not have an address on
                      file, please visit your nearest Borough office with two forms of ID.
                    </p>

                    <button
                      onClick={handleClose}
                      className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors self-end"
                    >
                      Acknowledge
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2">
                <p className="font-mono text-[9px] text-[var(--color-text-muted)]">
                  NYC 311 · Portal v3.1.4 · This portal is provided as-is. B.R.A.K.E. is not
                  responsible for complaints that cannot be actioned.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
        {label}
      </span>
      <span className="font-mono text-xs text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}
