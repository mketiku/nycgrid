// src/lib/postcard/select.test.ts
import { describe, expect, it } from "vitest";
import { dayKey, hashString, selectDailyCamera } from "./select";

describe("dayKey", () => {
  it("formats a date as YYYY-MM-DD in America/New_York", () => {
    expect(dayKey(new Date("2026-06-13T12:00:00Z"))).toBe("2026-06-13");
  });

  it("uses ET, not UTC, near midnight", () => {
    // 2026-06-14T03:00:00Z == 2026-06-13 23:00 ET → still the 13th in ET
    expect(dayKey(new Date("2026-06-14T03:00:00Z"))).toBe("2026-06-13");
  });
});

describe("hashString", () => {
  it("is deterministic and non-negative", () => {
    expect(hashString("2026-06-13")).toBe(hashString("2026-06-13"));
    expect(hashString("anything")).toBeGreaterThanOrEqual(0);
  });
  it("differs for different inputs", () => {
    expect(hashString("2026-06-13")).not.toBe(hashString("2026-06-14"));
  });
});

describe("selectDailyCamera", () => {
  const set = ["a", "b", "c", "d", "e"] as const;

  it("returns a stable element for a given key", () => {
    expect(selectDailyCamera("2026-06-13", set)).toBe(selectDailyCamera("2026-06-13", set));
  });

  it("always returns an in-bounds element", () => {
    for (const key of ["x", "yy", "2026-01-01", "2026-12-31", ""]) {
      expect(set).toContain(selectDailyCamera(key, set));
    }
  });

  it("spreads across the set over many days", () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 31; d++) {
      seen.add(selectDailyCamera(`2026-03-${String(d).padStart(2, "0")}`, set));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
