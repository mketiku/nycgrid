export interface NtaFeature {
  type: "Feature";
  properties: {
    ntaname: string;
    nta2020?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: [number, number][][] | [number, number][][][];
  };
}

export interface NtaFeatureCollection {
  type: "FeatureCollection";
  features: NtaFeature[];
}

/**
 * Ray-casting point-in-polygon test.
 * ring: array of [lng, lat] pairs (closed or open — closing handled internally).
 */
export function pointInPolygon(lng: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1];
    const xj = ring[j][0],
      yj = ring[j][1];
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInFeature(lng: number, lat: number, feature: NtaFeature): boolean {
  const { type, coordinates } = feature.geometry;
  if (type === "Polygon") {
    const rings = coordinates as [number, number][][];
    if (!pointInPolygon(lng, lat, rings[0])) return false;
    for (let h = 1; h < rings.length; h++) {
      if (pointInPolygon(lng, lat, rings[h])) return false;
    }
    return true;
  }
  if (type === "MultiPolygon") {
    const polys = coordinates as [number, number][][][];
    for (const rings of polys) {
      if (!pointInPolygon(lng, lat, rings[0])) continue;
      let inHole = false;
      for (let h = 1; h < rings.length; h++) {
        if (pointInPolygon(lng, lat, rings[h])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

export function findNeighborhood(lng: number, lat: number, features: NtaFeature[]): string | null {
  for (const feature of features) {
    if (pointInFeature(lng, lat, feature)) {
      return feature.properties.ntaname;
    }
  }
  return null;
}
