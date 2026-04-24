import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppNav } from "./AppNav";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("AppNav", () => {
  it("marks the current page and does not expose a dead photobooth route", () => {
    mockUsePathname.mockReturnValue("/explore");

    render(<AppNav />);

    const activeExploreLinks = screen.getAllByRole("link", { name: "Explore" });
    expect(activeExploreLinks.length).toBeGreaterThan(0);
    expect(activeExploreLinks.some((link) => link.getAttribute("aria-current") === "page")).toBe(
      true
    );

    expect(screen.queryByRole("link", { name: "Photobooth" })).not.toBeInTheDocument();
  });

  it("does not render on the landing page", () => {
    mockUsePathname.mockReturnValue("/");

    const { container } = render(<AppNav />);

    expect(container).toBeEmptyDOMElement();
  });
});
