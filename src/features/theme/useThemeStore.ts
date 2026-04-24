"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "street" | "brutalist" | "light";

export const THEMES: Theme[] = ["street", "brutalist", "light"];

export const THEME_LABELS: Record<Theme, string> = {
  street: "Street",
  brutalist: "Brutalist",
  light: "Light",
};

export const THEME_ACCENTS: Record<Theme, string> = {
  street: "#ffde00",
  brutalist: "#ffffff",
  light: "#0a0a0a",
};

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && THEMES.includes(value as Theme);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "street",

      setTheme: (theme) => set({ theme }),

      cycleTheme: () => {
        const current = get().theme;
        const idx = THEMES.indexOf(current);
        const next = THEMES[(idx + 1) % THEMES.length];
        set({ theme: next });
      },
    }),
    {
      name: "nycgrid-theme",
      partialize: (state) => ({ theme: state.theme }),
      merge: (persisted, current) => {
        const persistedTheme =
          typeof persisted === "object" && persisted !== null && "theme" in persisted
            ? (persisted as { theme?: unknown }).theme
            : null;

        return {
          ...current,
          theme: isTheme(persistedTheme) ? persistedTheme : current.theme,
        };
      },
    }
  )
);
