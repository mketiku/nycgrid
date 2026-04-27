import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/spotlight/CameraSpotlight", () => ({
  CameraSpotlight: () => <div data-testid="camera-spotlight">Spotlight</div>,
  CameraSpotlightSkeleton: () => <div data-testid="camera-spotlight-skeleton">Loading</div>,
}));

vi.mock("@/features/theme/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

import LandingPage from "./page";

describe("LandingPage", () => {
  it("renders the hero content, stats, and spotlight section", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: /nyc grid/i })).toBeDefined();
    expect(screen.getByText(/traffic cameras have always been public/i)).toBeDefined();
    // Page now has multiple "Explore the map" links (hero CTA + Learn card)
    const exploreLinks = screen.getAllByRole("link", { name: /explore the map/i });
    expect(exploreLinks.length).toBeGreaterThanOrEqual(1);
    exploreLinks.forEach((link) => expect(link).toHaveAttribute("href", "/explore"));

    expect(screen.getAllByRole("link", { name: /view network stats/i })[0]).toHaveAttribute(
      "href",
      "/stats"
    );
    expect(screen.getByText("Public cameras")).toBeDefined();
    expect(screen.getByText("Boroughs")).toBeDefined();
    expect(screen.getByText("Feeds")).toBeDefined();
    expect(screen.getByTestId("camera-spotlight")).toBeDefined();
    expect(screen.getByTestId("landing-lower-sections")).toHaveClass("gap-12", "sm:gap-16");
    expect(screen.getByTestId("landing-page-ending")).toHaveClass(
      "rounded-2xl",
      "border",
      "p-6",
      "sm:p-8"
    );
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/legal/privacy");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/legal/terms");
    expect(screen.getByTestId("theme-toggle")).toBeDefined();
  });
});
