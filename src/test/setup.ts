import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Bind happy-dom's localStorage/sessionStorage to globalThis to bypass Node 24+ experimental native storage warnings/errors
if (typeof window !== "undefined") {
  const win = window as Window & { Storage?: new () => Storage };
  // If native Node web storage shadowed or broke happy-dom's window storage, instantiate clean fallbacks
  if (!win.localStorage && win.Storage) {
    Object.defineProperty(win, "localStorage", {
      value: new win.Storage(),
      writable: true,
      configurable: true,
    });
  }
  if (!win.sessionStorage && win.Storage) {
    Object.defineProperty(win, "sessionStorage", {
      value: new win.Storage(),
      writable: true,
      configurable: true,
    });
  }

  Object.defineProperty(globalThis, "localStorage", {
    value: window.localStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    value: window.sessionStorage,
    writable: true,
    configurable: true,
  });
}

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));

afterEach(() => {
  cleanup();
});
