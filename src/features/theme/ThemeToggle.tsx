"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Palette } from "lucide-react";
import { useThemeStore, THEMES, THEME_LABELS, THEME_ACCENTS, type Theme } from "./useThemeStore";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = THEMES.findIndex((candidate) => candidate === theme);
    optionRefs.current[selectedIndex]?.focus();
  }, [open, theme]);

  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function moveFocus(nextIndex: number) {
    const itemCount = THEMES.length;
    const normalizedIndex = (nextIndex + itemCount) % itemCount;
    optionRefs.current[normalizedIndex]?.focus();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = optionRefs.current.findIndex(
      (button) => button === document.activeElement
    );

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "ArrowDown":
        event.preventDefault();
        moveFocus(currentIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(currentIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        moveFocus(0);
        break;
      case "End":
        event.preventDefault();
        moveFocus(THEMES.length - 1);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Theme: ${THEME_LABELS[theme]}. Click to change.`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        className="flex items-center gap-2 px-3 h-8 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-colors font-mono text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
          style={{ backgroundColor: THEME_ACCENTS[theme] }}
        />
        <Palette className="w-3 h-3" />
        <span className="hidden sm:inline">{THEME_LABELS[theme]}</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Theme options"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-10 z-50 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)] shadow-2xl overflow-hidden"
        >
          <div className="p-1">
            {THEMES.map((t: Theme, index) => (
              <button
                key={t}
                type="button"
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                onClick={() => {
                  setTheme(t);
                  closeMenu();
                }}
                role="menuitemradio"
                aria-checked={theme === t}
                tabIndex={theme === t ? 0 : -1}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-xs transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset ${
                  theme === t
                    ? "bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border"
                  style={{
                    backgroundColor: THEME_ACCENTS[t],
                    borderColor: t === "light" ? "#cccccc" : "transparent",
                  }}
                />
                {THEME_LABELS[t]}
                {theme === t && <span className="ml-auto text-[var(--color-accent)]">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
