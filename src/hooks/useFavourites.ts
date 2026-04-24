"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "nycgrid-favourites";

interface UseFavouritesReturn {
  favourites: Set<string>;
  toggle: (id: string) => void;
  addMany: (ids: string[]) => void;
  removeMany: (ids: string[]) => void;
  isFavourite: (id: string) => boolean;
}

export function useFavourites(): UseFavouritesReturn {
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadStored = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavourites(new Set(parsed as string[]));
          }
        }
      } catch {
        // ignore malformed localStorage data
      }
    };
    loadStored();
  }, []);

  function persist(next: Set<string>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore write failures (e.g. private browsing quota)
    }
  }

  function updateFavourites(updater: (prev: Set<string>) => Set<string>): void {
    setFavourites((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }

  function toggle(id: string): void {
    updateFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function addMany(ids: string[]): void {
    updateFavourites((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        next.add(id);
      }
      return next;
    });
  }

  function removeMany(ids: string[]): void {
    updateFavourites((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
  }

  function isFavourite(id: string): boolean {
    return favourites.has(id);
  }

  return { favourites, toggle, addMany, removeMany, isFavourite };
}
