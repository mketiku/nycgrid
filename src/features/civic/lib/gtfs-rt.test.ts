import { describe, it, expect } from "vitest";
import { decodeTripUpdates } from "./gtfs-rt";
import { encodeFeed } from "@/test/gtfs-rt-fixtures";

describe("decodeTripUpdates", () => {
  it("extracts route and per-stop arrival times from a GTFS-realtime feed", () => {
    const feed = encodeFeed([
      {
        routeId: "A",
        stops: [
          { stopId: "A27N", arrival: 1_791_700_000 },
          { stopId: "A28N", departure: 1_791_700_120 },
        ],
      },
      { routeId: "C", stops: [{ stopId: "A27S", arrival: 1_791_700_300 }] },
    ]);

    expect(decodeTripUpdates(feed)).toEqual([
      {
        routeId: "A",
        stops: [
          { stopId: "A27N", time: 1_791_700_000 },
          { stopId: "A28N", time: 1_791_700_120 },
        ],
      },
      { routeId: "C", stops: [{ stopId: "A27S", time: 1_791_700_300 }] },
    ]);
  });

  it("skips unknown fields, vehicle-only entities and stops without a time", () => {
    const feed = encodeFeed(
      [{ routeId: "L", stops: [{ stopId: "L06N" }, { stopId: "L08N", arrival: 1_791_700_060 }] }],
      { withHeader: true, withVehicleEntity: true, withExtensions: true }
    );

    expect(decodeTripUpdates(feed)).toEqual([
      { routeId: "L", stops: [{ stopId: "L08N", time: 1_791_700_060 }] },
    ]);
  });

  it("returns an empty list for a truncated buffer instead of throwing", () => {
    const feed = encodeFeed([{ routeId: "G", stops: [{ stopId: "G22N", arrival: 1 }] }]);
    expect(decodeTripUpdates(feed.slice(0, feed.length - 3))).toEqual([]);
  });
});
