import { useState } from "react";
import type { CameraArea } from "@/lib/cameras/types";

const BOROUGH_LABEL: Record<CameraArea, string> = {
  Manhattan: "Manhattan",
  Brooklyn: "Brooklyn",
  Queens: "Queens",
  Bronx: "The Bronx",
  "Staten Island": "Staten Island",
  Unknown: "Unknown",
};

interface AnnouncementInput {
  selectedBorough: CameraArea | null;
  filteredCount: number;
  totalCount: number;
  previousBorough: CameraArea | null;
}

export function buildBoroughAnnouncement({
  selectedBorough,
  filteredCount,
  totalCount,
  previousBorough,
}: AnnouncementInput): string {
  if (selectedBorough) {
    const noun = filteredCount === 1 ? "camera" : "cameras";
    return `Showing ${filteredCount} ${noun} in ${BOROUGH_LABEL[selectedBorough]}`;
  }
  if (previousBorough) {
    return `Showing all ${totalCount} cameras`;
  }
  return "";
}

export function useBoroughAnnouncement(input: Omit<AnnouncementInput, "previousBorough">): string {
  // Derived-state-during-render: track the previous borough in component state
  // and update it when it changes, just like the React docs `Form` example.
  const [prevBorough, setPrevBorough] = useState<CameraArea | null>(input.selectedBorough);
  const [announcement, setAnnouncement] = useState<string>(() =>
    buildBoroughAnnouncement({
      selectedBorough: input.selectedBorough,
      filteredCount: input.filteredCount,
      totalCount: input.totalCount,
      previousBorough: input.selectedBorough,
    })
  );
  const [prevSig, setPrevSig] = useState(
    `${input.selectedBorough ?? ""}|${input.filteredCount}|${input.totalCount}`
  );
  const sig = `${input.selectedBorough ?? ""}|${input.filteredCount}|${input.totalCount}`;
  if (sig !== prevSig) {
    setPrevSig(sig);
    setAnnouncement(
      buildBoroughAnnouncement({
        selectedBorough: input.selectedBorough,
        filteredCount: input.filteredCount,
        totalCount: input.totalCount,
        previousBorough: prevBorough,
      })
    );
    setPrevBorough(input.selectedBorough);
  }
  return announcement;
}
