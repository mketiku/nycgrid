import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { CameraBrowsePanel, MapView } from "./MapView";

const replace = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
  usePathname: () => "/explore",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : ""} {...props}>
      {children}
    </a>
  ),
}));
import type { Camera } from "@/lib/cameras/types";

const flyTo = vi.fn();
const zoomIn = vi.fn();
const zoomOut = vi.fn();
const filterByBorough = vi.fn();
const findNearestCamera = vi.fn();
const mockCameraPanel = vi.fn();
const toggleFavourite = vi.fn();
const addManyFavourites = vi.fn();
let mockFavourites = new Set<string>(["cam-1"]);

vi.mock("./useMapSetup", () => ({
  useMapSetup: vi.fn(() => ({
    containerRef: { current: null },
    mapRef: { current: null },
    flyTo,
    zoomIn,
    zoomOut,
    filterByBorough,
  })),
}));

vi.mock("@/features/coverage-gap", () => ({
  CoverageToggle: () => null,
  useCoverageLayer: vi.fn(() => ({ enabled: false, toggle: vi.fn() })),
}));

vi.mock("./CameraPanel", () => ({
  CameraPanel: ({ camera }: { camera: Camera | null }) => {
    mockCameraPanel(camera);
    return camera ? <div data-testid="selected-camera">{camera.name}</div> : null;
  },
}));

vi.mock("@/features/theme/useThemeStore", () => ({
  THEME_ACCENTS: { street: "#ffde00", light: "#ffde00" },
  useThemeStore: () => ({ theme: "street" }),
}));

vi.mock("@/features/theme/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock("@/features/context/lib/featured-cameras", () => ({
  FEATURED_CAMERAS: [{ id: "cam-1" }],
}));

vi.mock("@/features/stats/YourStats", () => ({
  YourStats: () => <section aria-label="Your stats">Your grid</section>,
}));

vi.mock("@/hooks/useFavourites", () => ({
  useFavourites: () => ({
    favourites: mockFavourites,
    toggle: toggleFavourite,
    isFavourite: (id: string) => mockFavourites.has(id),
    addMany: addManyFavourites,
  }),
}));

vi.mock("@/lib/cameras/geo", () => ({
  findNearestCamera: (...args: [number, number, Camera[]]) => findNearestCamera(...args),
}));

const originalNavigator = globalThis.navigator;

const cameras: Camera[] = [
  {
    id: "cam-1",
    name: "Brooklyn Bridge",
    latitude: 40.7,
    longitude: -73.9,
    area: "Brooklyn",
    isOnline: true,
    imageUrl: "https://example.com/cam-1.jpg",
  },
  {
    id: "cam-2",
    name: "Queens Blvd",
    latitude: 40.7,
    longitude: -73.8,
    area: "Queens",
    isOnline: true,
    imageUrl: "https://example.com/cam-2.jpg",
  },
  {
    id: "cam-3",
    name: "Lincoln Tunnel",
    latitude: 40.76,
    longitude: -74.01,
    area: "Manhattan",
    isOnline: false,
    imageUrl: "https://example.com/cam-3.jpg",
  },
];

const manyCameras: Camera[] = [
  ...cameras,
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `cam-extra-${index + 1}`,
    name: `Extra Camera ${index + 1}`,
    latitude: 40.72 + index * 0.001,
    longitude: -73.85 - index * 0.001,
    area: (index % 2 === 0 ? "Brooklyn" : "Queens") as Camera["area"],
    isOnline: true,
    imageUrl: `https://example.com/cam-extra-${index + 1}.jpg`,
  })),
];

function setNavigatorValue(value: Navigator) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value,
  });
}

function createGeolocationMock(
  getCurrentPosition: PositionCallback extends never
    ? never
    : (
        success: PositionCallback,
        error?: PositionErrorCallback | null,
        options?: PositionOptions
      ) => void
): Geolocation {
  return {
    getCurrentPosition,
    watchPosition: vi.fn(() => 1),
    clearWatch: vi.fn(),
  } as unknown as Geolocation;
}

function CameraBrowsePanelHarness({
  allCameras = cameras,
  initialMobileOpen = false,
  isDesktopInline = true,
}: {
  allCameras?: Camera[];
  initialMobileOpen?: boolean;
  isDesktopInline?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(initialMobileOpen);
  const filteredCameras = allCameras.filter((camera) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return `${camera.name} ${camera.area} ${camera.id}`.toLowerCase().includes(normalizedQuery);
  });
  const starredCameras = filteredCameras.filter((camera) => mockFavourites.has(camera.id));

  return (
    <div>
      {!isDesktopInline ? (
        <button type="button" onClick={() => setMobileOpen(true)}>
          Reopen mobile browser
        </button>
      ) : null}
      <CameraBrowsePanel
        cameras={filteredCameras}
        starredCameras={starredCameras}
        selectedCameraId={null}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onQueryChange={setQuery}
        onSelectCamera={() => {}}
        onSurpriseMe={() => {}}
        query={query}
        selectedType="all"
        onTypeChange={() => {}}
        isDesktopInline={isDesktopInline}
        favourites={mockFavourites}
        onToggleFavourite={toggleFavourite}
        onAddManyFavourites={addManyFavourites}
      />
    </div>
  );
}

