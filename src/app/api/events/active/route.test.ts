import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAllActiveEventContexts } from "@/features/events/lib/active-events";
import { captureAppWarning } from "@/lib/monitoring/sentry";
import { GET } from "./route";

vi.mock("@/features/events/lib/active-events", () => ({
  getAllActiveEventContexts: vi.fn(),
}));

vi.mock("@/lib/monitoring/sentry", () => ({
  captureAppWarning: vi.fn(),
}));

describe("/api/events/active", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the active event contexts on success", async () => {
    const contexts = [{ venueId: "msg", eventName: "Knicks vs Nets" }];
    vi.mocked(getAllActiveEventContexts).mockResolvedValue(contexts as never);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(contexts);
    expect(captureAppWarning).not.toHaveBeenCalled();
  });

  it("falls back to an empty list and reports a warning when the lookup throws", async () => {
    vi.mocked(getAllActiveEventContexts).mockRejectedValue(new Error("Ticketmaster timeout"));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(captureAppWarning).toHaveBeenCalledTimes(1);
    expect(captureAppWarning).toHaveBeenCalledWith(
      "events/active: active event context lookup failed",
      expect.objectContaining({ error: "Ticketmaster timeout" })
    );
  });
});
