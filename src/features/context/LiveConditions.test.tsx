import { render, screen } from "@testing-library/react";
import { LiveConditions } from "./LiveConditions";
import { describe, it, expect, vi } from "vitest";

vi.mock("./lib/fetch-context", () => ({
  fetchCameraContext: vi.fn(async () => ({
    weather: null,
    events: [],
    transitAlerts: [],
    citibike: null,
    tides: null,
    buses: [],
  })),
}));

describe("LiveConditions", () => {
  it("renders the conditions list with featured cameras", async () => {
    // Await the Server Component
    const element = await LiveConditions();
    render(element);

    expect(screen.getByText(/What's Happening Now/i)).toBeDefined();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
  });

  it("links to the explore page", async () => {
    const element = await LiveConditions();
    render(element);

    const exploreLink = screen.getByText(/All cameras/i);
    expect(exploreLink.getAttribute("href")).toBe("/explore");
  });
});
