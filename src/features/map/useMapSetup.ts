"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Camera, CameraArea } from "@/lib/cameras/types";

const CARTO_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const CARTO_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const OFM_GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

const NYC_CENTER: [number, number] = [-73.9857, 40.7484];
const NYC_ZOOM = 11;

// Pre-fetch and patch a Carto style JSON: replace the glyphs URL with OFM's and
// remap every symbol layer's text-font so MapLibre never requests Carto's font CDN
// (which has no CORS headers). Doing this before map init avoids the race between
// styledata firing and the first font fetch.
async function fetchPatchedStyle(url: string): Promise<maplibregl.StyleSpecification> {
  const res = await fetch(url);
  const style = (await res.json()) as maplibregl.StyleSpecification;
  (style as Record<string, unknown>).glyphs = OFM_GLYPHS;
  for (const layer of style.layers) {
    if (layer.type !== "symbol") continue;
    const layout = (layer as { layout?: Record<string, unknown> }).layout;
    if (!layout) continue;
    const fonts = layout["text-font"];
    if (!fonts) continue;
    const isBold = Array.isArray(fonts) && fonts.some((f: unknown) => /bold/i.test(String(f)));
    layout["text-font"] = isBold ? ["Noto Sans Bold"] : ["Noto Sans Regular"];
  }
  return style;
}

export interface UseMapSetupOptions {
  cameras: Camera[];
  featuredIds: Set<string>;
  accentColor: string;
  isLight: boolean;
  onCameraSelect: (camera: Camera) => void;
}

export function useMapSetup({
  cameras,
  featuredIds,
  accentColor,
  isLight,
  onCameraSelect,
}: UseMapSetupOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // Ref so the on("load") closure always reads the latest accentColor,
  // not the value captured at mount (which may be undefined before Zustand hydrates)
  const accentColorRef = useRef(accentColor);
  useEffect(() => {
    accentColorRef.current = accentColor;
  }, [accentColor]);
  // Skip the first run of the isLight effect — the map is already initialized with the
  // correct style; only fire setStyle on subsequent changes.
  const isLightInitialized = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    fetchPatchedStyle(isLight ? CARTO_LIGHT : CARTO_DARK).then((patchedStyle) => {
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: patchedStyle,
        center: NYC_CENTER,
        zoom: NYC_ZOOM,
        minZoom: 9,
        maxZoom: 18,
        attributionControl: false,
      });

      map.on("load", () => {
        const color = accentColorRef.current;
        if (!color) return;
        addCameraLayers(map, cameras, featuredIds, color);
        bindLayerEvents(map, cameras, onCameraSelect);
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      isLightInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update GeoJSON data when cameras change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("cameras") as maplibregl.GeoJSONSource | undefined;
    if (source) source.setData(toGeoJSON(cameras, featuredIds));
  }, [cameras, featuredIds]);

  // Switch between light and dark map style
  useEffect(() => {
    if (!isLightInitialized.current) {
      isLightInitialized.current = true;
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    fetchPatchedStyle(isLight ? CARTO_LIGHT : CARTO_DARK).then((patchedStyle) => {
      if (!mapRef.current) return;
      map.setStyle(patchedStyle);
      map.once("style.load", () => {
        if (!accentColor) return;
        addCameraLayers(map, cameras, featuredIds, accentColor);
        bindLayerEvents(map, cameras, onCameraSelect);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLight]);

  // Update paint properties when theme accent changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !accentColor) return;
    if (!map.getLayer("clusters") || !map.getLayer("unclustered-point")) return;
    const contrastColor = getClusterContrastColor(accentColor);
    map.setPaintProperty("clusters", "circle-color", accentColor);
    map.setPaintProperty("clusters", "circle-stroke-color", contrastColor);
    if (map.getLayer("cluster-count")) {
      map.setPaintProperty("cluster-count", "text-color", contrastColor);
    }
    map.setPaintProperty("unclustered-point", "circle-color", [
      "case",
      ["==", ["get", "isOnline"], true],
      accentColor,
      "#555555",
    ]);
  }, [accentColor]);

  const flyTo = useCallback((center: [number, number], zoom = 15) => {
    mapRef.current?.flyTo({ center, zoom, duration: 1200 });
  }, []);

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  const filterByBorough = useCallback((area: CameraArea | null) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (area === null) {
      map.setFilter("unclustered-point", ["!", ["has", "point_count"]]);
      map.setFilter("unclustered-point-hit", ["!", ["has", "point_count"]]);
      map.setFilter("clusters", ["has", "point_count"]);
      map.setFilter("cluster-count", ["has", "point_count"]);
    } else {
      const boroughMatch: maplibregl.FilterSpecification = ["==", ["get", "area"], area];
      map.setFilter("unclustered-point", ["all", ["!", ["has", "point_count"]], boroughMatch]);
      map.setFilter("unclustered-point-hit", ["all", ["!", ["has", "point_count"]], boroughMatch]);
      map.setFilter("clusters", ["all", ["has", "point_count"], boroughMatch]);
      map.setFilter("cluster-count", ["all", ["has", "point_count"], boroughMatch]);
    }
  }, []);

  return { containerRef, mapRef, flyTo, zoomIn, zoomOut, filterByBorough };
}

function toGeoJSON(cameras: Camera[], featuredIds: Set<string>): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: cameras.map((c) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [c.longitude, c.latitude] },
      properties: {
        id: c.id,
        name: c.name,
        area: c.area,
        isOnline: c.isOnline,
        imageUrl: c.imageUrl,
        featured: featuredIds.has(c.id),
      },
    })),
  };
}

