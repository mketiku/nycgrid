import { describe, it, expect } from "vitest";
import { getNYDateString, getNYHour, isNYHourBefore, addHours } from "./tz";

describe("tz utilities", () => {
  describe("getNYDateString", () => {
    it("returns a date string matching YYYY-MM-DD format", () => {
      const result = getNYDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("accepts an explicit date for testability", () => {
      // 2024-01-15 12:00 UTC = 2024-01-15 07:00 EST
      const date = new Date("2024-01-15T12:00:00Z");
      expect(getNYDateString(date)).toBe("2024-01-15");
    });

    it("handles midnight rollover (UTC midnight is still prev day in NY)", () => {
      // 2024-06-01 02:00 UTC = 2024-05-31 22:00 EDT (NY is UTC-4 in summer)
      const date = new Date("2024-06-01T02:00:00Z");
      expect(getNYDateString(date)).toBe("2024-05-31");
    });
  });

  describe("getNYHour", () => {
    it("returns a number between 0 and 23", () => {
      const result = getNYHour();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(23);
    });

    it("correctly maps UTC hour to NY hour (EST, UTC-5)", () => {
      // 2024-01-15 08:00 UTC = 2024-01-15 03:00 EST
      const date = new Date("2024-01-15T08:00:00Z");
      expect(getNYHour(date)).toBe(3);
    });

    it("correctly maps UTC hour to NY hour (EDT, UTC-4)", () => {
      // 2024-06-15 15:00 UTC = 2024-06-15 11:00 EDT
      const date = new Date("2024-06-15T15:00:00Z");
      expect(getNYHour(date)).toBe(11);
    });
  });

  describe("isNYHourBefore", () => {
    it("returns true when NY hour is before the given hour", () => {
      // 03:00 EST
      const date = new Date("2024-01-15T08:00:00Z");
      expect(isNYHourBefore(5, date)).toBe(true);
    });

    it("returns false when NY hour equals the given hour", () => {
      const date = new Date("2024-01-15T08:00:00Z"); // 03:00 EST
      expect(isNYHourBefore(3, date)).toBe(false);
    });

    it("returns false when NY hour is after the given hour", () => {
      const date = new Date("2024-01-15T12:00:00Z"); // 07:00 EST
      expect(isNYHourBefore(5, date)).toBe(false);
    });
  });

  describe("addHours", () => {
    it("adds positive hours to an ISO string", () => {
      const result = addHours("2024-06-15T19:30:00.000Z", 2);
      expect(result).toBe("2024-06-15T21:30:00.000Z");
    });

    it("adds negative hours (subtraction)", () => {
      const result = addHours("2024-06-15T19:30:00.000Z", -2);
      expect(result).toBe("2024-06-15T17:30:00.000Z");
    });

    it("handles crossing midnight", () => {
      const result = addHours("2024-06-15T23:00:00.000Z", 2);
      expect(result).toBe("2024-06-16T01:00:00.000Z");
    });
  });
});
