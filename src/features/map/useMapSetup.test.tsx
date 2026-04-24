import { render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMapSetup } from "./useMapSetup";
import type { Camera } from "@/lib/cameras/types";

class MockMap {
  private canvas = { style: { cursor: "" } };
  private cameraSource:
    | {
        getClusterExpansionZoom: ReturnType<typeof vi.fn>;
        setData: ReturnType<typeof vi.fn>;
      }
    | undefined;
  public addControl = vi.fn();
  public addLayer = vi.fn();
  public addSource = vi.fn((id: string) => {
    if (id === "cameras") {
      this.cameraSource = {
        getClusterExpansionZoom: vi.fn().mockResolvedValue(13),
        setData: vi.fn(),
      };
    }
  });
  public easeTo = vi.fn();
  public flyTo = vi.fn();
  public getCanvas = vi.fn(() => this.canvas);
  public getLayer = vi.fn((id: string) =>
    ["clusters", "cluster-count", "unclustered-point", "unclustered-point-hit"].includes(id)
      ? { id }
      : undefined
  );
  public getSource = vi.fn((id: string) => (id === "cameras" ? this.cameraSource : undefined));
  public getStyle = vi.fn(() => ({
    layers: [
      { id: "roads", type: "symbol", layout: { "text-font": ["Arial Bold"] } },
      { id: "fills", type: "fill" },
      { id: "labels", type: "symbol", layout: { "text-font": ["Arial Regular"] } },
    ],
  }));
  public isStyleLoaded = vi.fn(() => true);
  public off = vi.fn();
  public on = vi.fn((event: string, layerOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof layerOrHandler === "function" ? layerOrHandler : maybeHandler;
    if (typeof handler === "function") {
      this.handlers.set(
        `${event}:${typeof layerOrHandler === "string" ? layerOrHandler : ""}`,
        handler as (...args: unknown[]) => void
      );
    }
    return this;
  });
  public once = vi.fn((event: string, handler: () => void) => {
    this.onceHandlers.set(event, handler);
    return this;
  });
  public queryRenderedFeatures = vi.fn(() => []);
  public remove = vi.fn();
  public setFilter = vi.fn();
  public setGlyphs = vi.fn();
  public setLayoutProperty = vi.fn();
  public setPaintProperty = vi.fn();
  public setStyle = vi.fn(() => {
    this.cameraSource = undefined;
  });
  public zoomIn = vi.fn();
  public zoomOut = vi.fn();
  private handlers = new Map<string, (...args: unknown[]) => void>();
  private onceHandlers = new Map<string, () => void>();

  trigger(event: string, layer = "", payload?: unknown) {
    this.handlers.get(`${event}:${layer}`)?.(payload);
  }

  triggerOnce(event: string) {
    this.onceHandlers.get(event)?.();
  }
}

const { mapInstances, MockAttributionControl } = vi.hoisted(() => ({
  mapInstances: [] as MockMap[],
  MockAttributionControl: class MockAttributionControl {},
}));

vi.mock("maplibre-gl", () => ({
  default: {
    Map: class {
      constructor() {
        const map = new MockMap();
        mapInstances.push(map);
        return map;
      }
    },
    AttributionControl: MockAttributionControl,
  },
}));

const cameras: Camera[] = [
  {
    id: "cam-1",
    name: "Brooklyn Bridge",
    latitude: 40.7,
    longitude: -73.99,
    area: "Brooklyn",
    isOnline: true,
    imageUrl: "https://example.com/cam-1.jpg",
  },
];

interface HarnessProps {
  accentColor: string;
  cameras: Camera[];
  isLight: boolean;
  onCameraSelect: (camera: Camera) => void;
  onReady: (controls: ReturnType<typeof useMapSetup>) => void;
}

function Harness({ accentColor, cameras, isLight, onCameraSelect, onReady }: HarnessProps) {
  const controls = useMapSetup({
    cameras,
    featuredIds: new Set(["cam-1"]),
    accentColor,
    isLight,
    onCameraSelect,
  });

  useEffect(() => {
    onReady(controls);
  }, [controls, onReady]);

  const { containerRef } = controls;
  return <div ref={containerRef} />;
}

