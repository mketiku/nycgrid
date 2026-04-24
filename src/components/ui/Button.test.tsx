import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";
import { describe, it, expect, vi } from "vitest";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("handles click events", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText("Click me"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("applies variant and size classes", () => {
    const { rerender } = render(
      <Button variant="primary" size="lg">
        Btn
      </Button>
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-[var(--color-accent)]");
    expect(button.className).toContain("h-11");

    rerender(
      <Button variant="secondary" size="sm">
        Btn
      </Button>
    );
    expect(button.className).toContain("border");
    expect(button.className).toContain("h-7");
  });
});
