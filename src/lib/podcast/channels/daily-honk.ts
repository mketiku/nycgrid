import type { Segment } from "../types";

export const DAILY_HONK_SEGMENTS: Segment[] = [
  {
    speaker: "jay",
    weight: 3,
    text: (c) => `PARKER! Are you seeing ${c.name}?! I need photos! FRONT PAGE!`,
  },
  {
    speaker: "jay",
    weight: 3,
    text: (c) =>
      `A RAT. In ${c.borough}. In BROAD DAYLIGHT. I want photos, Parker — we're running this above the fold.`,
  },
  {
    speaker: "jay",
    weight: 3,
    text: (c) =>
      `There is a CAR in the bus lane. A CAR. In the BUS LANE. On ${c.name}. This is a MENACE.`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: (c) =>
      `The ${c.borough} bus ran on time today. ... I'm not crying. YOU'RE crying. It's beautiful.`,
  },
  {
    speaker: "jay",
    weight: 3,
    text: () =>
      `PARKER get me photos — wait. The APP already has photos? Then WHY AREN'T WE DOING MORE WITH IT. PARKER!`,
  },
  {
    speaker: "jay",
    weight: 3,
    text: () =>
      `This city was BUILT by pedestrians and it is being DESTROYED by — is that a RAT? PARKER.`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: () =>
      `The subway. When it works. ... There's nothing like it. Truly nothing. Anyway. RATS.`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: () =>
      `They're organized. The rats. Don't tell me they're not organized. I have EVIDENCE. Parker is looking into it.`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: (c) =>
      `Someone double-parked on ${c.name}. A double-parker. In THIS city. In THIS economy. Unbelievable.`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: (c) =>
      `The bike lane in ${c.borough} is clear today. As it should be. As it ALWAYS should be. We're making PROGRESS.`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: () =>
      `A pedestrian is waiting for the walk signal. THEY have the right of way. THEY do. Not the car. Never the car.`,
  },
  {
    speaker: "jay",
    weight: 3,
    text: (c) => `Front page. FRONT PAGE. Rat at ${c.name}. City of rats. PARKER! WHERE ARE YOU!`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: (c) =>
      `${c.borough} would be paradise — absolute paradise — if we just — you know what. I've said it. I'll say it again.`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: () =>
      `I don't want to talk about it. ... But I will. Because SOMEONE has to. That someone is me. Jay Johan Jaywalker.`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: () =>
      `People complain about the MTA. I say — name a city with better subway BONES. Name one. I'll wait.`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: (c) =>
      `No cars on ${c.name}. Just a clear stretch of beautiful, pedestrian-ready asphalt. That's all I ask. THAT'S ALL.`,
  },
  {
    speaker: "jay",
    weight: 2,
    text: () =>
      `A delivery truck is idling on the crosswalk. On the CROSSWALK. Parker, are you getting this? PARKER!`,
  },
  {
    speaker: "jay",
    weight: 1,
    text: (c) =>
      `${c.borough} in the ${c.timeOfDay}. Magical. Truly magical. Except for the rats. You know what they're doing right now? Planning.`,
  },
];
