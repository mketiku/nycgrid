import { describe, it, expect } from "vitest";
import { findCamerasNearCitibike } from "./nearby-cameras";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-handlers";
import type { Camera } from "@/lib/cameras/types";

const mockCameras: Camera[] = [
  {
    id: "cam-close",
    name: "Close Camera",
    latitude: 40.7061,
    longitude: -73.9969, // Matches stub-01 in msw-handlers
    area: "Brooklyn",
    isOnline: true,
    imageUrl: "",
  },
  {
    id: "cam-far",
    name: "Far Camera",
    latitude: 41.0,
    longitude: -74.0,
    area: "Brooklyn",
    isOnline: true,
    imageUrl: "",
  },
];

describe("findCamerasNearCitibike", () => {
  it("returns IDs of cameras near active citibike stations", async () => {
    const result = await findCamerasNearCitibike(mockCameras);
    expect(result.has("cam-close")).toBe(true);
    expect(result.has("cam-far")).toBe(false);
  });

  it("returns empty set if station information fetch fails", async () => {
    server.use(
      http.get("https://gbfs.citibikenyc.com/gbfs/en/station_information.json", () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const result = await findCamerasNearCitibike(mockCameras);
    expect(result.size).toBe(0);
  });

  it("returns empty set if station status fetch fails", async () => {
    server.use(
      http.get("https://gbfs.citibikenyc.com/gbfs/en/station_status.json", () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const result = await findCamerasNearCitibike(mockCameras);
    expect(result.size).toBe(0);
  });

  it("returns empty set if fetch throws", async () => {
    server.use(
      http.get("https://gbfs.citibikenyc.com/gbfs/en/station_information.json", () => {
        return HttpResponse.error();
      })
    );

    const result = await findCamerasNearCitibike(mockCameras);
    expect(result.size).toBe(0);
  });

  it("only includes cameras near RENTING stations", async () => {
    server.use(
      http.get("https://gbfs.citibikenyc.com/gbfs/en/station_status.json", () => {
        return HttpResponse.json({
          data: {
            stations: [
              {
                station_id: "stub-01",
                is_renting: 0, // Not renting
              },
            ],
          },
        });
      })
    );

    const result = await findCamerasNearCitibike(mockCameras);
    expect(result.has("cam-close")).toBe(false);
  });
});
