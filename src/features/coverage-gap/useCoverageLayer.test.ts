import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { server } from "@/test/msw-handlers";
import { http, HttpResponse } from "msw";
import type { RefObject } from "react";
import type maplibregl from "maplibre-gl";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return Wrapper;
}

// Minimal map mock
function makeMockMap() {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  const sources: Record<string, unknown> = {};
  const layers: Record<string, unknown> = {};

  return {
    isStyleLoaded: vi.fn(() => true),
    getSource: vi.fn((id: string) => sources[id] ?? null),
    addSource: vi.fn((id: string, spec: unknown) => {
      sources[id] = { setData: vi.fn(), ...((spec as object) ?? {}) };
    }),
    getLayer: vi.fn((id: string) => layers[id] ?? null),
    addLayer: vi.fn((spec: { id: string }) => {
      layers[spec.id] = spec;
    }),
    removeLayer: vi.fn((id: string) => {
      delete layers[id];
    }),
    removeSource: vi.fn((id: string) => {
      delete sources[id];
    }),
    on: vi.fn((event: string, ...args: unknown[]) => {
      // Support both (event, layerId, handler) and (event, handler) signatures
      const handler = args[args.length - 1] as (...a: unknown[]) => void;
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    off: vi.fn(),
    getCanvas: vi.fn(() => ({ style: { cursor: "" } })),
    _listeners: listeners,
    _sources: sources,
    _layers: layers,
  };
}

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual };
});

describe("useCoverageLayer", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it("does not fetch until enabled is true", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const { default: useCoverageLayer } = await import("./useCoverageLayer");
    const mockMap = makeMockMap();
    const mapRef = { current: mockMap } as unknown as RefObject<maplibregl.Map | null>;

    renderHook(() => useCoverageLayer(mapRef), { wrapper: makeWrapper() });

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining("/api/coverage-gap"));
    fetchSpy.mockRestore();
  });

  it("fetches /api/coverage-gap when toggled on", async () => {
    server.use(
      http.get("/api/coverage-gap", () =>
        HttpResponse.json({ type: "FeatureCollection", features: [] })
      )
    );

    const { default: useCoverageLayer } = await import("./useCoverageLayer");
    const mockMap = makeMockMap();
    const mapRef = { current: mockMap } as unknown as RefObject<maplibregl.Map | null>;

    const { result } = renderHook(() => useCoverageLayer(mapRef), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.toggle();
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(result.current.enabled).toBe(true);
  });

  it("calls addSource and addLayer (x2) when data arrives", async () => {
    const emptyGeoJSON = { type: "FeatureCollection", features: [] };
    server.use(http.get("/api/coverage-gap", () => HttpResponse.json(emptyGeoJSON)));

    const { default: useCoverageLayer } = await import("./useCoverageLayer");
    const mockMap = makeMockMap();
    const mapRef = { current: mockMap } as unknown as RefObject<maplibregl.Map | null>;

    const { result } = renderHook(() => useCoverageLayer(mapRef), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.toggle();
    });

    await waitFor(
      () => {
        expect(mockMap.addSource).toHaveBeenCalledWith("coverage-gap", expect.anything());
        expect(mockMap.addLayer).toHaveBeenCalledTimes(2);
        const layerIds = mockMap.addLayer.mock.calls.map((call) => (call[0] as { id: string }).id);
        expect(layerIds).toContain("coverage-gap-fill");
        expect(layerIds).toContain("coverage-gap-border");
      },
      { timeout: 3000 }
    );
  });

  it("calls removeLayer (x2) and removeSource when toggled off", async () => {
    const emptyGeoJSON = { type: "FeatureCollection", features: [] };
    server.use(http.get("/api/coverage-gap", () => HttpResponse.json(emptyGeoJSON)));

    const { default: useCoverageLayer } = await import("./useCoverageLayer");
    const mockMap = makeMockMap();
    // Pre-populate layers/source so remove guards pass
    (mockMap._layers as Record<string, unknown>)["coverage-gap-fill"] = {};
    (mockMap._layers as Record<string, unknown>)["coverage-gap-border"] = {};
    (mockMap._sources as Record<string, unknown>)["coverage-gap"] = {};
    mockMap.getLayer.mockImplementation((id: string) => mockMap._layers[id] ?? null);
    mockMap.getSource.mockImplementation((id: string) => mockMap._sources[id] ?? null);

    const mapRef = { current: mockMap } as unknown as RefObject<maplibregl.Map | null>;

    const { result } = renderHook(() => useCoverageLayer(mapRef), { wrapper: makeWrapper() });

    // Toggle on then off
    await act(async () => {
      result.current.toggle();
      await new Promise((r) => setTimeout(r, 100));
    });
    await act(async () => {
      result.current.toggle();
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockMap.removeLayer).toHaveBeenCalledWith("coverage-gap-fill");
    expect(mockMap.removeLayer).toHaveBeenCalledWith("coverage-gap-border");
    expect(mockMap.removeSource).toHaveBeenCalledWith("coverage-gap");
  });

  it("listens for styledata while enabled to re-apply the layer", async () => {
    const emptyGeoJSON = { type: "FeatureCollection", features: [] };
    server.use(http.get("/api/coverage-gap", () => HttpResponse.json(emptyGeoJSON)));

    const { default: useCoverageLayer } = await import("./useCoverageLayer");
    const mockMap = makeMockMap();
    const mapRef = { current: mockMap } as unknown as RefObject<maplibregl.Map | null>;

    const { result } = renderHook(() => useCoverageLayer(mapRef), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.toggle();
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(mockMap.on).toHaveBeenCalledWith("style.load", expect.any(Function));
  });

  it("re-adds missing coverage layers when the map style is replaced", async () => {
    const emptyGeoJSON = { type: "FeatureCollection", features: [] };
    server.use(http.get("/api/coverage-gap", () => HttpResponse.json(emptyGeoJSON)));

    const { default: useCoverageLayer } = await import("./useCoverageLayer");
    const mockMap = makeMockMap();
    const mapRef = { current: mockMap } as unknown as RefObject<maplibregl.Map | null>;

    const { result } = renderHook(() => useCoverageLayer(mapRef), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.toggle();
    });

    await waitFor(() => {
      expect(mockMap.addSource).toHaveBeenCalledWith("coverage-gap", expect.anything());
    });

    mockMap.addLayer.mockClear();
    delete mockMap._layers["coverage-gap-fill"];
    delete mockMap._layers["coverage-gap-border"];
    mockMap._listeners["style.load"]?.forEach((handler) => handler());

    const layerIds = mockMap.addLayer.mock.calls.map((call) => (call[0] as { id: string }).id);
    expect(layerIds).toContain("coverage-gap-fill");
    expect(layerIds).toContain("coverage-gap-border");
  });
});
