import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSessionStats } from "./useSessionStats";
import * as session from "@/lib/analytics/session";

vi.mock("@/lib/analytics/session", () => ({
  readSessionStats: vi.fn(),
}));

describe("useSessionStats", () => {
  it("reads stats from storage on mount and calls readSessionStats exactly once", () => {
    const mockStats: session.SessionStats = {
      selfiesTaken: 5,
      gifsExported: 2,
      camerasViewedTotal: 10,
      camerasThisSession: 3,
      ambientSeconds: 120,
      favoriteBorough: "Manhattan",
      favoriteBoroughCount: 7,
    };

    vi.mocked(session.readSessionStats).mockReturnValue(mockStats);

    const { result } = renderHook(() => useSessionStats());

    // Should match the mock stats after the effect runs
    expect(result.current).toEqual(mockStats);
    expect(session.readSessionStats).toHaveBeenCalledTimes(1);
  });
});
