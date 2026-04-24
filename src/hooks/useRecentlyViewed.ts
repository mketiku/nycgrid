"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "nycgrid-recent";
const MAX_ENTRIES = 10;

interface UseRecentlyViewedReturn {
  recentIds: string[];
  recordView: (id: string) => void;
}

export function useRecentlyViewed(): UseRecentlyViewedReturn {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    const loadStored = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRecentIds(parsed as string[]);
          }
        }
      } catch {
        // ignore malformed localStorage data
      }
    };
    loadStored();
  }, []);

  function recordView(id: string): void {
    setRecentIds((prev) => {
      const deduped = prev.filter((existingId) => existingId !== id);
      const next = [id, ...deduped].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore write failures (e.g. private browsing quota)
      }
      return next;
    });
  }

  return { recentIds, recordView };
}
