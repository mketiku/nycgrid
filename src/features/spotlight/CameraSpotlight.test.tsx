import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFeaturedCameras, mockFetchCameraContext, mockComputeScore } = vi.hoisted(() => ({
  mockFeaturedCameras: [] as Array<{
    id: string;
    displayName: string;
    area: string;
    latitude: number;
    longitude: number;
    tags: string[];
    isOnline: boolean;
    lore?: string;
  }>,
  mockFetchCameraContext: vi.fn(),
  mockComputeScore: vi.fn(),
}));

vi.mock("@/features/context/lib/featured-cameras", () => ({
  FEATURED_CAMERAS: mockFeaturedCameras,
}));

vi.mock("@/features/context/lib/fetch-context", () => ({
  fetchCameraContext: mockFetchCameraContext,
}));

vi.mock("@/features/context/lib/score", () => ({
  computeScore: mockComputeScore,
}));

import { CameraSpotlight, CameraSpotlightSkeleton } from "./CameraSpotlight";

describe("CameraSpotlight", () => {
  beforeEach(() => {
    mockFeaturedCameras.length = 0;

    mockFetchCameraContext.mockReset();
    mockFetchCameraContext.mockResolvedValue({
      weather: null,
      events: [],
      transitAlerts: [],
      citibike: null,
      tides: null,
      buses: [],
    });

    mockComputeScore.mockReset();
    mockComputeScore.mockReturnValue(100);
  });

  it("renders the live nyc grid, weather, and Save GIF CTA for the spotlight", async () => {
    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(0);

    mockFeaturedCameras.push({
      id: "cam-1",
      displayName: "Brooklyn Bridge",
      area: "Manhattan",
      latitude: 40.7061,
      longitude: -73.9969,
      tags: ["park"],
      isOnline: true,
      lore: "A skyline-heavy downtown crossing.",
    });
    mockFeaturedCameras.push({
      id: "cam-2",
      displayName: "Queensboro Bridge",
      area: "Queens",
      latitude: 40.7577,
      longitude: -73.9542,
      tags: ["park"],
      isOnline: true,
      lore: "A river crossing with a second skyline angle.",
    });

    mockFetchCameraContext.mockResolvedValue({
      weather: {
        temperature: 63,
        description: "Clear",
      },
      events: [],
      transitAlerts: [],
      citibike: null,
      tides: null,
      buses: [],
    });

    const element = await CameraSpotlight();

    render(element);

    expect(screen.getByRole("heading", { name: "Brooklyn Bridge" })).toBeInTheDocument();
    expect(screen.getByText("63°F · Clear")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Live view of Brooklyn Bridge" })).toHaveAttribute(
      "src",
      "/api/camera-image/cam-1"
    );
    expect(screen.getByRole("link", { name: /^View$/i })).toHaveAttribute("href", "/camera/cam-1");
    expect(screen.getByRole("link", { name: /save gif/i })).toHaveAttribute(
      "href",
      "/camera/cam-1"
    );
    expect(screen.getByRole("link", { name: /show me .* instead/i })).toHaveTextContent(
      /another view/i
    );

    dateNowSpy.mockRestore();
  });

  it("shows event badge when venueEvent is present", async () => {
    mockFeaturedCameras.push({
      id: "cam-msg",
      displayName: "Madison Square Garden",
      area: "Midtown",
      latitude: 40.7505,
      longitude: -73.9934,
      tags: ["venue"],
      isOnline: true,
      lore: "The world's most famous arena.",
    });

    vi.mocked(mockFetchCameraContext).mockResolvedValue({
      weather: null,
      events: [],
      transitAlerts: [],
      citibike: null,
      tides: null,
      buses: [],
      venueEvent: {
        venueId: "msg",
        venueName: "Madison Square Garden",
        eventName: "Knicks vs Celtics",
        category: "sports",
        startIso: "2024-06-15T23:30:00Z",
        endIso: "2024-06-16T03:00:00Z",
        phase: "arrival",
        emoji: "🏀",
        url: null,
      },
    });

    const { container } = render(await CameraSpotlight());
    expect(container.textContent).toContain("Knicks vs Celtics");
    expect(container.textContent).toContain("Starting soon");
  });

  it("returns null when there are no eligible cameras", async () => {
    mockFeaturedCameras.push(
      {
        id: "offline-cam",
        displayName: "Offline Cam",
        area: "Queens",
        latitude: 40.7,
        longitude: -73.8,
        tags: ["commute"],
        isOnline: false,
        lore: "Unavailable right now.",
      },
      {
        id: "no-lore-cam",
        displayName: "No Lore Cam",
        area: "Bronx",
        latitude: 40.8,
        longitude: -73.9,
        tags: ["commute"],
        isOnline: true,
      }
    );

    await expect(CameraSpotlight()).resolves.toBeNull();
    expect(mockFetchCameraContext).not.toHaveBeenCalled();
  });
});

describe("CameraSpotlightSkeleton", () => {
  it("renders the loading skeleton", () => {
    const { container } = render(<CameraSpotlightSkeleton />);

    expect(screen.getByLabelText("Loading spotlight")).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
