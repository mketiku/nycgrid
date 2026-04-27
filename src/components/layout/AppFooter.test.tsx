import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppFooter } from "./AppFooter";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("AppFooter", () => {
  it("renders when not on a hidden route", () => {
    vi.mocked(usePathname).mockReturnValue("/about");
    const { container } = render(<AppFooter />);
    expect(container.firstChild).not.toBeNull();
  });

  it("returns null when on a hidden route", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    const { container } = render(<AppFooter />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when path starts with a hidden route", () => {
    vi.mocked(usePathname).mockReturnValue("/ambient/player");
    const { container } = render(<AppFooter />);
    expect(container.firstChild).toBeNull();
  });

  describe("footer links", () => {
    beforeEach(() => {
      vi.mocked(usePathname).mockReturnValue("/camera/1");
    });

    it("renders the About link", () => {
      render(<AppFooter />);
      expect(screen.getByRole("link", { name: /About/i })).toBeDefined();
    });

    it("renders the Privacy link", () => {
      render(<AppFooter />);
      expect(screen.getByRole("link", { name: /Privacy/i })).toBeDefined();
    });

    it("renders the Terms link", () => {
      render(<AppFooter />);
      expect(screen.getByRole("link", { name: /Terms/i })).toBeDefined();
    });

    it("renders the NYC DOT attribution link", () => {
      render(<AppFooter />);
      expect(screen.getByRole("link", { name: /NYC DOT/i })).toBeDefined();
    });

    it("renders the Buy me a coffee link", () => {
      render(<AppFooter />);
      expect(screen.getByRole("link", { name: /Buy me a coffee/i })).toBeDefined();
    });
  });

  describe("ComplaintDropdown", () => {
    beforeEach(() => {
      vi.mocked(usePathname).mockReturnValue("/camera/1");
    });

    it("shows 'File a complaint' toggle button", () => {
      render(<AppFooter />);
      expect(screen.getByRole("button", { name: /File a complaint/i })).toBeDefined();
    });

    it("dropdown is closed by default", () => {
      render(<AppFooter />);
      expect(screen.queryByRole("menu")).toBeNull();
    });

    it("opens the dropdown when the toggle is clicked", () => {
      render(<AppFooter />);
      fireEvent.click(screen.getByRole("button", { name: /File a complaint/i }));
      expect(screen.getByRole("menu")).toBeDefined();
    });

    it("shows all three complaint destination links when open", () => {
      render(<AppFooter />);
      fireEvent.click(screen.getByRole("button", { name: /File a complaint/i }));
      expect(screen.getByRole("menuitem", { name: /The city/i })).toBeDefined();
      expect(screen.getByRole("menuitem", { name: /The people running it/i })).toBeDefined();
      expect(screen.getByRole("menuitem", { name: /This website/i })).toBeDefined();
    });

    it("closes the dropdown when a menu item is clicked", async () => {
      render(<AppFooter />);
      fireEvent.click(screen.getByRole("button", { name: /File a complaint/i }));
      expect(screen.getByRole("menu")).toBeDefined();

      fireEvent.click(screen.getByRole("menuitem", { name: /The city/i }));
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    });

    it("toggles the dropdown closed on second button click", async () => {
      render(<AppFooter />);
      const btn = screen.getByRole("button", { name: /File a complaint/i });

      fireEvent.click(btn);
      expect(screen.getByRole("menu")).toBeDefined();

      fireEvent.click(btn);
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    });

    it("closes the dropdown on outside mousedown", async () => {
      render(<AppFooter />);
      fireEvent.click(screen.getByRole("button", { name: /File a complaint/i }));
      expect(screen.getByRole("menu")).toBeDefined();

      // Click outside the dropdown ref
      fireEvent.mouseDown(document.body);
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    });

    it("does not close the dropdown when mousedown is inside the container", () => {
      render(<AppFooter />);
      const btn = screen.getByRole("button", { name: /File a complaint/i });
      fireEvent.click(btn);
      expect(screen.getByRole("menu")).toBeDefined();

      // Mousedown inside the dropdown itself
      fireEvent.mouseDown(screen.getByRole("menu"));
      expect(screen.getByRole("menu")).toBeDefined();
    });
  });
});
