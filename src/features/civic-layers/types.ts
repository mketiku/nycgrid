import type { Geometry } from "geojson";

export type CivicLayerKind = "bike" | "project" | "priority";

export interface CivicLayerFeature {
  type: "Feature";
  id: string;
  geometry: Geometry;
  properties: { layer: CivicLayerKind; label: string };
}

export interface CivicLayerCollection {
  type: "FeatureCollection";
  features: CivicLayerFeature[];
}
