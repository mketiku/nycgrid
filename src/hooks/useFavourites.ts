"use client";

import { useEffect, useMemo } from "react";
import { create } from "zustand";

const STORAGE_KEY = "nycgrid-favourites";

function loadIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function saveIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

interface FavouritesStoreState {
  ids: string[];
  hydrated: boolean;
  hydrate(): void;
  toggle(id: string): void;
  addMany(ids: string[]): void;
  removeMany(ids: string[]): void;
}

export const useFavouritesStore = create<FavouritesStoreState>()((set, get) => ({
  ids: [],
  hydrated: false,
  hydrate() {
    if (get().hydrated) return;
    set({ ids: loadIds(), hydrated: true });
  },
  toggle(id) {
    set((s) => {
      const ids = s.ids.includes(id) ? s.ids.filter((i) => i !== id) : [...s.ids, id];
      saveIds(ids);
      return { ids };
    });
  },
  addMany(newIds) {
    set((s) => {
      const ids = [...new Set([...s.ids, ...newIds])];
      saveIds(ids);
      return { ids };
    });
  },
  removeMany(toRemove) {
    set((s) => {
      const ids = s.ids.filter((i) => !toRemove.includes(i));
      saveIds(ids);
      return { ids };
    });
  },
}));

export interface UseFavouritesReturn {
  favourites: Set<string>;
  toggle: (id: string) => void;
  addMany: (ids: string[]) => void;
  removeMany: (ids: string[]) => void;
  isFavourite: (id: string) => boolean;
}

export function useFavourites(): UseFavouritesReturn {
  const { ids, toggle, addMany, removeMany, hydrate } = useFavouritesStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const favourites = useMemo(() => new Set(ids), [ids]);
  return { favourites, toggle, addMany, removeMany, isFavourite: (id) => favourites.has(id) };
}
