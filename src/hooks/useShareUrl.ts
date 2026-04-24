"use client";

import { useState, useCallback } from "react";

export function useShareUrl(url?: string): { copied: boolean; share: () => Promise<void> } {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async () => {
    const target = url ?? window.location.href;
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", target);
    }
  }, [url]);

  return { copied, share };
}
