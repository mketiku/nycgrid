import type { Metadata } from "next";
import { CAMERAS } from "@/lib/cameras/data";
import { AmbientPlayer } from "@/features/ambient/AmbientPlayer";

export const metadata: Metadata = {
  title: "Ambient — nycgrid",
  description: "Drift through NYC's traffic cameras in fullscreen.",
};

export default function AmbientPage() {
  const onlineCameras = CAMERAS.filter((c) => c.isOnline);
  return <AmbientPlayer cameras={onlineCameras} />;
}
