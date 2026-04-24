import { render, screen } from "@testing-library/react";
import ExplorePage from "./page";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/map/MapView", () => ({
  MapView: () => <div data-testid="map-view" />,
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

describe("ExplorePage", () => {
  it("renders the map view", async () => {
    const searchParams = Promise.resolve({});
    render(await ExplorePage({ searchParams }));
    expect(screen.getByTestId("map-view")).toBeDefined();
  });
});
