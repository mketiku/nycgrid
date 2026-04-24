import type { Segment } from "../types";

export const FRESH_ASPHALT_SEGMENTS: Segment[] = [
  {
    speaker: "terry",
    weight: 3,
    text: (c) =>
      `Good evening. I'm Terry Crosswalk. Tonight on Fresh Asphalt — ${c.name}. A crossroads. Literally.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: (c) =>
      `The ${c.borough} streetscape invites us to ask: what does it mean to wait at a light? We'll explore that tonight.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: () =>
      `And now — a brief word from our sustaining members. Thank you for making this possible.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: () => `Fascinating. Simply... fascinating.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: (c) =>
      `Coming up — one intersection's story. ${c.name}. It is, in many ways, all of our stories.`,
  },
  {
    speaker: "terry",
    weight: 1,
    text: () => `I'm Terry Crosswalk. For Fresh Asphalt. Good night.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: (c) => `The ${c.borough} sky tonight — much like our democracy — overcast, but enduring.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: (c) =>
      `A car idles at ${c.name}. It has been idling, in some form, for forty years. We are all that car.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: (c) => `We'll take a short break. When we return — more from ${c.borough}. Stay with us.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: () =>
      `A pedestrian crosses. Their journey, unknowable. Their destination, perhaps irrelevant. Their hat — remarkable.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: (c) => `${c.borough}. A place. And yet — so much more than a place.`,
  },
  {
    speaker: "terry",
    weight: 1,
    text: (c) => `One wonders what ${c.name} has witnessed. One does not wonder lightly.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: () => `The light changes. Green. It always does, eventually. That is the promise.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: (c) =>
      `${c.timeOfDay === "night" ? "Late tonight" : "Today"} at ${c.name}. The city, breathing.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: () =>
      `This is Fresh Asphalt. Supported by listeners like you. And by the quiet dignity of the municipal stop sign.`,
  },
  {
    speaker: "terry",
    weight: 1,
    text: (c) =>
      `In ${c.borough} tonight, something is happening. We may never fully understand what. That is okay.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: () =>
      `If you're just joining us — welcome. If you've been here all along — thank you for your patience. Both are valid.`,
  },
  {
    speaker: "terry",
    weight: 2,
    text: (c) =>
      `The intersection of ${c.name} has seen things. Rush hours. Rainstorms. One very determined pigeon. We report on all of it.`,
  },
];
