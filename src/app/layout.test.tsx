import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("next/font/google", () => ({
  JetBrains_Mono: () => ({ variable: "font-mono" }),
  Space_Grotesk: () => ({ variable: "font-sans" }),
}));

vi.mock("@/features/theme/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layout/AppNav", () => ({
  AppNav: () => <nav data-testid="app-nav" />,
}));

vi.mock("@/components/layout/mobileNav", () => ({
  MOBILE_NAV_CLEARANCE_CLASS: "pb-[calc(3.5rem+env(safe-area-inset-bottom))]",
}));

vi.mock("@/components/layout/AppFooter", () => ({
  AppFooter: () => <footer data-testid="app-footer">Footer</footer>,
}));

vi.mock("@/features/map/PersistentMap", () => ({
  PersistentMap: () => null,
}));

describe("RootLayout", () => {
  it("renders navigation, skip link, footer, and shell clearance around route content", () => {
    render(
      <RootLayout>
        <div>Child content</div>
      </RootLayout>
    );

    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByText("Skip to content")).toBeInTheDocument();
    expect(screen.getByTestId("app-nav")).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();
    expect(document.getElementById("main-content")).toBeTruthy();
    expect(screen.getByTestId("app-shell-footer")).toHaveClass(
      "pb-[calc(3.5rem+env(safe-area-inset-bottom))]",
      "empty:hidden"
    );
    expect(screen.getByTestId("app-footer")).toBeInTheDocument();
  });
});
