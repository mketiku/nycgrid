"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { RefObject } from "react";
import type maplibregl from "maplibre-gl";
import type { CoverageGeoJSON, DistrictProperties } from "./types";

export default function useCoverageLayer(mapRef: RefObject<maplibregl.Map | null>) {
  const [enabled, setEnabled] = useState(false);
  const dataRef = useRef<CoverageGeoJSON | null>(null);

  const query = useQuery({
    queryKey: ["coverage-gap"],
    queryFn: (): Promise<CoverageGeoJSON> =>
      fetch("/api/coverage-gap").then((r) => r.json() ?? null),
    enabled,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  });

  // Effect 1: add/remove layers when enabled or data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (!enabled) {
      removeCoverageLayer(map);
      return;
    }

    if (query.data) {
      dataRef.current = query.data;
      applyCoverageLayer(map, query.data);
    }
  }, [enabled, query.data, mapRef]);

  // Effect 2: re-apply after theme switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onStyleData = () => {
      if (!enabled || !dataRef.current) return;
      applyCoverageLayer(map, dataRef.current);
    };

    map.on("style.load", onStyleData);
    return () => {
      map.off("style.load", onStyleData);
    };
  }, [enabled, mapRef]);

  // Effect 3: cleanup on unmount — capture the ref value at effect time
  useEffect(() => {
    const map = mapRef.current;
    return () => {
      if (map) removeCoverageLayer(map);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { enabled, toggle: () => setEnabled((v) => !v) };
}

function applyCoverageLayer(map: maplibregl.Map, data: CoverageGeoJSON) {
  const densities = data.features.map((f) => f.properties.densityPerSqMile);
  const maxDensity = densities.length > 0 ? Math.max(...densities) : 1;

  const accent =
    getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() ||
    "#888888";

  const existingSource = map.getSource("coverage-gap") as maplibregl.GeoJSONSource | undefined;
  if (existingSource) {
    existingSource.setData(data as GeoJSON.FeatureCollection);
    if (map.getLayer("coverage-gap-fill") && map.getLayer("coverage-gap-border")) return;
  } else {
    map.addSource("coverage-gap", { type: "geojson", data: data as GeoJSON.FeatureCollection });
  }

  const beforeId = map.getLayer("clusters") ? "clusters" : undefined;

  if (!map.getLayer("coverage-gap-fill")) {
    map.addLayer(
      {
        id: "coverage-gap-fill",
        type: "fill",
        source: "coverage-gap",
        paint: {
          "fill-color": accent,
          "fill-opacity": [
            "interpolate",
            ["linear"],
            ["get", "densityPerSqMile"],
            0,
            0.0,
            maxDensity,
            0.55,
          ],
        },
      },
      beforeId
    );
  }

  if (!map.getLayer("coverage-gap-border")) {
    map.addLayer(
      {
        id: "coverage-gap-border",
        type: "line",
        source: "coverage-gap",
        paint: {
          "line-color": accent,
          "line-width": 0.5,
          "line-opacity": 0.4,
        },
      },
      beforeId
    );
  }

  map.on("click", "coverage-gap-fill", (e) => {
    const props = e.features?.[0]?.properties as DistrictProperties | undefined;
    if (!props || !e.lngLat) return;
    const label = props.neighborhood ? `${props.name} — ${props.neighborhood}` : props.name;
    import("maplibre-gl").then(({ default: ml }) => {
      new ml.Popup({ className: "nycgrid-popup" })
        .setLngLat(e.lngLat)
        .setHTML(
          `<div style="font-family:monospace;font-size:12px;line-height:1.6;background:var(--color-elevated);color:var(--color-text-primary);border:1px solid var(--color-border);border-radius:8px;padding:10px 12px;min-width:160px">
            <strong>${label}</strong><br/>
            <span style="color:var(--color-text-secondary)">${props.cameraCount} camera${props.cameraCount === 1 ? "" : "s"}<br/>
            ${props.densityPerSqMile.toFixed(1)} per sq mile<br/>
            Rank: #${props.densityRank} of 59</span>
          </div>`
        )
        .addTo(map);
    });
  });

  map.on("mouseenter", "coverage-gap-fill", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "coverage-gap-fill", () => {
    map.getCanvas().style.cursor = "";
  });
}

function removeCoverageLayer(map: maplibregl.Map) {
  try {
    for (const id of ["coverage-gap-fill", "coverage-gap-border"]) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    if (map.getSource("coverage-gap")) map.removeSource("coverage-gap");
  } catch {
    // map may already be destroyed (map.remove() called before this cleanup)
  }
}
