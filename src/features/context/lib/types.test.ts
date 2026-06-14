import { describe, it, expectTypeOf } from "vitest";
import type { CameraContextData } from "../types";
import type { VenueEvent } from "@/features/events/types";

describe("CameraContextData", () => {
  it("has venueEvent field typed as VenueEvent | null", () => {
    expectTypeOf<CameraContextData>().toHaveProperty("venueEvent");
    expectTypeOf<CameraContextData["venueEvent"]>().toMatchTypeOf<VenueEvent | null>();
  });
});
