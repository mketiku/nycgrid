import { describe, it, expect, vi, beforeEach } from "vitest";
import { encodeFeed } from "@/test/gtfs-rt-fixtures";
import type { SubwayStation } from "@/lib/subway/types";
import { feedsForRoutes, fetchSubwayArrivals, nearbyStations } from "./fetch-subway";

const NOW = new Date("2026-10-10T12:00:00Z");
const t = (minutes: number) => NOW.getTime() / 1000 + minutes * 60;

const PORT_AUTHORITY: SubwayStation = {
  id: "A27",
  name: "42 St-Port Authority Bus Terminal",
  latitude: 40.757308,
  longitude: -73.989735,
  routes: ["A", "C", "E"],
  northLabel: "Uptown - Queens",
  southLabel: "Downtown & Brooklyn",
};

const FAR_AWAY: SubwayStation = {
  id: "101",
  name: "Van Cortlandt Park-242 St",
  latitude: 40.889248,
  longitude: -73.898583,
  routes: ["1"],
  northLabel: null,
  southLabel: "Manhattan",
};

function mockFeed(bytes: Uint8Array) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
  } as Response);
}

describe("feedsForRoutes", () => {
  it("maps daytime routes to the MTA feeds that carry them, without duplicates", () => {
    expect(feedsForRoutes(["A", "C", "E"])).toEqual(["gtfs-ace"]);
    expect(feedsForRoutes(["N", "Q", "R", "W", "1", "2"]).sort()).toEqual(["gtfs", "gtfs-nqrw"]);
    expect(feedsForRoutes(["SIR"])).toEqual(["gtfs-si"]);
  });

  it("checks every shuttle-carrying feed for an S station", () => {
    expect(feedsForRoutes(["S"]).sort()).toEqual(["gtfs", "gtfs-ace", "gtfs-bdfm"]);
  });
});

const TIMES_SQ_123: SubwayStation = {
  id: "127",
  name: "Times Sq-42 St",
  latitude: 40.75529,
  longitude: -73.987495,
  routes: ["1", "2", "3"],
  northLabel: "Uptown",
  southLabel: "Downtown",
};
const TIMES_SQ_NQRW: SubwayStation = {
  ...TIMES_SQ_123,
  id: "R16",
  latitude: 40.754672,
  longitude: -73.986754,
  routes: ["N", "Q", "R", "W"],
};

describe("nearbyStations", () => {
  it("returns stations within 400 m, nearest first, with distance", () => {
    const result = nearbyStations(40.758, -73.9855, [FAR_AWAY, PORT_AUTHORITY]);
    expect(result.map((s) => s.name)).toEqual(["42 St-Port Authority Bus Terminal"]);
    expect(result[0].distanceM).toBeGreaterThan(300);
    expect(result[0].distanceM).toBeLessThan(400);
  });

  it("groups platforms of the same station so one complex counts once", () => {
    const result = nearbyStations(40.758, -73.9855, [TIMES_SQ_NQRW, PORT_AUTHORITY, TIMES_SQ_123]);
    expect(result.map((s) => s.name)).toEqual([
      "Times Sq-42 St",
      "42 St-Port Authority Bus Terminal",
    ]);
    expect(result[0].platforms.map((p) => p.id).sort()).toEqual(["127", "R16"]);
  });

  it("returns nothing when no station is close", () => {
    expect(nearbyStations(40.6, -74.2, [PORT_AUTHORITY])).toEqual([]);
  });
});

describe("fetchSubwayArrivals", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("lists upcoming trains per direction for the nearby station", async () => {
    mockFeed(
      encodeFeed([
        { routeId: "A", stops: [{ stopId: "A27N", arrival: t(9) }] },
        { routeId: "C", stops: [{ stopId: "A27N", arrival: t(2) }] },
        { routeId: "E", stops: [{ stopId: "A27S", arrival: t(4) }] },
        { routeId: "A", stops: [{ stopId: "A28N", arrival: t(1) }] },
      ])
    );

    const result = await fetchSubwayArrivals(40.758, -73.9855, NOW, [PORT_AUTHORITY]);

    expect(result).toEqual([
      {
        name: "42 St-Port Authority Bus Terminal",
        distanceM: expect.any(Number),
        directions: [
          {
            label: "Uptown - Queens",
            arrivals: [
              { route: "C", minutes: 2 },
              { route: "A", minutes: 9 },
            ],
          },
          { label: "Downtown & Brooklyn", arrivals: [{ route: "E", minutes: 4 }] },
        ],
      },
    ]);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("nyct%2Fgtfs-ace");
  });

  it("drops departed trains, trains over 30 minutes out, and caps each direction at three", async () => {
    mockFeed(
      encodeFeed(
        [-2, 1, 3, 5, 7, 45].map((m, i) => ({
          routeId: i % 2 ? "A" : "C",
          stops: [{ stopId: "A27S", arrival: t(m) }],
        }))
      )
    );

    const [station] = (await fetchSubwayArrivals(40.758, -73.9855, NOW, [PORT_AUTHORITY])) ?? [];

    expect(station.directions).toEqual([
      {
        label: "Downtown & Brooklyn",
        arrivals: [
          { route: "A", minutes: 1 },
          { route: "C", minutes: 3 },
          { route: "A", minutes: 5 },
        ],
      },
    ]);
  });

  it("merges same-label directions across platforms of one station", async () => {
    mockFeed(encodeFeed([{ routeId: "1", stops: [{ stopId: "127N", arrival: t(5) }] }]));
    mockFeed(encodeFeed([{ routeId: "Q", stops: [{ stopId: "R16N", arrival: t(2) }] }]));

    const [station] =
      (await fetchSubwayArrivals(40.758, -73.9855, NOW, [TIMES_SQ_123, TIMES_SQ_NQRW])) ?? [];

    expect(station.directions).toEqual([
      {
        label: "Uptown",
        arrivals: [
          { route: "Q", minutes: 2 },
          { route: "1", minutes: 5 },
        ],
      },
    ]);
  });

  it("skips a direction whose label marks it as the last stop", async () => {
    const terminal: SubwayStation = { ...PORT_AUTHORITY, northLabel: null };
    mockFeed(
      encodeFeed([
        { routeId: "A", stops: [{ stopId: "A27N", arrival: t(1) }] },
        { routeId: "A", stops: [{ stopId: "A27S", arrival: t(6) }] },
      ])
    );

    const [station] = (await fetchSubwayArrivals(40.758, -73.9855, NOW, [terminal])) ?? [];

    expect(station.directions.map((d) => d.label)).toEqual(["Downtown & Brooklyn"]);
  });

  it("shows shuttle route ids as S", async () => {
    const shuttle: SubwayStation = { ...PORT_AUTHORITY, id: "902", routes: ["S"] };
    mockFeed(encodeFeed([{ routeId: "GS", stops: [{ stopId: "902S", arrival: t(3) }] }]));
    mockFeed(encodeFeed([]));
    mockFeed(encodeFeed([]));

    const [station] = (await fetchSubwayArrivals(40.758, -73.9855, NOW, [shuttle])) ?? [];

    expect(station.directions[0].arrivals).toEqual([{ route: "S", minutes: 3 }]);
  });

  it("returns an empty list without fetching when no station is nearby", async () => {
    expect(await fetchSubwayArrivals(40.6, -74.2, NOW, [PORT_AUTHORITY])).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns null when every feed fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("down"));
    expect(await fetchSubwayArrivals(40.758, -73.9855, NOW, [PORT_AUTHORITY])).toBeNull();
  });
});
