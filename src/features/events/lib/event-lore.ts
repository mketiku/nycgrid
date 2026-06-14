import type { VenueEvent } from "../types";

export function getEventLore(event: VenueEvent, loreFact?: string): string {
  const { eventName, venueName, phase } = event;
  let lore: string;

  switch (phase) {
    case "arrival":
      lore = `Fans arriving at ${venueName} for ${eventName}. Starting soon.`;
      break;
    case "during":
      lore = `${eventName} is underway at ${venueName}. Streets fill differently on nights like this.`;
      break;
    case "departure":
      lore = `${eventName} just wrapped at ${venueName}. The crowd is moving.`;
      break;
  }

  return loreFact ? `${lore} ${loreFact}` : lore;
}