describe("useMapSetup", () => {
  beforeEach(() => {
    mapInstances.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes the map, adds layers on load, and exposes map controls", () => {
    const onCameraSelect = vi.fn();
    const onReady = vi.fn();
    const { unmount } = render(
      <Harness
        accentColor="#ffde00"
        cameras={cameras}
        isLight={false}
        onCameraSelect={onCameraSelect}
        onReady={onReady}
      />
    );

    const map = mapInstances.at(-1);
    expect(map).toBeDefined();
    if (!map) throw new Error("Expected a map instance");

    map.triggerOnce("styledata");
    map.trigger("load");

    expect(map.addControl).toHaveBeenCalled();
    expect(map.setGlyphs).toHaveBeenCalledWith(
      "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf"
    );
    expect(map.addSource).toHaveBeenCalledWith(
      "cameras",
      expect.objectContaining({ type: "geojson", cluster: true })
    );
    expect(map.addLayer).toHaveBeenCalledTimes(4);
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cluster-count",
        paint: expect.objectContaining({ "text-color": "#0a0a0a" }),
      })
    );

    const controls = onReady.mock.calls.at(-1)?.[0] as ReturnType<typeof useMapSetup>;

    controls.flyTo([-73.98, 40.71], 16);
    controls.zoomIn();
    controls.zoomOut();
    controls.filterByBorough("Brooklyn");
    controls.filterByBorough(null);

    expect(map.flyTo).toHaveBeenCalledWith({
      center: [-73.98, 40.71],
      zoom: 16,
      duration: 1200,
    });
    expect(map.easeTo).not.toHaveBeenCalled();
    expect(map.setFilter).toHaveBeenCalled();

    unmount();
    expect(map.remove).toHaveBeenCalled();
  });

  it("updates source data, paint properties, and map style when inputs change", () => {
    const onCameraSelect = vi.fn();
    const onReady = vi.fn();
    const { rerender } = render(
      <Harness
        accentColor="#ffde00"
        cameras={cameras}
        isLight={false}
        onCameraSelect={onCameraSelect}
        onReady={onReady}
      />
    );

    const map = mapInstances.at(-1);
    if (!map) throw new Error("Expected a map instance");

    map.trigger("load");

    const nextCameras = [{ ...cameras[0], name: "Updated Camera" }];
    rerender(
      <Harness
        accentColor="#00ffee"
        cameras={nextCameras}
        isLight={false}
        onCameraSelect={onCameraSelect}
        onReady={onReady}
      />
    );

    expect(map.getSource("cameras")?.setData).toHaveBeenCalled();
    expect(map.setPaintProperty).toHaveBeenCalledWith("clusters", "circle-color", "#00ffee");
    expect(map.setPaintProperty).toHaveBeenCalledWith("cluster-count", "text-color", "#0a0a0a");
    expect(map.setPaintProperty).toHaveBeenCalledWith("unclustered-point", "circle-color", [
      "case",
      ["==", ["get", "isOnline"], true],
      "#00ffee",
      "#555555",
    ]);

    rerender(
      <Harness
        accentColor="#00ffee"
        cameras={nextCameras}
        isLight
        onCameraSelect={onCameraSelect}
        onReady={onReady}
      />
    );
    expect(map.setStyle).toHaveBeenCalledWith(
      "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    );

    map.triggerOnce("style.load");
    expect(map.addLayer).toHaveBeenCalled();
  });

  it("updates cluster label contrast when the accent hydrates to light mode black", () => {
    const { rerender } = render(
      <Harness
        accentColor="#ffde00"
        cameras={cameras}
        isLight={false}
        onCameraSelect={() => {}}
        onReady={() => {}}
      />
    );

    const map = mapInstances.at(-1);
    if (!map) throw new Error("Expected a map instance");

    map.trigger("load");
    map.setPaintProperty.mockClear();

    rerender(
      <Harness
        accentColor="#0a0a0a"
        cameras={cameras}
        isLight={false}
        onCameraSelect={() => {}}
        onReady={() => {}}
      />
    );

    expect(map.setPaintProperty).toHaveBeenCalledWith("clusters", "circle-color", "#0a0a0a");
    expect(map.setPaintProperty).toHaveBeenCalledWith("clusters", "circle-stroke-color", "#ffffff");
    expect(map.setPaintProperty).toHaveBeenCalledWith("cluster-count", "text-color", "#ffffff");
  });

  it("uses contrasting cluster label paint in light mode", () => {
    render(
      <Harness
        accentColor="#0a0a0a"
        cameras={cameras}
        isLight
        onCameraSelect={() => {}}
        onReady={() => {}}
      />
    );

    const map = mapInstances.at(-1);
    if (!map) throw new Error("Expected a map instance");

    map.trigger("load");

    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cluster-count",
        paint: expect.objectContaining({ "text-color": "#ffffff" }),
      })
    );
  });

  it("binds cluster and camera click handlers", async () => {
    const onCameraSelect = vi.fn();
    render(
      <Harness
        accentColor="#ffde00"
        cameras={cameras}
        isLight={false}
        onCameraSelect={onCameraSelect}
        onReady={() => {}}
      />
    );

    const map = mapInstances.at(-1);
    if (!map) throw new Error("Expected a map instance");

    map.queryRenderedFeatures.mockReturnValue([
      {
        properties: { cluster_id: 99 },
        geometry: { coordinates: [-73.99, 40.7] },
      },
    ] as unknown as ReturnType<MockMap["queryRenderedFeatures"]>);

    map.trigger("load");
    map.trigger("click", "clusters", { point: { x: 0, y: 0 } });
    await Promise.resolve();

    expect(map.getSource("cameras")?.getClusterExpansionZoom).toHaveBeenCalledWith(99);
    expect(map.easeTo).toHaveBeenCalledWith({ center: [-73.99, 40.7], zoom: 13 });

    map.trigger("click", "unclustered-point-hit", {
      features: [{ properties: { id: "cam-1" } }],
    });

    expect(onCameraSelect).toHaveBeenCalledWith(cameras[0]);

    map.trigger("mouseenter", "clusters");
    expect(map.getCanvas().style.cursor).toBe("pointer");
    map.trigger("mouseleave", "clusters");
    expect(map.getCanvas().style.cursor).toBe("");
  });
});
