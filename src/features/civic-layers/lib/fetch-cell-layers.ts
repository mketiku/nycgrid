import type { Geometry, Position } from "geojson";
import { boxPolygon, querySocrata } from "@/features/civic/lib/socrata";
import type { CivicLayerCollection, CivicLayerFeature, CivicLayerKind } from "../types";
import { cellBounds, type Cell } from "./cells";

interface LayerRow {
  ":id": string;
  the_geom?: Geometry;
  ft_facilit?: string;
  pjct_name?: string;
  sip_year?: string;
}

interface LayerSource {
  layer: CivicLayerKind;
  dataset: string;
  select: string;
  where?: string;
  label: (row: LayerRow) => string;
}

const SOURCES: LayerSource[] = [
  {
    layer: "bike",
    dataset: "mzxg-pwib",
    select: ":id, the_geom, ft_facilit",
    where: "status = 'Current'",
    label: (r) => (r.ft_facilit ? `${r.ft_facilit} bike lane` : "Bike lane"),
  },
  {
    layer: "project",
    dataset: "if4c-w48d",
    select: ":id, the_geom, pjct_name, sip_year",
    label: (r) =>
      r.pjct_name
        ? `${r.pjct_name}${r.sip_year ? ` (${r.sip_year})` : ""}`
        : "Street improvement project",
  },
  {
    layer: "priority",
    dataset: "36nr-7fbp",
    select: ":id, the_geom",
    label: () => "Vision Zero priority corridor",
  },
];

const round = (n: number) => Math.round(n * 1e5) / 1e5;

function roundPositions(value: unknown): unknown {
  if (typeof value === "number") return round(value);
  return Array.isArray(value) ? value.map(roundPositions) : value;
}

function roundGeometry(geometry: Geometry): Geometry {
  if (geometry.type === "GeometryCollection") return geometry;
  return {
    ...geometry,
    coordinates: roundPositions(geometry.coordinates) as Position[][],
  } as Geometry;
}

function cellPolygon(cell: Cell): string {
  const { west, south, east, north } = cellBounds(cell);
  return boxPolygon(west, south, east, north);
}

export async function fetchCellLayers(cell: Cell): Promise<CivicLayerCollection | null> {
  const intersects = `intersects(the_geom, '${cellPolygon(cell)}')`;

  const results = await Promise.all(
    SOURCES.map(async (source) => {
      const rows = await querySocrata<LayerRow>(source.dataset, {
        $select: source.select,
        $where: source.where ? `${intersects} AND ${source.where}` : intersects,
        $limit: "2000",
      });
      if (!rows) return null;
      return rows.flatMap((row): CivicLayerFeature[] =>
        row.the_geom
          ? [
              {
                type: "Feature",
                id: `${source.layer}:${row[":id"]}`,
                geometry: roundGeometry(row.the_geom),
                properties: { layer: source.layer, label: source.label(row) },
              },
            ]
          : []
      );
    })
  );

  if (results.every((r) => r === null)) return null;
  return { type: "FeatureCollection", features: results.flatMap((r) => r ?? []) };
}
