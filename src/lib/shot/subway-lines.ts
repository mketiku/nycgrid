// Colors from MTA's GTFS static feed (routes.txt route_color / route_text_color).

export interface SubwayLine {
  id: string;
  routes: string[];
  color: string;
  text: string;
}

export const SUBWAY_LINES: readonly SubwayLine[] = [
  { id: "123", routes: ["1", "2", "3"], color: "#D82233", text: "#FFFFFF" },
  { id: "456", routes: ["4", "5", "6"], color: "#009952", text: "#FFFFFF" },
  { id: "7", routes: ["7"], color: "#9A38A1", text: "#FFFFFF" },
  { id: "ACE", routes: ["A", "C", "E"], color: "#0062CF", text: "#FFFFFF" },
  { id: "BDFM", routes: ["B", "D", "F", "M"], color: "#EB6800", text: "#FFFFFF" },
  { id: "G", routes: ["G"], color: "#799534", text: "#FFFFFF" },
  { id: "JZ", routes: ["J", "Z"], color: "#8E5C33", text: "#FFFFFF" },
  { id: "L", routes: ["L"], color: "#7C858C", text: "#FFFFFF" },
  { id: "NQRW", routes: ["N", "Q", "R", "W"], color: "#F6BC26", text: "#000000" },
  { id: "S", routes: ["S"], color: "#7C858C", text: "#FFFFFF" },
];

export const DEFAULT_SUBWAY_LINE = "ACE";

export function subwayLineFor(id: string | undefined): SubwayLine {
  return (
    SUBWAY_LINES.find((l) => l.id === id) ?? SUBWAY_LINES.find((l) => l.id === DEFAULT_SUBWAY_LINE)!
  );
}