function getClusterContrastColor(hexColor: string): "#0a0a0a" | "#ffffff" {
  const normalized = hexColor.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "#0a0a0a";

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance < 0.45 ? "#ffffff" : "#0a0a0a";
}

function addCameraLayers(
  map: maplibregl.Map,
  cameras: Camera[],
  featuredIds: Set<string>,
  accentColor: string
) {
  if (!accentColor) return;
  if (map.getSource("cameras")) return;
  const clusterContrastColor = getClusterContrastColor(accentColor);
  map.addSource("cameras", {
    type: "geojson",
    data: toGeoJSON(cameras, featuredIds),
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 45,
  });

  // Cluster circles
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "cameras",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": accentColor,
      "circle-opacity": 0.85,
      "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 28],
      "circle-stroke-width": 1,
      "circle-stroke-color": clusterContrastColor,
    },
  });

  // Cluster count labels
  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "cameras",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12,
      "text-font": ["Noto Sans Bold"],
    },
    paint: {
      "text-color": clusterContrastColor,
    },
  });

  // Individual camera dots — featured get larger + white ring
  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "cameras",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["case", ["==", ["get", "isOnline"], true], accentColor, "#555555"],
      "circle-radius": ["case", ["==", ["get", "featured"], true], 9, 6],
      "circle-stroke-width": ["case", ["==", ["get", "featured"], true], 2, 1.5],
      "circle-stroke-color": ["case", ["==", ["get", "featured"], true], "#ffffff", "#0a0a0a"],
      "circle-opacity": 0.9,
    },
  });

  // Transparent hit-target layer — enlarged radius for mobile tap detection
  map.addLayer({
    id: "unclustered-point-hit",
    type: "circle",
    source: "cameras",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": 20,
      "circle-opacity": 0,
      "circle-stroke-width": 0,
      "circle-color": "#000000",
    },
  });
}

function bindLayerEvents(
  map: maplibregl.Map,
  cameras: Camera[],
  onCameraSelect: (camera: Camera) => void
) {
  map.on("click", "clusters", (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
    if (!features.length) return;
    const clusterId = features[0].properties?.cluster_id as number;
    const source = map.getSource("cameras") as maplibregl.GeoJSONSource;
    source
      .getClusterExpansionZoom(clusterId)
      .then((zoom) => {
        const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
        map.easeTo({ center: coords, zoom });
      })
      .catch(() => {});
  });

  // Use the hit layer for clicks — larger radius means better mobile tap targets
  map.on("click", "unclustered-point-hit", (e) => {
    const props = e.features?.[0]?.properties;
    if (!props) return;
    const camera = cameras.find((c) => c.id === props.id);
    if (camera) onCameraSelect(camera);
  });

  map.on("mouseenter", "clusters", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "clusters", () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("mouseenter", "unclustered-point-hit", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "unclustered-point-hit", () => {
    map.getCanvas().style.cursor = "";
  });
}