describe("MapView", () => {
  beforeEach(() => {
    replace.mockReset();
    push.mockReset();
    flyTo.mockReset();
    zoomIn.mockReset();
    zoomOut.mockReset();
    filterByBorough.mockReset();
    findNearestCamera.mockReset();
    mockCameraPanel.mockReset();
    toggleFavourite.mockReset();
    addManyFavourites.mockReset();
    mockFavourites = new Set<string>(["cam-1"]);
    setNavigatorValue(originalNavigator);
  });

  afterEach(() => {
    setNavigatorValue(originalNavigator);
    vi.restoreAllMocks();
  });

  it("renders map controls, supports filtering, and selects cameras from the browser", () => {
    render(<MapView cameras={cameras} />);
    const desktopPanel = within(screen.getAllByRole("region", { name: /browse cameras/i })[0]);

    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    expect(screen.getAllByText("Brooklyn Bridge")).not.toHaveLength(0);
    expect(screen.getAllByText("Starred")).not.toHaveLength(0);
    expect(desktopPanel.getByRole("region", { name: /your stats/i })).toHaveTextContent(
      "Your grid"
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Zoom in" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Zoom out" })[0]);

    expect(zoomIn).toHaveBeenCalled();
    expect(zoomOut).toHaveBeenCalled();

    fireEvent.change(desktopPanel.getByLabelText(/search cameras/i), {
      target: { value: "queens" },
    });

    expect(desktopPanel.getAllByText("Queens Blvd")).not.toHaveLength(0);
    expect(desktopPanel.queryAllByText("Lincoln Tunnel")).toHaveLength(0);

    // Clear search before testing the type filter so all cameras are in scope
    fireEvent.change(desktopPanel.getByLabelText(/search cameras/i), {
      target: { value: "" },
    });

    fireEvent.click(desktopPanel.getByRole("button", { name: "Bridge" }));
    expect(desktopPanel.getAllByText("Brooklyn Bridge")).not.toHaveLength(0);
    expect(desktopPanel.queryAllByText("Queens Blvd")).toHaveLength(0);

    const boroughGroup = within(
      screen.getAllByRole("group", { name: /filter by borough/i }).at(-1)!
    );

    fireEvent.click(boroughGroup.getByRole("button", { name: "Brooklyn" }));
    expect(filterByBorough).toHaveBeenCalledWith("Brooklyn");
    expect(flyTo).toHaveBeenCalledWith([-73.9442, 40.6782], 12);

    // ARIA live region announces filter change to screen readers
    const liveRegion = screen.getByTestId("borough-filter-announcement");
    expect(liveRegion).toHaveAttribute("role", "status");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion.textContent).toMatch(/Showing \d+ camera.* in Brooklyn/);

    fireEvent.click(boroughGroup.getByRole("button", { name: "Brooklyn" }));
    expect(filterByBorough).toHaveBeenLastCalledWith(null);
    expect(liveRegion.textContent).toMatch(/Showing all \d+ cameras/);

    fireEvent.click(screen.getAllByRole("button", { name: /brooklyn bridge brooklyn/i })[0]);

    expect(flyTo).toHaveBeenCalledWith([-73.9, 40.7], 15);
    expect(screen.getByTestId("selected-camera")).toHaveTextContent("Brooklyn Bridge");
  });

  it("finds the nearest camera, handles unavailable location, and resets error state on mouse leave", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({
        coords: {
          latitude: 40.71,
          longitude: -73.95,
        },
      } as GeolocationPosition)
    );
    const permissions = {
      query: vi.fn().mockResolvedValue({ state: "granted" }),
    };

    setNavigatorValue({
      ...originalNavigator,
      geolocation: createGeolocationMock(getCurrentPosition),
      permissions: permissions as Permissions,
    } as Navigator);
    findNearestCamera.mockReturnValue(cameras[1]);

    render(<MapView cameras={cameras} />);

    fireEvent.click(screen.getAllByRole("button", { name: /find nearest camera/i })[0]);

    await waitFor(() => {
      expect(findNearestCamera).toHaveBeenCalledWith(40.71, -73.95, cameras);
    });
    expect(flyTo).toHaveBeenCalledWith([-73.8, 40.7]);
    expect(screen.getByTestId("selected-camera")).toHaveTextContent("Queens Blvd");

    setNavigatorValue({
      ...originalNavigator,
      permissions: {
        query: vi.fn().mockResolvedValue({ state: "denied" }),
      } as Permissions,
    } as Navigator);

    fireEvent.click(screen.getAllByRole("button", { name: /find nearest camera/i })[0]);

    const errorButton = screen.getAllByRole("button", {
      name: /location unavailable/i,
    })[0];
    expect(errorButton).toBeInTheDocument();

    fireEvent.mouseLeave(errorButton);

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /find nearest camera/i })[0]
      ).toBeInTheDocument();
    });
  });

  it("shows an error when geolocation is missing or no nearest camera is found", async () => {
    setNavigatorValue({
      ...originalNavigator,
      geolocation: undefined,
      permissions: undefined,
    } as unknown as Navigator);

    const { rerender } = render(<MapView cameras={cameras} />);

    fireEvent.click(screen.getAllByRole("button", { name: /find nearest camera/i })[0]);
    expect(screen.getAllByRole("button", { name: /location unavailable/i })[0]).toBeInTheDocument();

    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({
        coords: {
          latitude: 40.71,
          longitude: -73.95,
        },
      } as GeolocationPosition)
    );

    setNavigatorValue({
      ...originalNavigator,
      geolocation: createGeolocationMock(getCurrentPosition),
      permissions: {
        query: vi.fn().mockResolvedValue({ state: "granted" }),
      } as Permissions,
    } as Navigator);
    findNearestCamera.mockReturnValue(null);

    rerender(<MapView cameras={cameras} />);

    fireEvent.click(screen.getAllByRole("button", { name: /location unavailable/i })[0]);

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /location unavailable/i })[0]
      ).toBeInTheDocument();
    });
  });

  it("uses only online cameras for surprise me and ignores the action when none are online", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99);

    const { rerender } = render(<MapView cameras={cameras} />);

    fireEvent.click(screen.getAllByRole("button", { name: /surprise me/i })[0]);

    expect(flyTo).toHaveBeenCalledWith([-73.8, 40.7], 15);
    expect(screen.getByTestId("selected-camera")).toHaveTextContent("Queens Blvd");

    flyTo.mockClear();
    rerender(<MapView cameras={cameras.map((camera) => ({ ...camera, isOnline: false }))} />);

    fireEvent.click(screen.getAllByRole("button", { name: /surprise me/i })[0]);

    expect(flyTo).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });
});

