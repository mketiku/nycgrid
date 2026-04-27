import type { Metadata } from "next";
import { FoiaForm } from "./FoiaForm";

export const metadata: Metadata = {
  title: "FOIA Request Portal — B.R.A.K.E.",
  robots: { index: false, follow: false },
};

export default function FoiaPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-10">
      {/* Letterhead */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-12 h-12 border-2 border-[var(--color-accent)] rounded font-mono text-[var(--color-accent)] leading-none select-none shrink-0">
            <span className="text-[10px] font-bold tracking-widest">NYC</span>
            <span className="text-[8px] tracking-widest opacity-70">GOV</span>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
              City of New York — Official Portal
            </p>
            <h1 className="font-mono text-base font-bold text-[var(--color-text-primary)] leading-tight">
              NYC Bureau of Road Access and Kinetics Engineering
            </h1>
            <p className="font-mono text-[10px] text-[var(--color-accent)] tracking-widest">
              B.R.A.K.E.
            </p>
          </div>
        </div>

        <div className="border-t border-b border-[var(--color-border)] py-3 mt-1">
          <p className="font-mono text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-widest">
            Freedom of Information Act — Public Records Request Form
          </p>
          <p className="font-mono text-[10px] text-[var(--color-text-muted)] mt-0.5">
            Pursuant to N.Y. Pub. Off. Law §§ 84–90 · Form B.R.A.K.E.-FOIA-7 (Rev. 2009)
          </p>
        </div>
      </section>

      {/* Notice */}
      <section className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg p-4">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-accent)] mb-2">
          Important Notice
        </p>
        <ul className="flex flex-col gap-1.5">
          {[
            "This portal accepts requests for documents held by B.R.A.K.E. only.",
            "Requests for documents that do not exist will be acknowledged but not fulfilled.",
            "B.R.A.K.E. is not responsible for the condition, accuracy, or existence of any document.",
            "Processing fees may apply. Fee schedule available upon request (allow 18–24 months).",
          ].map((note) => (
            <li key={note} className="flex items-start gap-2">
              <span
                className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
              <span className="font-mono text-[10px] text-[var(--color-text-secondary)] leading-relaxed">
                {note}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Form */}
      <section className="flex flex-col gap-4">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
          Section A — Requestor Information &amp; Document Specification
        </p>
        <FoiaForm />
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] pt-6 flex flex-col gap-1">
        <p className="font-mono text-[9px] text-[var(--color-text-muted)]">
          This portal is provided as-is. B.R.A.K.E. is not responsible for documents that do not
          exist, have never existed, or have been misplaced in an interdepartmental transfer.
        </p>
        <p className="font-mono text-[9px] text-[var(--color-text-muted)]">
          For in-person submissions, visit your nearest Borough office. Bring ID. Expect a wait.
        </p>
      </footer>
    </main>
  );
}
