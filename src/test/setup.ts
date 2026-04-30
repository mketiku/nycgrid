import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));

afterEach(() => {
  cleanup();
});
