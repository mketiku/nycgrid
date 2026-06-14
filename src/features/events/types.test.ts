import { describe, it, expectTypeOf } from "vitest";
import type {
  VenueTier,
  EventCategory,
  EventPhase,
  Venue,
  VenueEvent,
  ActiveEventContext,
} from "./types";

describe("event types", () => {
  it("VenueTier has expected literals", () => {
    const t: VenueTier = "tier1";
    expectTypeOf(t).toMatchTypeOf<"tier1" | "tier2" | "tier3">();
  });

  it("EventCategory has expected literals", () => {
    const c: EventCategory = "sports";
    expectTypeOf(c).toMatchTypeOf<"sports" | "concert" | "other">();
  });

  it("EventPhase has expected literals", () => {
    const p: EventPhase = "arrival";
    expectTypeOf(p).toMatchTypeOf<"arrival" | "during" | "departure">();
  });

  it("Venue has required fields", () => {
    expectTypeOf<Venue>().toHaveProperty("id");
    expectTypeOf<Venue>().toHaveProperty("name");
    expectTypeOf<Venue>().toHaveProperty("lat");
    expectTypeOf<Venue>().toHaveProperty("lng");
    expectTypeOf<Venue>().toHaveProperty("tier");
    expectTypeOf<Venue>().toHaveProperty("radiusKm");
    expectTypeOf<Venue>().toHaveProperty("cameraIds");
  });

  it("VenueEvent has required fields", () => {
    expectTypeOf<VenueEvent>().toHaveProperty("venueId");
    expectTypeOf<VenueEvent>().toHaveProperty("venueName");
    expectTypeOf<VenueEvent>().toHaveProperty("eventName");
    expectTypeOf<VenueEvent>().toHaveProperty("category");
    expectTypeOf<VenueEvent>().toHaveProperty("startIso");
    expectTypeOf<VenueEvent>().toHaveProperty("endIso");
    expectTypeOf<VenueEvent>().toHaveProperty("phase");
    expectTypeOf<VenueEvent>().toHaveProperty("emoji");
    expectTypeOf<VenueEvent>().toHaveProperty("url");
  });

  it("ActiveEventContext has required fields", () => {
    expectTypeOf<ActiveEventContext>().toHaveProperty("venueId");
    expectTypeOf<ActiveEventContext>().toHaveProperty("venueName");
    expectTypeOf<ActiveEventContext>().toHaveProperty("events");
    expectTypeOf<ActiveEventContext>().toHaveProperty("cameraIds");
  });
});
