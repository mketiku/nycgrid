import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "./ThemeProvider";

let currentTheme = "street";

vi.mock("./useThemeStore", () => ({
  useThemeStore: (selector: (state: { theme: string }) => string) =>
    selector({ theme: currentTheme }),
}));

describe("ThemeProvider", () => {
  afterEach(() => {
    currentTheme = "street";
    document.documentElement.removeAttribute("data-theme");
  });

  it("applies the current theme to the document element", () => {
    render(
      <ThemeProvider>
        <div>child</div>
      </ThemeProvider>
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "street");
  });

  it("updates the document theme attribute when the store theme changes", () => {
    const view = render(
      <ThemeProvider>
        <div>child</div>
      </ThemeProvider>
    );

    currentTheme = "light";
    view.rerender(
      <ThemeProvider>
        <div>child</div>
      </ThemeProvider>
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });
});