describe("CameraBrowsePanel", () => {
  it("shows the selected camera state and keeps surprise visible on desktop", () => {
    render(
      <CameraBrowsePanel
        cameras={cameras}
        starredCameras={[cameras[0]]}
        selectedCameraId="cam-1"
        isMobileOpen={false}
        onCloseMobile={() => {}}
        onQueryChange={() => {}}
        onSelectCamera={() => {}}
        onSurpriseMe={() => {}}
        query=""
        selectedType="all"
        onTypeChange={() => {}}
        isDesktopInline
        favourites={mockFavourites}
        onToggleFavourite={toggleFavourite}
        onAddManyFavourites={addManyFavourites}
      />
    );

    expect(screen.getByRole("button", { name: /surprise me/i })).toBeDefined();
    expect(screen.getAllByText("Selected")).not.toHaveLength(0);
    expect(screen.getByText("All cameras")).toBeInTheDocument();
  });

  it("renders the mobile overlay, supports closing, filtering, and empty states", () => {
    const onCloseMobile = vi.fn();
    const onQueryChange = vi.fn();
    const onSelectCamera = vi.fn();
    const onSurpriseMe = vi.fn();
    const onBoroughSelect = vi.fn();

    render(
      <CameraBrowsePanel
        cameras={[]}
        starredCameras={[]}
        selectedCameraId={null}
        isMobileOpen
        onCloseMobile={onCloseMobile}
        onQueryChange={onQueryChange}
        onSelectCamera={onSelectCamera}
        onSurpriseMe={onSurpriseMe}
        query="brooklyn"
        selectedType="all"
        onTypeChange={() => {}}
        selectedBorough="Queens"
        onBoroughSelect={onBoroughSelect}
        favourites={mockFavourites}
        onToggleFavourite={toggleFavourite}
        onAddManyFavourites={addManyFavourites}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: /close camera browser/i })[0]);
    expect(onCloseMobile).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/search cameras/i), {
      target: { value: "queens" },
    });
    expect(onQueryChange).toHaveBeenCalledWith("queens");

    fireEvent.click(screen.getByRole("button", { name: "Tunnel" }));
    fireEvent.click(screen.getByRole("button", { name: "The Bronx" }));
    fireEvent.click(screen.getByRole("button", { name: /surprise me/i }));

    expect(onBoroughSelect).toHaveBeenCalledWith("Bronx");
    expect(onSurpriseMe).toHaveBeenCalled();
    expect(screen.getByText("No cameras match that search yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /browse cameras/i })).toBeNull();
  });

  it("supports keyboard navigation for type and borough pills", () => {
    const cameras: Camera[] = [
      {
        id: "1",
        name: "Cam 1",
        latitude: 40,
        longitude: -74,
        area: "Manhattan",
        isOnline: true,
        imageUrl: "",
      },
      {
        id: "2",
        name: "Cam 2",
        latitude: 40,
        longitude: -74,
        area: "Brooklyn",
        isOnline: true,
        imageUrl: "",
      },
    ];
    render(<MapView cameras={cameras} />);
    // On desktop, pills are visible
    const typePill = screen.getAllByRole("button", { name: "All" })[0];
    fireEvent.keyDown(typePill, { key: "ArrowRight" });
    fireEvent.keyDown(typePill, { key: "ArrowLeft" });

    // Borough pills are visible at bottom center on desktop
    const boroughPills = screen.getAllByRole("button", {
      name: /Manhattan|Brooklyn|Queens|Bronx|Staten Island/,
    });
    fireEvent.keyDown(boroughPills[0], { key: "ArrowRight" });
    fireEvent.keyDown(boroughPills[0], { key: "ArrowLeft" });
  });

  it("supports temporary select mode with checkbox semantics, bulk actions, and search persistence", () => {
    render(<CameraBrowsePanelHarness allCameras={manyCameras} />);

    fireEvent.click(screen.getByRole("button", { name: "Enter select mode" }));

    const brooklynCheckbox = screen.getAllByRole("checkbox", {
      name: "Select Brooklyn Bridge",
    })[0];
    const queensCheckbox = screen.getAllByRole("checkbox", { name: "Select Queens Blvd" })[0];

    fireEvent.click(brooklynCheckbox);
    fireEvent.click(queensCheckbox);

    expect(screen.getAllByText("2 selected")).not.toHaveLength(0);
    expect(brooklynCheckbox).toHaveAttribute("aria-checked", "true");
    expect(queensCheckbox).toHaveAttribute("aria-checked", "true");

    fireEvent.click(screen.getAllByRole("button", { name: "Add Queens Blvd to favourites" })[0]);
    expect(toggleFavourite).toHaveBeenCalledWith("cam-2");

    fireEvent.change(screen.getByLabelText(/search cameras/i), {
      target: { value: "queens" },
    });

    expect(screen.getAllByText("2 selected")).not.toHaveLength(0);
    expect(screen.queryByText("Brooklyn Bridge")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/search cameras/i), {
      target: { value: "" },
    });

    expect(screen.getAllByRole("checkbox", { name: "Select Brooklyn Bridge" })[0]).toHaveAttribute(
      "aria-checked",
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: "Favourite selected" }));
    expect(addManyFavourites).toHaveBeenCalledWith(["cam-1", "cam-2"]);

    fireEvent.click(screen.getByRole("button", { name: "Build collection" }));
    expect(push).toHaveBeenCalledWith("/collections/build?c=cam-1%2Ccam-2");

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getAllByText("0 selected")).not.toHaveLength(0);
  });

  it("enforces the collection cap with clear copy", () => {
    mockFavourites = new Set<string>();
    render(<CameraBrowsePanelHarness allCameras={manyCameras} />);

    fireEvent.click(screen.getByRole("button", { name: "Enter select mode" }));

    const checkboxes = screen.getAllByRole("checkbox", { name: /select /i });
    checkboxes.slice(0, 9).forEach((checkbox) => {
      fireEvent.click(checkbox);
    });

    expect(screen.getAllByText("9 selected")).not.toHaveLength(0);
    expect(
      screen.getByText(
        "Selection full. Collections are capped at 9 cameras. Clear one to add another."
      )
    ).toBeInTheDocument();

    fireEvent.click(checkboxes[9]);

    expect(checkboxes[9]).toHaveAttribute("aria-checked", "false");
    expect(screen.getAllByText("9 selected")).not.toHaveLength(0);
  });

  it("clears temporary selection on escape, done, and mobile drawer close", () => {
    render(
      <CameraBrowsePanelHarness allCameras={cameras} initialMobileOpen isDesktopInline={false} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Enter select mode" }));
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select Brooklyn Bridge" })[0]);

    expect(screen.getAllByText("1 selected")).not.toHaveLength(0);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter select mode" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enter select mode" }));
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select Brooklyn Bridge" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Exit select mode" }));

    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enter select mode" }));
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select Brooklyn Bridge" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /close camera browser/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Reopen mobile browser" }));

    expect(screen.getByRole("button", { name: "Enter select mode" })).toBeInTheDocument();
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  });
});
