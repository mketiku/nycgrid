import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CivicLayersToggle } from "./CivicLayersToggle";

describe("CivicLayersToggle", () => {
  it("reports pressed state and calls onToggle", () => {
    const onToggle = vi.fn();
    render(<CivicLayersToggle enabled={false} zoomedOut={false} onToggle={onToggle} />);

    const button = screen.getByRole("button", { name: /street layers/i });
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows a legend for the three layers when enabled", () => {
    render(<CivicLayersToggle enabled zoomedOut={false} onToggle={() => {}} />);
    expect(screen.getByText("Bike lanes")).toBeInTheDocument();
    expect(screen.getByText("Street projects")).toBeInTheDocument();
    expect(screen.getByText("Priority corridors")).toBeInTheDocument();
  });

  it("tells the user to zoom in when the map is too far out to load layers", () => {
    render(<CivicLayersToggle enabled zoomedOut onToggle={() => {}} />);
    expect(screen.getByRole("status")).toHaveTextContent("Zoom in to see street layers");
  });

  it("hides the legend when disabled", () => {
    render(<CivicLayersToggle enabled={false} zoomedOut onToggle={() => {}} />);
    expect(screen.queryByText("Bike lanes")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
