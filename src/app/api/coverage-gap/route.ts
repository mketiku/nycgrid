import { NextResponse } from "next/server";
import { CAMERAS } from "@/lib/cameras/data";
import { computeDensity, rankByDensity } from "@/features/coverage-gap/lib/density";
import { CD_NAMES } from "@/features/coverage-gap/lib/cd-names";
import { buildRateLimitHeaders, takeRateLimitToken } from "@/lib/security/rate-limit";
import type { CoverageFeature, CoverageGeoJSON } from "@/features/coverage-gap/types";
import type { Feature, Polygon, MultiPolygon } from "geojson";

export const revalidate = 604800;

const BOROUGH_NAMES: Record<number, string> = {
  1: "Manhattan",
  2: "Bronx",
  3: "Brooklyn",
  4: "Queens",
  5: "Staten Island",
};

const ARCGIS_URL =
  "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/NYC_Community_Districts/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson";

export async function GET(request: Request) {
  const rateLimit = takeRateLimitToken(request.headers, {
    namespace: "coverage-gap",
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate limit exceeded" },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  let rawGeoJSON: { features: Array<Feature<Polygon | MultiPolygon>> };

  try {
    const res = await fetch(ARCGIS_URL, { next: { revalidate: 604800 } });
    if (!res.ok) throw new Error(`ArcGIS responded ${res.status}`);
    rawGeoJSON = await res.json();
  } catch {
    return NextResponse.json({ type: "FeatureCollection", features: [] } satisfies CoverageGeoJSON);
  }

  const cameraPoints = CAMERAS.map((c) => ({ latitude: c.latitude, longitude: c.longitude }));

  const withDensity = rawGeoJSON.features
    .filter((f) => {
      const boroCD = f.properties?.BoroCD as number | undefined;
      return typeof boroCD === "number" && boroCD % 100 <= 20;
    })
    .map((f) => {
      const boroCD = f.properties!.BoroCD as number;
      const boroughCode = Math.floor(boroCD / 100);
      const districtNumber = boroCD % 100;
      const borough = BOROUGH_NAMES[boroughCode] ?? "Unknown";
      const neighborhood = CD_NAMES[boroCD] ?? "";
      const name = `${borough} CD ${districtNumber}`;

      const { cameraCount, areaSqMiles, densityPerSqMile } = computeDensity(f, cameraPoints);

      return {
        boroCD,
        borough,
        districtNumber,
        name,
        neighborhood,
        cameraCount,
        areaSqMiles,
        densityPerSqMile,
        feature: f,
      };
    });

  const ranks = rankByDensity(
    withDensity.map(({ boroCD, densityPerSqMile }) => ({ boroCD, densityPerSqMile }))
  );

  const features: CoverageFeature[] = withDensity.map(
    ({
      boroCD,
      borough,
      districtNumber,
      name,
      neighborhood,
      cameraCount,
      areaSqMiles,
      densityPerSqMile,
      feature,
    }) => ({
      type: "Feature",
      geometry: feature.geometry as CoverageFeature["geometry"],
      properties: {
        boroCD,
        borough,
        districtNumber,
        name,
        neighborhood,
        cameraCount,
        areaSqMiles,
        densityPerSqMile,
        densityRank: ranks.get(boroCD) ?? 59,
      },
    })
  );

  return NextResponse.json({ type: "FeatureCollection", features } satisfies CoverageGeoJSON);
}
