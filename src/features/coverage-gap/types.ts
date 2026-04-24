export interface DistrictProperties {
  boroCD: number;
  borough: string;
  districtNumber: number;
  name: string;
  neighborhood: string;
  cameraCount: number;
  areaSqMiles: number;
  densityPerSqMile: number;
  densityRank: number;
}

export interface CoverageFeature {
  type: "Feature";
  geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon;
  properties: DistrictProperties;
}

export interface CoverageGeoJSON {
  type: "FeatureCollection";
  features: CoverageFeature[];
}
