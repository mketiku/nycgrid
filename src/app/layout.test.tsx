import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("next/font/google", () => ({
  JetBrains_Mono: () => ({ variable: "font-mono" }),
  Inter: () => ({ variable: "font-sans" }),
}));

vi.mock("@/features/theme/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layout/AppNav", () => ({
  AppNav: () => <nav data-testid="app-nav" />,
}));

describe("RootLayout", () => {
  it("renders navigation, skip link, and children inside main content", () => {
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
  });
});
