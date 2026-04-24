import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./GateForm", () => ({
  GateForm: ({ from }: { from?: string }) => <div data-testid="gate-form" data-from={from ?? ""} />,
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

import GatePage from "./page";

describe("GatePage", () => {
  it("renders the NYCGRID wordmark — NYC and GRID text visible", async () => {
    const page = await GatePage({ searchParams: Promise.resolve({}) });
    render(page);
    expect(screen.getByText("NYC")).toBeDefined();
    expect(screen.getByText("GRID")).toBeDefined();
  });

  it("renders the 'Access restricted' tagline", async () => {
    const page = await GatePage({ searchParams: Promise.resolve({}) });
    render(page);
    expect(screen.getByText(/access restricted/i)).toBeDefined();
  });

  it("passes from param to GateForm", async () => {
    const page = await GatePage({
      searchParams: Promise.resolve({ from: "/explore" }),
    });
    render(page);
    const form = screen.getByTestId("gate-form");
    expect(form.getAttribute("data-from")).toBe("/explore");
  });

  it("passes empty from when no param", async () => {
    const page = await GatePage({ searchParams: Promise.resolve({}) });
    render(page);
    const form = screen.getByTestId("gate-form");
    expect(form.getAttribute("data-from")).toBe("");
  });
});
