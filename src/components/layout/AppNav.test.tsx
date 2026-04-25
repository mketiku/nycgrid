import { render, screen, fireEvent } from "@testing-library/react";
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
  it("dispatches map:openBrowser event when Browse button is clicked", () => {
    mockUsePathname.mockReturnValue("/explore");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(<AppNav />);

    const browseButton = screen.getByRole("button", { name: /Browse/i });
    fireEvent.click(browseButton);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect((dispatchSpy.mock.calls[0][0] as CustomEvent).type).toBe("map:openBrowser");
  });
});
