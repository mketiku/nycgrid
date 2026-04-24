import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFeaturedCameras,
  mockFetchCameraContext,
  mockComputeScore,
  mockIsVisitable,
  mockGoogleDirectionsUrl,
} = vi.hoisted(() => ({
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
  mockIsVisitable: vi.fn(),
  mockGoogleDirectionsUrl: vi.fn(),
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

vi.mock("@/features/context/lib/maps", () => ({
  isVisitable: mockIsVisitable,
  googleDirectionsUrl: mockGoogleDirectionsUrl,
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

    mockIsVisitable.mockReset();
    mockIsVisitable.mockReturnValue(false);

    mockGoogleDirectionsUrl.mockReset();
    mockGoogleDirectionsUrl.mockReturnValue("https://maps.test/directions");
  });

  it("renders the live nyc grid, weather, and visit CTA for a visitable spotlight", async () => {
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
    mockIsVisitable.mockReturnValue(true);
    mockGoogleDirectionsUrl.mockReturnValue("https://maps.test/brooklyn-bridge");

    const element = await CameraSpotlight();

    render(element);

    expect(screen.getByRole("heading", { name: "Brooklyn Bridge" })).toBeInTheDocument();
    expect(screen.getByText("63°F · Clear")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Live view of Brooklyn Bridge" })).toHaveAttribute(
      "src",
      "/api/camera-image/cam-1"
    );
    expect(screen.getByRole("link", { name: /View live feed/i })).toHaveAttribute(
      "href",
      "/camera/cam-1"
    );
    expect(
      screen.getByRole("link", { name: "Get transit directions to Brooklyn Bridge" })
    ).toHaveAttribute("href", "https://maps.test/brooklyn-bridge");
    expect(screen.getByRole("link", { name: /show me .* instead/i })).toHaveTextContent(
      /another view/i
    );
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
