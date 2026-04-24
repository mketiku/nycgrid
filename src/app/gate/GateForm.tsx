"use client";

import { useActionState } from "react";
import { enterGate } from "./actions";

interface GateFormProps {
  from?: string;
}

export function GateForm({ from }: GateFormProps) {
  const [state, formAction, isPending] = useActionState(enterGate, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="from" value={from ?? ""} />
      <input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        className="w-full px-3 py-2 font-mono text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded focus:outline-none focus:border-[var(--color-border-accent)]"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-3 py-2 font-mono text-sm font-bold bg-[var(--color-accent)] text-[var(--color-base)] rounded hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? "Checking…" : "Enter"}
      </button>
      {state.error && (
        <p
          role="alert"
          aria-live="polite"
          className="font-mono text-xs text-[var(--color-error)] text-center"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
