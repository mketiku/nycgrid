import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PersistentMap } from "./PersistentMap";

// Control pathname and searchParams from within tests
const mockUsePathname = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

// MapView is expensive (WebGL, MapLibre). Swap it for a lightweight stub.
vi.mock("@/features/map/MapView", () => ({
  MapView: () => <div data-testid="map-view" />,
}));

// Static camera data — not relevant to PersistentMap behaviour.
vi.mock("@/lib/cameras/data", () => ({
  CAMERAS: [],
}));

// TanStack Query is pulled in transitively; silence it.
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: undefined }),
}));

describe("PersistentMap", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/collections");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does NOT render MapView when first mounted on a non-explore path", () => {
    mockUsePathname.mockReturnValue("/collections");

    render(<PersistentMap />);

    expect(screen.queryByTestId("map-view")).not.toBeInTheDocument();
  });

  it("DOES render MapView after pathname changes to /explore", () => {
    mockUsePathname.mockReturnValue("/collections");
    const { rerender } = render(<PersistentMap />);

    expect(screen.queryByTestId("map-view")).not.toBeInTheDocument();

    // Simulate navigation to /explore
    mockUsePathname.mockReturnValue("/explore");
    act(() => {
      rerender(<PersistentMap />);
    });

    expect(screen.getByTestId("map-view")).toBeInTheDocument();
  });

  it("renders MapView wrapper with opacity-0 and pointer-events-none when NOT on /explore", () => {
    // Start on explore so MapView mounts
    mockUsePathname.mockReturnValue("/explore");
    const { rerender } = render(<PersistentMap />);

    // Navigate away
    mockUsePathname.mockReturnValue("/collections");
    act(() => {
      rerender(<PersistentMap />);
    });

    // MapView is still in the DOM (persistent) but its wrapper hides it
    const mapView = screen.getByTestId("map-view");
    const wrapper = mapView.parentElement!;
    expect(wrapper.className).toContain("opacity-0");
    expect(wrapper.className).toContain("pointer-events-none");
  });

  it("does NOT have opacity-0/pointer-events-none classes when on /explore", () => {
    mockUsePathname.mockReturnValue("/explore");

    render(<PersistentMap />);

    const mapView = screen.getByTestId("map-view");
    const wrapper = mapView.parentElement!;
    expect(wrapper.className).not.toContain("opacity-0");
    expect(wrapper.className).not.toContain("pointer-events-none");
  });
});
