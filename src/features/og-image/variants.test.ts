import { describe, it, expectTypeOf } from "vitest";
import type { OgVariant, VenueEventMeta } from "./variants";

describe("og-image variants", () => {
  it("OgVariant includes event", () => {
    const v: OgVariant = "event";
    expectTypeOf(v).toMatchTypeOf<OgVariant>();
  });

  it("VenueEventMeta has required fields", () => {
    expectTypeOf<VenueEventMeta>().toHaveProperty("emoji");
    expectTypeOf<VenueEventMeta>().toHaveProperty("eventName");
    expectTypeOf<VenueEventMeta>().toHaveProperty("venueName");
    expectTypeOf<VenueEventMeta>().toHaveProperty("phase");
  });
});
