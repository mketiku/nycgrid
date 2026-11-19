"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useQueries } from "@tanstack/react-query";
import type * as maplibregl from "maplibre-gl";
import { cellsForBounds } from "./lib/cells";
import type { CivicLayerCollection, CivicLayerFeature, CivicLayerKind } from "./types";

const SOURCE_ID = "civic-layers";
const MIN_ZOOM = 13;
const DAY_MS = 24 * 60 * 60 * 1000;

const LAYER_STYLES: { kind: CivicLayerKind; token: string; width: number; opacity: number }[] = [
  { kind: "priority", token: "--color-error", width: 6, opacity: 0.35 },
  { kind: "project", token: "--color-accent", width: 3, opacity: 0.7 },
  { kind: "bike", token: "--color-online", width: 1.5, opacity: 0.9 },
];
const layerId = (kind: CivicLayerKind) => `${SOURCE_ID}-${kind}`;

interface Viewport {
  cells: string[];
  zoomedOut: boolean;
}

function readViewport(map: maplibregl.Map): Viewport {
  if (map.getZoom() < MIN_ZOOM) return { cells: [], zoomedOut: true };
  const b = map.getBounds();
  const cells = cellsForBounds({
    west: b.getWest(),
    south: b.getSouth(),
    east: b.getEast(),
    north: b.getNorth(),
  });
  return { cells, zoomedOut: cells.length === 0 };
}

async function fetchCell(cell: string): Promise<CivicLayerCollection | null> {
  const res = await fetch(`/api/civic-layers?cell=${cell}`);
  if (!res.ok) return null;
  return ((await res.json()) as CivicLayerCollection) ?? null;
}

export function useCivicLayers(mapRef: RefObject<maplibregl.Map | null>) {
  const [enabled, setEnabled] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ cells: [], zoomedOut: false });
  const dataRef = useRef<CivicLayerCollection | null>(null);

  const merged = useQueries({
    queries: viewport.cells.map((cell) => ({
      queryKey: ["civic-layers", cell],
      queryFn: () => fetchCell(cell),
      enabled,
      staleTime: DAY_MS,
    })),
    combine: (results): CivicLayerCollection | null => {
      const byId = new Map<string, CivicLayerFeature>();
      for (const r of results) for (const f of r.data?.features ?? []) byId.set(f.id, f);
      return byId.size > 0 ? { type: "FeatureCollection", features: [...byId.values()] } : null;
    },
  });

  // Track the viewport while enabled; state updates happen in map callbacks only.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !enabled) return;
    const onMoveEnd = () => setViewport(readViewport(map));
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [enabled, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (!enabled) {
      removeCivicLayers(map);
      return;
    }
    if (merged) {
      dataRef.current = merged;
      applyCivicLayers(map, merged);
    }
  }, [enabled, merged, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onStyleLoad = () => {
      if (enabled && dataRef.current) applyCivicLayers(map, dataRef.current);
    };
    map.on("style.load", onStyleLoad);
    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [enabled, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    return () => {
      if (map) removeCivicLayers(map);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const map = mapRef.current;
    if (!enabled && map) setViewport(readViewport(map));
    if (enabled) dataRef.current = null;
    setEnabled((v) => !v);
  };

  return { enabled, zoomedOut: enabled && viewport.zoomedOut, toggle };
}

function applyCivicLayers(map: maplibregl.Map, data: CivicLayerCollection) {
  const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (source) source.setData(data as GeoJSON.FeatureCollection);
  else map.addSource(SOURCE_ID, { type: "geojson", data: data as GeoJSON.FeatureCollection });

  const styles = getComputedStyle(document.documentElement);
  const beforeId = map.getLayer("clusters") ? "clusters" : undefined;

  for (const { kind, token, width, opacity } of LAYER_STYLES) {
    const id = layerId(kind);
    if (map.getLayer(id)) continue;
    map.addLayer(
      {
        id,
        type: "line",
        source: SOURCE_ID,
        filter: ["==", ["get", "layer"], kind],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": styles.getPropertyValue(token).trim() || "#888888",
          "line-width": width,
          "line-opacity": opacity,
        },
      },
      beforeId
    );
    map.on("click", id, (e) => showLabel(map, e));
    map.on("mouseenter", id, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", id, () => {
      map.getCanvas().style.cursor = "";
    });
  }
}

function showLabel(map: maplibregl.Map, e: maplibregl.MapLayerMouseEvent) {
  const label = e.features?.[0]?.properties?.label;
  if (typeof label !== "string" || !e.lngLat) return;
  const el = document.createElement("div");
  el.textContent = label;
  el.style.cssText =
    "font-family:monospace;font-size:12px;background:var(--color-elevated);color:var(--color-text-primary);border:1px solid var(--color-border);border-radius:8px;padding:8px 10px";
  import("maplibre-gl").then((ml) => {
    new ml.Popup({ className: "nycgrid-popup" }).setLngLat(e.lngLat).setDOMContent(el).addTo(map);
  });
}

function removeCivicLayers(map: maplibregl.Map) {
  try {
    for (const { kind } of LAYER_STYLES) {
      if (map.getLayer(layerId(kind))) map.removeLayer(layerId(kind));
    }
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  } catch {
    // map may already be destroyed (map.remove() called before this cleanup)
  }
}
