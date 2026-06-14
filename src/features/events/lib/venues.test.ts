import { describe, it, expect } from "vitest";
import { VENUES, getVenueById } from "./venues";

describe("venues", () => {
  it("exports 7 venues", () => {
    expect(VENUES).toHaveLength(7);
  });

  it("all venues have required fields", () => {
    for (const v of VENUES) {
      expect(v.id).toBeTruthy();
      expect(v.name).toBeTruthy();
      expect(v.lat).toBeTypeOf("number");
      expect(v.lng).toBeTypeOf("number");
      expect(v.tier).toMatch(/^tier[123]$/);
      expect(v.radiusKm).toBeGreaterThan(0);
      expect(Array.isArray(v.cameraIds)).toBe(true);
    }
  });

  it("getVenueById returns the matching venue", () => {
    const msg = getVenueById("msg");
    expect(msg?.name).toBe("Madison Square Garden");
  });

  it("getVenueById returns undefined for unknown id", () => {
    expect(getVenueById("unknown-venue")).toBeUndefined();
  });

  it("MSG has a pre-seeded camera ID", () => {
    const msg = getVenueById("msg");
    expect(msg?.cameraIds).toContain("6a85384f-d82e-4bff-b5f1-15c22cca70e6");
  });

  it("Yankee Stadium has a pre-seeded camera ID", () => {
    const stadium = getVenueById("yankee-stadium");
    expect(stadium?.cameraIds).toContain("ad051a78-9c50-43b3-bb71-83b091acd818");
  });

  it("Citi Field has a pre-seeded camera ID", () => {
    const citiField = getVenueById("citi-field");
    expect(citiField?.cameraIds).toContain("39b42007-16d8-4302-8b8c-602bbb9e9683");
  });
});
