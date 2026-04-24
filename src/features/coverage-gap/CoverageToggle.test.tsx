import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoverageToggle } from "./CoverageToggle";

describe("CoverageToggle", () => {
  it("renders a button with aria-pressed=false when disabled", () => {
    render(<CoverageToggle enabled={false} onToggle={() => {}} />);
    const btn = screen.getByRole("button", { name: /coverage/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("does not show the legend when disabled", () => {
    render(<CoverageToggle enabled={false} onToggle={() => {}} />);
    expect(screen.queryByText(/low.*high density/i)).not.toBeInTheDocument();
  });

  it("renders with aria-pressed=true when enabled", () => {
    render(<CoverageToggle enabled={true} onToggle={() => {}} />);
    const btn = screen.getByRole("button", { name: /coverage/i });
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the legend when enabled", () => {
    render(<CoverageToggle enabled={true} onToggle={() => {}} />);
    expect(screen.getAllByText("Coverage")).toHaveLength(2);
    expect(screen.getByText(/low \/ high/i)).toBeInTheDocument();
  });

  it("can hide the visual legend while keeping the accessible button name", () => {
    render(<CoverageToggle enabled={true} onToggle={() => {}} showLegend={false} />);
    expect(screen.getByRole("button", { name: /coverage/i })).toBeInTheDocument();
    expect(screen.queryByText(/low \/ high/i)).not.toBeInTheDocument();
  });

  it("calls onToggle when the button is clicked", async () => {
    const onToggle = vi.fn();
    render(<CoverageToggle enabled={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button", { name: /coverage/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
