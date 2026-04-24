import { render, screen } from "@testing-library/react";
import { StatCard, MiniBar } from "./StatsGrid";
import { describe, it, expect } from "vitest";

describe("StatCard", () => {
  it("renders label and formatted value", () => {
    render(<StatCard label="Total Cameras" value={1234} />);
    expect(screen.getByText("1,234")).toBeDefined();
    expect(screen.getByText("Total Cameras")).toBeDefined();
  });

  it("applies custom color to the value text", () => {
    render(<StatCard label="Online" value={100} color="#00ff00" />);
    const value = screen.getByText("100");
    expect(value.style.color).toBe("#00ff00");
  });
});

describe("MiniBar", () => {
  it("renders progressbar with correct aria attributes and width", () => {
    render(<MiniBar percent={75} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("75");

    // The fill div is the only child
    const fill = bar.firstChild as HTMLElement;
    expect(fill.style.width).toBe("75%");
  });
});
