"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AmbientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[AmbientPlayer] unhandled error:", error);
    }
  }, [error]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-5 px-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">Ambient mode</p>
      <p className="font-mono text-sm text-white/50">Something went wrong.</p>
      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={reset}
          className="font-mono text-xs text-white/60 hover:text-white transition-colors"
        >
          Try again
        </button>
        <span className="text-white/20">·</span>
        <Link
          href="/"
          className="font-mono text-xs text-white/60 hover:text-white transition-colors"
        >
          Exit
        </Link>
      </div>
    </div>
  );
}
