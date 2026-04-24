import type { DialoguePair } from "../types";

export const STOOP_TALK_PAIRS: DialoguePair[] = [
  {
    weight: 3,
    lines: [
      { speaker: "deshawn", text: (c) => `That's not even ${c.borough} anymore.` },
      { speaker: "maurizio", text: () => `DeShawn I LIVE there.` },
      {
        speaker: "deshawn",
        text: (c) => `You live in a building that is IN ${c.borough}. That's different.`,
      },
    ],
  },
  {
    weight: 3,
    lines: [
      { speaker: "maurizio", text: (c) => `The bodega on ${c.name} —` },
      { speaker: "deshawn", text: () => `Don't.` },
      { speaker: "maurizio", text: () => `I'm just saying —` },
      { speaker: "deshawn", text: () => `Maurizio.` },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "deshawn", text: (c) => `Name one good thing about ${c.borough}.` },
      { speaker: "maurizio", text: () => `...the pizza.` },
      { speaker: "deshawn", text: () => `That pizza is not from here and you know it.` },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "maurizio", text: (c) => `My grandmother grew up near ${c.name}.` },
      {
        speaker: "deshawn",
        text: () => `Your grandmother is the last real one. Everyone else? Transplants.`,
      },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "deshawn", text: (c) => `You know what ${c.name} used to be?` },
      { speaker: "maurizio", text: () => `A parking lot?` },
      { speaker: "deshawn", text: () => `A COMMUNITY, Maurizio. A community.` },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "maurizio", text: (c) => `There's a new coffee place on ${c.name}.` },
      { speaker: "deshawn", text: () => `I know.` },
      { speaker: "maurizio", text: () => `It's actually good.` },
      { speaker: "deshawn", text: () => `I know.` },
      { speaker: "maurizio", text: () => `You been?` },
      { speaker: "deshawn", text: () => `...I've been.` },
    ],
  },
  {
    weight: 2,
    lines: [
      {
        speaker: "deshawn",
        text: (c) => `The ${c.borough} stop has been out of service for three weeks.`,
      },
      { speaker: "maurizio", text: () => `Which one?` },
      { speaker: "deshawn", text: () => `All of them.` },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "maurizio", text: () => `We should do Manhattan next.` },
      { speaker: "deshawn", text: () => `No.` },
      { speaker: "maurizio", text: () => `Why?` },
      { speaker: "deshawn", text: () => `We're not doing Manhattan.` },
      { speaker: "maurizio", text: () => `Just —` },
      { speaker: "deshawn", text: () => `We're. Not. Doing. Manhattan.` },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "deshawn", text: (c) => `${c.borough} in the ${c.timeOfDay}.` },
      { speaker: "maurizio", text: () => `Incredible.` },
      { speaker: "deshawn", text: () => `It's brutal.` },
      { speaker: "maurizio", text: () => `Brutally incredible.` },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "maurizio", text: () => `Sometimes I think about leaving New York.` },
      { speaker: "deshawn", text: () => `And go where?` },
      { speaker: "maurizio", text: () => `...I don't know.` },
      { speaker: "deshawn", text: () => `Exactly.` },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "deshawn", text: (c) => `What do you think rent is on ${c.name}?` },
      { speaker: "maurizio", text: () => `Don't.` },
      { speaker: "deshawn", text: () => `I'm just asking —` },
      { speaker: "maurizio", text: () => `It's too much. It's always too much.` },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "maurizio", text: (c) => `There's always traffic on ${c.name}.` },
      { speaker: "deshawn", text: () => `There's always traffic everywhere.` },
      { speaker: "maurizio", text: () => `That's what I said.` },
      { speaker: "deshawn", text: (c) => `You said ${c.name} specifically.` },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "deshawn", text: (c) => `You know what ${c.borough} needs?` },
      { speaker: "maurizio", text: () => `More parking?` },
      { speaker: "deshawn", text: () => `Less parking. More soul.` },
    ],
  },
  {
    weight: 3,
    lines: [
      { speaker: "maurizio", text: () => `Is that a —` },
      { speaker: "deshawn", text: () => `Don't look at it.` },
      { speaker: "maurizio", text: () => `Should we —` },
      { speaker: "deshawn", text: () => `Don't look at it.` },
    ],
  },
  {
    weight: 2,
    lines: [
      { speaker: "deshawn", text: () => `Listen.` },
      { speaker: "maurizio", text: () => `I'm listening.` },
      { speaker: "deshawn", text: () => `...No, I just wanted you to listen.` },
      { speaker: "maurizio", text: () => `To what?` },
      { speaker: "deshawn", text: () => `To the city.` },
    ],
  },
  {
    weight: 1,
    lines: [
      { speaker: "maurizio", text: (c) => `I could see myself living on ${c.name}.` },
      { speaker: "deshawn", text: (c) => `You could not afford ${c.name}.` },
      { speaker: "maurizio", text: () => `I'm saying hypothetically.` },
      { speaker: "deshawn", text: () => `Hypothetically you still couldn't afford it.` },
    ],
  },
  {
    weight: 2,
    lines: [
      {
        speaker: "deshawn",
        text: (c) => `${c.borough}. You know what the problem with ${c.borough} is?`,
      },
      { speaker: "maurizio", text: () => `The traffic?` },
      { speaker: "deshawn", text: () => `Everyone thinks they discovered it.` },
    ],
  },
];
