import type { CameraArea } from "@/lib/cameras/types";

export type RecommendationType = "video" | "place" | "read" | "resource";

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  url: string;
  source: string;
  youtubeId?: string;
  scope: { kind: "camera"; cameraIds: string[] } | { kind: "area"; area: CameraArea | "citywide" };
}
