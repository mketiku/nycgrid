import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { CAMERAS } from "@/lib/cameras/data";
import { findCamerasNearCitibike } from "@/lib/citibike/nearby-cameras";

const getCitibikeCameraIds = unstable_cache(
  async () => {
    const set = await findCamerasNearCitibike(CAMERAS);
    return [...set];
  },
  ["citibike-camera-ids"],
  { revalidate: 120 }
);

export async function GET() {
  const ids = await getCitibikeCameraIds();
  return NextResponse.json(ids, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
    },
  });
}
