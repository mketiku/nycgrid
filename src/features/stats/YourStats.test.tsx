import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { YourStats } from "./YourStats";
import { useSessionStats } from "@/hooks/useSessionStats";

vi.mock("@/hooks/useSessionStats");

const mockStats = {
  selfiesTaken: 10,
  gifsExported: 5,
  camerasViewedTotal: 20,
  camerasThisSession: 3,
  ambientSeconds: 3700, // 1h 1m
  favoriteBorough: "Brooklyn",
  favoriteBoroughCount: 12,
};

describe("YourStats", () => {
  it("renders nothing when no stats are present", () => {
    vi.mocked(useSessionStats).mockReturnValue({
      selfiesTaken: 0,
      gifsExported: 0,
      camerasViewedTotal: 0,
      camerasThisSession: 0,
      ambientSeconds: 0,
      favoriteBorough: null,
      favoriteBoroughCount: 0,
    });

    const { container } = render(<YourStats />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders all stats when present", () => {
    vi.mocked(useSessionStats).mockReturnValue(mockStats);

    render(<YourStats />);

    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("explored")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("selfies")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("GIFs")).toBeInTheDocument();
    expect(screen.getByText("1h 1m")).toBeInTheDocument();
    expect(screen.getByText("ambient")).toBeInTheDocument();
    expect(screen.getByText("Brooklyn")).toBeInTheDocument();
    expect(screen.getByText("fav")).toBeInTheDocument();
  });

  it("formats time correctly for different durations", () => {
    vi.mocked(useSessionStats).mockReturnValue({
      ...mockStats,
      ambientSeconds: 45,
    });
    const { rerender } = render(<YourStats />);
    expect(screen.getByText("45s")).toBeInTheDocument();

    vi.mocked(useSessionStats).mockReturnValue({
      ...mockStats,
      ambientSeconds: 120,
    });
    rerender(<YourStats />);
    expect(screen.getByText("2m")).toBeInTheDocument();

    vi.mocked(useSessionStats).mockReturnValue({
      ...mockStats,
      ambientSeconds: 3600,
    });
    rerender(<YourStats />);
    expect(screen.getByText("1h")).toBeInTheDocument();
  });

  it("renders only cameras explored if only that is present", () => {
    vi.mocked(useSessionStats).mockReturnValue({
      selfiesTaken: 0,
      gifsExported: 0,
      camerasViewedTotal: 5,
      camerasThisSession: 0,
      ambientSeconds: 0,
      favoriteBorough: null,
      favoriteBoroughCount: 0,
    });
    render(<YourStats />);
    expect(screen.getByText("explored")).toBeInTheDocument();
    expect(screen.queryByText("selfies")).not.toBeInTheDocument();
  });

  it("renders empty state when no cameras viewed", () => {
    vi.mocked(useSessionStats).mockReturnValue({
      selfiesTaken: 0,
      gifsExported: 0,
      camerasViewedTotal: 0,
      camerasThisSession: 0,
      ambientSeconds: 0,
      favoriteBorough: null,
      favoriteBoroughCount: 0,
    });
    render(<YourStats />);
    expect(screen.queryByText("explored")).not.toBeInTheDocument();
  });
});
