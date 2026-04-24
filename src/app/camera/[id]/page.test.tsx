import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { notFound, mockFetchCameraContext, mockGetCameraLore } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockFetchCameraContext: vi.fn(),
  mockGetCameraLore: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : ""} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/context/lib/fetch-context", () => ({
  fetchCameraContext: mockFetchCameraContext,
}));

vi.mock("@/lib/cameras/lore", () => ({
  getCameraLore: mockGetCameraLore,
}));

vi.mock("./CameraDetailClient", () => ({
  CameraDetailClient: ({
    camera,
    displayName,
    showRawName,
  }: {
    camera: { id: string; name: string };
    displayName: string;
    showRawName: boolean;
  }) => (
    <div data-testid="camera-detail-client">
      <span>{camera.id}</span>
      <span>{displayName}</span>
      <span>{showRawName ? "show-raw-name" : "hide-raw-name"}</span>
    </div>
  ),
}));

vi.mock("@/features/camera-feed/CameraInfoCard", () => ({
  CameraInfoCard: ({ camera }: { camera: { id: string } }) => (
    <div data-testid="camera-info-card">
      <span>{camera.id}</span>
    </div>
  ),
}));

vi.mock("@/features/context/ContextPanel", () => ({
  ContextPanel: ({
    camera,
    context,
  }: {
    camera: { id: string; displayName: string };
    context: { weather: { description: string } | null };
  }) => (
    <div data-testid="context-panel">
      <span>{camera.id}</span>
      <span>{camera.displayName}</span>
      <span>{context.weather?.description ?? "no-weather"}</span>
    </div>
  ),
}));

import CameraDetailPage, { generateMetadata } from "./page";
import { CAMERAS } from "@/lib/cameras/data";
import { FEATURED_CAMERAS } from "@/features/context/lib/featured-cameras";

const featuredCamera = FEATURED_CAMERAS[1];
const middleFeaturedCamera = FEATURED_CAMERAS[2];
const nonFeaturedCamera = CAMERAS.find(
  (camera) => !FEATURED_CAMERAS.some((featured) => featured.id === camera.id)
);

if (!featuredCamera || !middleFeaturedCamera || !nonFeaturedCamera) {
  throw new Error("Camera fixtures unavailable");
}

describe("camera/[id] page", () => {
  beforeEach(() => {
    notFound.mockClear();
    mockFetchCameraContext.mockReset();
    mockFetchCameraContext.mockResolvedValue({
      weather: { temperature: 68, description: "Clear", isDaytime: true },
      events: [],
      transitAlerts: [],
      citibike: null,
      tides: null,
      buses: [],
    });
    mockGetCameraLore.mockReset();
    mockGetCameraLore.mockReturnValue([{ category: "history", fact: "A lore fact" }]);
  });

  it("returns camera metadata for a known camera and falls back on failures", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ id: featuredCamera.id }) })
    ).resolves.toEqual({
      title: `${featuredCamera.name} — nycgrid`,
      description: `Live feed from NYC traffic camera at ${featuredCamera.name}, ${featuredCamera.area}.`,
    });

    await expect(
      generateMetadata({ params: Promise.resolve({ id: "missing-camera" }) })
    ).resolves.toEqual({ title: "nycgrid" });

    await expect(
      generateMetadata({
        params: Promise.reject(new Error("bad params")) as Promise<{ id: string }>,
      })
    ).resolves.toEqual({ title: "nycgrid" });
  });

  it("renders a featured camera with context, preload, and adjacent featured navigation", async () => {
    render(await CameraDetailPage({ params: Promise.resolve({ id: middleFeaturedCamera.id }) }));

    expect(screen.getByTestId("camera-detail-client")).toHaveTextContent(middleFeaturedCamera.id);
    expect(screen.getByTestId("camera-detail-client")).toHaveTextContent(
      middleFeaturedCamera.displayName
    );
    expect(screen.getByTestId("camera-detail-client")).toHaveTextContent("show-raw-name");

    expect(mockGetCameraLore).not.toHaveBeenCalled();
    expect(mockFetchCameraContext).toHaveBeenCalledWith(middleFeaturedCamera);

    expect(screen.getByTestId("context-panel")).toHaveTextContent(middleFeaturedCamera.id);
    expect(screen.getByTestId("context-panel")).toHaveTextContent("Clear");

    expect(screen.getByRole("link", { name: /Prev/i })).toHaveAttribute(
      "href",
      `/camera/${FEATURED_CAMERAS[1].id}`
    );
    expect(screen.getByRole("link", { name: /Next/i })).toHaveAttribute(
      "href",
      `/camera/${FEATURED_CAMERAS[3].id}`
    );
    expect(
      screen.getByText(
        `${FEATURED_CAMERAS.findIndex((camera) => camera.id === middleFeaturedCamera.id) + 1} / ${FEATURED_CAMERAS.length}`
      )
    ).toBeInTheDocument();

    expect(
      document.head.querySelector(`link[href="/api/camera-image/${middleFeaturedCamera.id}"]`)
    ).not.toBeNull();
    expect(screen.getByTestId("camera-info-card")).toBeInTheDocument();
  });

  it("renders a non-featured camera with featured-context fallback and no featured fetch", async () => {
    render(await CameraDetailPage({ params: Promise.resolve({ id: nonFeaturedCamera.id }) }));

    expect(screen.getByTestId("camera-detail-client")).toHaveTextContent(nonFeaturedCamera.id);
    expect(screen.getByTestId("camera-detail-client")).toHaveTextContent(nonFeaturedCamera.name);
    expect(screen.getByTestId("camera-detail-client")).toHaveTextContent("hide-raw-name");

    expect(mockFetchCameraContext).not.toHaveBeenCalled();
    expect(screen.queryByTestId("context-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("camera-info-card")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Featured camera navigation" })
    ).not.toBeInTheDocument();
  });

  it("calls notFound for an unknown camera id", async () => {
    await expect(
      CameraDetailPage({ params: Promise.resolve({ id: "missing-camera" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
