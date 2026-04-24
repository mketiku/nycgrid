import { render, screen } from "@testing-library/react";
import { CameraLore } from "./CameraLore";
import { describe, it, expect } from "vitest";

describe("CameraLore", () => {
  it("renders a list of facts with their categories and text", () => {
    const facts = [
      { category: "history", fact: "This area has a long history." },
      { category: "nature", fact: "Parks are nearby." },
    ];
    render(<CameraLore facts={facts} />);
    expect(screen.getByText("history")).toBeDefined();
    expect(screen.getByText("This area has a long history.")).toBeDefined();
    expect(screen.getByText("nature")).toBeDefined();
    expect(screen.getByText("Parks are nearby.")).toBeDefined();
  });

  it("returns null when the facts array is empty", () => {
    const { container } = render(<CameraLore facts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("applies correct theme-defined or hex colors to categories", () => {
    const facts = [{ category: "culture", fact: "Vibrant art scene." }];
    render(<CameraLore facts={facts} />);
    const category = screen.getByText("culture");
    expect(category.style.color).toBe("#a78bfa");
  });

  it("falls back to muted color for unknown categories", () => {
    const facts = [{ category: "unknown", fact: "Some random fact." }];
    render(<CameraLore facts={facts} />);
    const category = screen.getByText("unknown");
    expect(category.style.color).toBe("var(--color-text-muted)");
  });

  it("renders in compact mode", () => {
    const facts = [{ category: "history", fact: "Old place." }];
    const { container } = render(<CameraLore facts={facts} compact={true} />);
    expect(container.firstChild).toHaveClass("gap-3");
    expect(screen.getByText("Old place.")).not.toHaveClass("text-[13px]");
  });
});
