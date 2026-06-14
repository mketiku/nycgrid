import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgVariant,
} from "@/features/og-image/variants";
import { getAllActiveEventContexts } from "@/features/events/lib/active-events";

export const runtime = "nodejs";
export const revalidate = 1800;
export const alt = "nycgrid — Explore the city through its public camera network";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function OgImage() {
  try {
    const contexts = await getAllActiveEventContexts();
    const firstEvent = contexts[0]?.events[0];
    if (firstEvent) {
      return renderOgVariant("event", {
        emoji: firstEvent.emoji,
        eventName: firstEvent.eventName,
        venueName: firstEvent.venueName,
        phase: firstEvent.phase,
      });
    }
  } catch {
    // fall through to default
  }
  return renderOgVariant("city-atlas");
}
