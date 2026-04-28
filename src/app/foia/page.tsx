import type { Metadata } from "next";
import Link from "next/link";
import { FoiaForm } from "./FoiaForm";
import { CollapsibleNotice } from "./CollapsibleNotice";

export const metadata: Metadata = {
  title: "FOIA Request Portal — B.R.A.K.E.",
  robots: { index: false, follow: false },
};

export default function FoiaPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
      <Link
        href="/"
        className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors self-start"
      >
        ← Home
      </Link>

      {/* Letterhead */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-10 h-10 border-2 border-[var(--color-accent)] rounded font-mono text-[var(--color-accent)] leading-none select-none shrink-0">
            <span className="text-[9px] font-bold tracking-widest">NYC</span>
            <span className="text-[7px] tracking-widest opacity-70">GOV</span>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
              City of New York — Official Portal
            </p>
            <h1 className="font-mono text-sm font-bold text-[var(--color-text-primary)] leading-snug">
              B.R.A.K.E. — Bureau of Road Access and Kinetics Engineering
            </h1>
          </div>
        </div>

        <div className="border-t border-b border-[var(--color-border)] py-2">
          <p className="font-mono text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-widest">
            Freedom of Information Act — Public Records Request Form
          </p>
          <p className="font-mono text-[10px] text-[var(--color-text-muted)] mt-0.5">
            Pursuant to N.Y. Pub. Off. Law §§ 84–90 · Form B.R.A.K.E.-FOIA-7 (Rev. 2009)
          </p>
        </div>
      </section>

      <CollapsibleNotice />

      {/* Form */}
      <section className="flex flex-col gap-4">
        <FoiaForm />
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-1">
        <p className="font-mono text-[10px] text-[var(--color-text-muted)] leading-relaxed">
          This portal is provided as-is. B.R.A.K.E. is not responsible for documents that do not
          exist, have never existed, or have been misplaced in an interdepartmental transfer.
        </p>
        <p className="font-mono text-[10px] text-[var(--color-text-muted)] leading-relaxed">
          For in-person submissions, visit your nearest Borough office. Bring ID. Expect a wait.
        </p>
      </footer>
    </main>
  );
}
