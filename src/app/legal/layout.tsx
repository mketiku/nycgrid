import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-[var(--color-border)] px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          nycgrid
        </Link>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="prose-legal">{children}</div>
      </div>
    </div>
  );
}
