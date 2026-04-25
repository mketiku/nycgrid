import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
});
