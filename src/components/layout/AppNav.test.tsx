import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppNav } from "./AppNav";

const mockUsePathname = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockPush }),
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

  it("uses a mobile-safe height contract for the persistent bottom nav", () => {
    mockUsePathname.mockReturnValue("/collections");

    render(<AppNav />);

    expect(screen.getByTestId("mobile-nav")).toHaveClass(
      "h-[calc(3.5rem+env(safe-area-inset-bottom))]",
      "pb-[env(safe-area-inset-bottom)]"
    );
  });

  it("dispatches map:openBrowser when Search cameras is tapped via More sheet on /explore", () => {
    mockUsePathname.mockReturnValue("/explore");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(<AppNav />);

    // Open the More sheet first
    fireEvent.click(screen.getByRole("button", { name: /more options/i }));

    // Then tap Search cameras inside the sheet
    fireEvent.click(screen.getByRole("button", { name: /search cameras/i }));

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect((dispatchSpy.mock.calls[0][0] as CustomEvent).type).toBe("map:openBrowser");
  });

  it("renders Selfies nav link and no Home tab in mobile bar", () => {
    mockUsePathname.mockReturnValue("/gallery");

    render(<AppNav />);

    // Selfies is in the primary nav bar
    expect(screen.getAllByRole("link", { name: /selfies/i }).length).toBeGreaterThan(0);

    // Home is NOT a direct bottom-bar link — it lives inside the More sheet (not rendered until opened)
    const homeLinks = screen.queryAllByRole("link", { name: /go to homepage/i });
    expect(homeLinks.length).toBe(0);
  });
});
