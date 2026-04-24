import type { MetadataRoute } from "next";
import { CAMERAS } from "@/lib/cameras/data";

const host = process.env.NEXT_PUBLIC_APP_URL || "https://nycgrid.vercel.app";
const staticRoutes: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/about", changeFrequency: "weekly", priority: 0.7 },
  { path: "/ambient", changeFrequency: "weekly", priority: 0.7 },
  { path: "/collections", changeFrequency: "weekly", priority: 0.7 },
  { path: "/explore", changeFrequency: "weekly", priority: 0.7 },
  { path: "/gallery", changeFrequency: "weekly", priority: 0.7 },
  { path: "/stats", changeFrequency: "weekly", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map(
      (route) =>
        ({
          url: `${host}${route.path}`,
          changeFrequency: route.changeFrequency,
          priority: route.priority,
        }) satisfies MetadataRoute.Sitemap[number]
    ),
    ...CAMERAS.filter((camera) => camera.isOnline).map(
      (camera) =>
        ({
          url: `${host}/camera/${camera.id}`,
          changeFrequency: "hourly",
          priority: 0.8,
        }) satisfies MetadataRoute.Sitemap[number]
    ),
  ];
}
