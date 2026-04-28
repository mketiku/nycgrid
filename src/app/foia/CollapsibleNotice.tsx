"use client";

import { useState } from "react";

const NOTICES = [
  "This portal accepts requests for documents held by B.R.A.K.E. only.",
  "Requests for documents that do not exist will be acknowledged but not fulfilled.",
  "B.R.A.K.E. is not responsible for the condition, accuracy, or existence of any document.",
  "Processing fees may apply. Fee schedule available upon request (allow 18–24 months).",
];

export function CollapsibleNotice() {
  const [open, setOpen] = useState(false);

  return (
    <section className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-elevated)] transition-colors"
        aria-expanded={open}
      >
        <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-accent)]">
          Important Notice
        </span>
        <span
          className="font-mono text-[9px] text-[var(--color-text-muted)] transition-transform duration-150"
          style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          ↓
        </span>
      </button>

      {open && (
        <ul className="flex flex-col gap-2 px-4 pb-4">
          {NOTICES.map((note) => (
            <li key={note} className="flex items-start gap-2">
              <span
                className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
              <span className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {note}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
