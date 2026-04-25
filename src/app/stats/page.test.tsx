import { render, screen } from "@testing-library/react";
import StatsPage from "./page";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/cameras/data", () => ({
  CAMERAS: [{ id: "1", name: "Offline Cam", area: "Manhattan", isOnline: false }],
  CAMERA_COUNT: 1,
}));

describe("StatsPage", () => {
  it("renders network status header and summary stats", () => {
    render(<StatsPage />);
    expect(screen.getByText("Network Status")).toBeDefined();
    expect(screen.getByText(/Total cameras/i)).toBeDefined();
    expect(screen.getAllByText(/Online/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Offline/i).length).toBeGreaterThan(0);
  });

  it("renders borough breakdown section", () => {
    render(<StatsPage />);
    expect(screen.getByText(/By borough/i)).toBeDefined();
    expect(screen.getAllByText("Manhattan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Brooklyn").length).toBeGreaterThan(0);
  });

  it("renders fun facts section", () => {
    render(<StatsPage />);
    expect(screen.getByText(/By the numbers/i)).toBeDefined();
    expect(screen.getByText(/Frame requests per day/i)).toBeDefined();
  });

  it("renders small numbers using toLocaleString when online count is 0", () => {
    render(<StatsPage />);
    // online = 0, framesPerDay = 0. fmt(0) should return "0" (via toLocaleString)
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("does not include local personal stats", () => {
    render(<StatsPage />);
    expect(screen.queryByText(/Your grid/i)).toBeNull();
  });
});
