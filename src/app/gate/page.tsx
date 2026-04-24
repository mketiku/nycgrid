import type { Metadata } from "next";
import { GateForm } from "./GateForm";

export const metadata: Metadata = {
  title: "nycgrid",
  robots: { index: false },
};

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-base)] px-4">
      <div className="w-full max-w-xs flex flex-col gap-6">
        <div className="text-center">
          <span className="font-mono text-2xl font-bold text-white">NYC</span>
          <span className="font-mono text-2xl font-bold text-[var(--color-accent)]">GRID</span>
        </div>
        <p className="font-mono text-xs text-[var(--color-text-muted)] text-center tracking-widest uppercase">
          Access restricted
        </p>
        <GateForm from={from} />
      </div>
    </main>
  );
}
