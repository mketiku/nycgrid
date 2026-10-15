import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchComplaints } from "./fetch-complaints";

const NOW = new Date("2026-10-10T12:00:00Z");

function mockJson(body: unknown, ok = true) {
  vi.mocked(fetch).mockResolvedValueOnce({ ok, json: async () => body } as Response);
}

function requestedWhere(): string {
  return new URL(vi.mocked(fetch).mock.calls[0][0] as string).searchParams.get("$where") ?? "";
}

describe("fetchComplaints", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("totals street complaints and returns the top three by plain-language label", async () => {
    mockJson([
      { complaint_type: "Illegal Parking", n: "40" },
      { complaint_type: "Noise - Street/Sidewalk", n: "12" },
      { complaint_type: "Street Condition", n: "9" },
      { complaint_type: "Graffiti", n: "2" },
    ]);

    const result = await fetchComplaints(40.758, -73.9855, NOW);

    expect(result).toEqual({
      total: 63,
      top: [
        { label: "Illegal parking", count: 40 },
        { label: "Street noise", count: 12 },
        { label: "Potholes & pavement", count: 9 },
      ],
    });
  });

  it("merges complaint types that share a label", async () => {
    mockJson([
      { complaint_type: "Abandoned Vehicle", n: "3" },
      { complaint_type: "Derelict Vehicles", n: "4" },
    ]);

    const result = await fetchComplaints(40.758, -73.9855, NOW);

    expect(result?.top).toEqual([{ label: "Abandoned vehicles", count: 7 }]);
  });

  it("only asks Socrata for street-facing complaint types over the last 30 days", async () => {
    mockJson([]);

    await fetchComplaints(40.758, -73.9855, NOW);

    const where = requestedWhere();
    expect(where).toContain("within_circle(location, 40.758, -73.9855, 150)");
    expect(where).toContain("created_date >= '2026-09-10'");
    expect(where).toContain("'Illegal Parking'");
    expect(where).not.toContain("Homeless");
    expect(where).not.toContain("Police");
    expect(where).not.toContain("Noise - Residential");
  });

  it("ignores any row whose type is outside the allowlist", async () => {
    mockJson([
      { complaint_type: "Homeless Person Assistance", n: "98" },
      { complaint_type: "Graffiti", n: "1" },
    ]);

    const result = await fetchComplaints(40.758, -73.9855, NOW);

    expect(result).toEqual({ total: 1, top: [{ label: "Graffiti", count: 1 }] });
  });

  it("returns an empty summary when there were no complaints", async () => {
    mockJson([]);
    expect(await fetchComplaints(40.758, -73.9855, NOW)).toEqual({ total: 0, top: [] });
  });

  it("returns null when the API fails", async () => {
    mockJson({}, false);
    expect(await fetchComplaints(40.758, -73.9855, NOW)).toBeNull();
  });
});
