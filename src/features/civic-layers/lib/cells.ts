import { isWithinNycBounds } from "@/lib/security/request";

export const CELL_DEGREES = 0.02;
const MAX_CELLS = 16;

export interface Cell {
  row: number;
  col: number;
}

export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

// The epsilon keeps exact grid edges (40.74 / 0.02 = 2036.9999…) in the right cell.
const index = (degrees: number) => Math.floor(degrees / CELL_DEGREES + 1e-9);
const edge = (i: number) => Number((i * CELL_DEGREES).toFixed(4));

export const cellKey = ({ row, col }: Cell) => `${row}_${col}`;

export function cellsForBounds(bounds: Bounds): string[] {
  const rows = [index(bounds.south), index(bounds.north)];
  const cols = [index(bounds.west), index(bounds.east)];
  if ((rows[1] - rows[0] + 1) * (cols[1] - cols[0] + 1) > MAX_CELLS) return [];

  const keys: string[] = [];
  for (let row = rows[0]; row <= rows[1]; row++) {
    for (let col = cols[0]; col <= cols[1]; col++) {
      const center = cellBounds({ row, col });
      if (isWithinNycBounds((center.south + center.north) / 2, (center.west + center.east) / 2)) {
        keys.push(cellKey({ row, col }));
      }
    }
  }
  return keys;
}

export function parseCellKey(key: string): Cell | null {
  const match = /^(-?\d{1,5})_(-?\d{1,5})$/.exec(key);
  if (!match) return null;
  const cell = { row: Number(match[1]), col: Number(match[2]) };
  const b = cellBounds(cell);
  return isWithinNycBounds((b.south + b.north) / 2, (b.west + b.east) / 2) ? cell : null;
}

export function cellBounds({ row, col }: Cell): Bounds {
  return { south: edge(row), north: edge(row + 1), west: edge(col), east: edge(col + 1) };
}
