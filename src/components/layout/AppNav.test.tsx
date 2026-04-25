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

  it("dispatches map:openBrowser when the Search button is tapped on /explore", () => {
    mockUsePathname.mockReturnValue("/explore");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: /search cameras/i }));

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect((dispatchSpy.mock.calls[0][0] as CustomEvent).type).toBe("map:openBrowser");
  });

  it("Search is always visible in the mobile nav bar", () => {
    mockUsePathname.mockReturnValue("/collections");

    render(<AppNav />);

    expect(screen.getByRole("button", { name: /search cameras/i })).toBeInTheDocument();
  });

  it("Home is hidden until More sheet opens", () => {
    mockUsePathname.mockReturnValue("/collections");

    render(<AppNav />);

    // Home only lives in the More sheet — not visible before it opens
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();

    // Open More
    fireEvent.click(screen.getByRole("button", { name: /more options/i }));

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});
