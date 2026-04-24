import type { Camera } from "@/lib/cameras/types";
import { CAMERAS } from "@/lib/cameras/data";

export const MAX_COLLECTION_SIZE = 9;

export interface FeaturedCollection {
  slug: string;
  name: string;
  description: string;
  cameraIds: string[];
}

const FEATURED: FeaturedCollection[] = [
  {
    slug: "manhattan-landmarks",
    name: "Manhattan Landmarks",
    description: "Times Square, Central Park, Columbus Circle — the icons of Midtown, live.",
    cameraIds: [
      "053e8995-f8cb-4d02-a659-70ac7c7da5db", // Times Square
      "6d3a21dd-0434-4d92-a0d1-3ca8b77297db", // Fifth Avenue
      "85809312-60f2-4a52-a694-82628529c05a", // Central Park South
      "c880d0c4-db84-44c2-9f00-62f21a83b5d0", // Columbus Circle
      "984ebbad-ca64-41d8-8008-63aaae316952", // Central Park West
      "936d479d-402f-468a-b1c6-b2c2a68a0b4c", // George Washington Bridge
    ],
  },
  {
    slug: "brooklyn-bridges",
    name: "The Bridges",
    description: "Brooklyn Bridge Walk, DUMBO, Brooklyn Heights, and the FDR approach.",
    cameraIds: [
      "0f3b6031-fe36-43df-b2c7-6120e0580309", // Brooklyn Bridge Walk
      "f1912436-d91e-407e-b4a3-d163090f226f", // DUMBO
      "07c5a9ab-38b0-4176-a932-395cded5858e", // Brooklyn Heights
      "ecba28cb-ac70-4d25-abcb-6506111ea120", // FDR @ Brooklyn Bridge
    ],
  },
  {
    slug: "nyc-waterfront",
    name: "NYC Waterfront",
    description: "Battery Park to Long Island City — the city's edge, water on every side.",
    cameraIds: [
      "7cfc551d-403d-46a8-aa74-89f472b7136b", // Battery Park
      "5c4582a7-6492-41ac-9bac-fa872878117b", // West Street Downtown
      "f1912436-d91e-407e-b4a3-d163090f226f", // DUMBO
      "67f77766-bd19-4082-adeb-88d59866c490", // Long Island City
      "36d22d6d-bffd-4466-8a9c-9c78a1bb9021", // St. George
      "899dfa1e-a2c5-490a-b8ba-480493634846", // Coney Island
    ],
  },
  {
    slug: "the-tunnels",
    name: "Tunnels & Crossings",
    description: "Lincoln Tunnel, Holland Tunnel, GWB — every way in and out of Manhattan.",
    cameraIds: [
      "301002c0-fe39-4fad-998a-fdc66e531b1d", // Lincoln Tunnel
      "25ad72fe-e74c-49af-b4c0-34c9eac14655", // Holland Tunnel
      "936d479d-402f-468a-b1c6-b2c2a68a0b4c", // George Washington Bridge
    ],
  },
  {
    slug: "nyc-parks",
    name: "The Parks",
    description: "Central Park, Prospect Park, Grand Army Plaza — green in the grey city.",
    cameraIds: [
      "85809312-60f2-4a52-a694-82628529c05a", // Central Park South
      "984ebbad-ca64-41d8-8008-63aaae316952", // Central Park West
      "8a6bc417-4877-4ebe-8052-88c1b261baf1", // Central Park N. Entrance
      "3c079db6-117c-4e79-94ed-5178c1517091", // Prospect Park
      "cb68b8b1-9093-4f2e-acf2-8133b047e8df", // Grand Army Plaza
    ],
  },
  {
    slug: "outer-boroughs",
    name: "Outer Boroughs",
    description: "Coney Island, Rockaway, Jamaica, The Bronx — the city beyond Manhattan.",
    cameraIds: [
      "899dfa1e-a2c5-490a-b8ba-480493634846", // Coney Island
      "16d86749-6ec5-4594-8ccc-56c9507fedc3", // Rockaway
      "6dd4b946-8704-4690-aa87-017a19e778c5", // Jamaica
      "2f28f8df-5eb5-4327-ab1f-7feaf2630b34", // Grand Concourse
      "0ee4eb1e-77ce-47a1-a145-0cb115656aad", // Cross Bronx Expressway
      "36d22d6d-bffd-4466-8a9c-9c78a1bb9021", // St. George
    ],
  },
];

export const FEATURED_COLLECTIONS: FeaturedCollection[] = FEATURED;

export function getCollection(slug: string): FeaturedCollection | undefined {
  return FEATURED.find((c) => c.slug === slug);
}

export function resolveCameras(ids: string[]): Camera[] {
  return ids.flatMap((id) => {
    const cam = CAMERAS.find((c) => c.id === id);
    return cam ? [cam] : [];
  });
}

export function encodeCameraIds(ids: string[]): string {
  return ids.join(",");
}

export function decodeCameraIds(param: string): string[] {
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_COLLECTION_SIZE);
}
