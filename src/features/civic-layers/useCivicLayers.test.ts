import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode, type RefObject } from "react";
import type * as maplibregl from "maplibre-gl";
import { useCivicLayers } from "./useCivicLayers";

function makeMockMap(zoom: number) {
  const listeners: Record<string, Array<() => void>> = {};
  const sources: Record<string, { data: unknown; setData: (d: unknown) => void }> = {};
  const layers: Record<string, unknown> = {};
  const state = { zoom };
  return {
    state,
    sources,
    layers,
    fire: (event: string) => listeners[event]?.forEach((fn) => fn()),
    isStyleLoaded: vi.fn(() => true),
    getZoom: vi.fn(() => state.zoom),
    getBounds: vi.fn(() => ({
      getWest: () => -73.995,
      getSouth: () => 40.745,
      getEast: () => -73.985,
      getNorth: () => 40.755,
    })),
    getSource: vi.fn((id: string) => sources[id]),
    addSource: vi.fn((id: string, spec: { data: unknown }) => {
      const source = {
        data: spec.data,
        setData: (d: unknown) => {
          source.data = d;
        },
      };
      sources[id] = source;
    }),
    getLayer: vi.fn((id: string) => layers[id]),
    addLayer: vi.fn((spec: { id: string }) => {
      layers[spec.id] = spec;
    }),
    removeLayer: vi.fn((id: string) => delete layers[id]),
    removeSource: vi.fn((id: string) => delete sources[id]),
    on: vi.fn((event: string, ...args: unknown[]) => {
      (listeners[event] ??= []).push(args[args.length - 1] as () => void);
    }),
    off: vi.fn((event: string, ...args: unknown[]) => {
      const fn = args[args.length - 1];
      listeners[event] = (listeners[event] ?? []).filter((l) => l !== fn);
    }),
    getCanvas: vi.fn(() => ({ style: { cursor: "" } })),
  };
}

function setup(zoom = 15) {
  const map = makeMockMap(zoom);
  const mapRef = { current: map as unknown as maplibregl.Map } as RefObject<maplibregl.Map | null>;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  const hook = renderHook(() => useCivicLayers(mapRef), { wrapper });
  return { map, hook };
}

const feature = (id: string, layer: string) => ({
  type: "Feature",
  id,
  geometry: { type: "LineString", coordinates: [[-73.99, 40.75]] },
  properties: { layer, label: id },
});

describe("useCivicLayers", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const cell = new URL(url, "http://x").searchParams.get("cell");
        return {
          ok: true,
          json: async () => ({
            type: "FeatureCollection",
            features: [feature("priority:shared", "priority"), feature(`bike:${cell}`, "bike")],
          }),
        } as Response;
      })
    );
  });

  it("does not fetch anything until enabled", () => {
    setup();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("loads the visible cells and draws them once, without duplicate features", async () => {
    const { map, hook } = setup();

    act(() => hook.result.current.toggle());

    await waitFor(() => expect(map.sources["civic-layers"]).toBeDefined());
    expect(vi.mocked(fetch).mock.calls.map((c) => c[0])).toEqual([
      "/api/civic-layers?cell=2037_-3700",
    ]);
    const data = map.sources["civic-layers"].data as { features: { id: string }[] };
    expect(data.features.map((f: { id: string }) => f.id).sort()).toEqual([
      "bike:2037_-3700",
      "priority:shared",
    ]);
    expect(Object.keys(map.layers).sort()).toEqual([
      "civic-layers-bike",
      "civic-layers-priority",
      "civic-layers-project",
    ]);
  });

  it("skips loading and flags zoomedOut when the map is zoomed out", () => {
    const { hook } = setup(11);

    act(() => hook.result.current.toggle());

    expect(hook.result.current.zoomedOut).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("picks up newly visible cells after the map moves", async () => {
    const { map, hook } = setup(11);
    act(() => hook.result.current.toggle());

    map.state.zoom = 15;
    act(() => map.fire("moveend"));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(hook.result.current.zoomedOut).toBe(false);
  });

  it("removes the layers when turned off", async () => {
    const { map, hook } = setup();
    act(() => hook.result.current.toggle());
    await waitFor(() => expect(map.layers["civic-layers-bike"]).toBeDefined());

    act(() => hook.result.current.toggle());

    expect(map.layers).toEqual({});
    expect(map.sources["civic-layers"]).toBeUndefined();
  });
});
