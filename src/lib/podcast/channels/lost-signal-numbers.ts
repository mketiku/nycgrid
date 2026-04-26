import type { Segment } from "../types";

// ASCII 8-bit binary for N, Y, C
const N_BIN = "zero one zero zero one one one zero";
const Y_BIN = "zero one zero one one zero zero one";
const C_BIN = "zero one zero zero zero zero one one";

function randomDigit(): number {
  return Math.floor(Math.random() * 9) + 1;
}

export const LOST_SIGNAL_NUMBERS_SEGMENTS: Segment[] = [
  {
    speaker: "reader",
    weight: 3,
    text: () => {
      const d = Array.from({ length: 5 }, randomDigit);
      return `${d[0]}. ${d[1]}. ${d[2]}. ${d[3]}. ${d[4]}. Stand by.`;
    },
  },
  {
    speaker: "reader",
    weight: 3,
    text: (c) => `Grid reference. ${c.name}. Signal nominal.`,
  },
  {
    speaker: "reader",
    weight: 2,
    text: () => `Transmitting. ${N_BIN}. ${Y_BIN}. ${C_BIN}. Message ends.`,
  },
  {
    speaker: "reader",
    weight: 2,
    text: (c) => `Station check. ${c.borough}. ${c.timeOfDay} watch. Nominal.`,
  },
  {
    speaker: "reader",
    weight: 2,
    text: () => "Five. Four. Three. Two. One. Monitoring.",
  },
  {
    speaker: "reader",
    weight: 2,
    text: () =>
      "Forty point seven two four north. Seventy four point zero zero six west. Grid locked.",
  },
  {
    speaker: "reader",
    weight: 3,
    text: (c) => {
      const a = randomDigit();
      const b = randomDigit();
      const cc = randomDigit();
      return `${a}. ${b}. ${cc}. ${c.borough}. ${a + b}. ${b + cc}. Transmission ends.`;
    },
  },
  {
    speaker: "reader",
    weight: 1,
    text: (c) =>
      `This is station echo november zed. Camera ${c.name} is ${c.isOnline ? "online" : "offline"}. Out.`,
  },
  {
    speaker: "reader",
    weight: 2,
    text: () => {
      const d = Array.from({ length: 3 }, randomDigit);
      return `${d[0]}. ${d[1]}. ${d[2]}. Repeat. ${d[0]}. ${d[1]}. ${d[2]}. End of message.`;
    },
  },
  {
    speaker: "reader",
    weight: 1,
    text: (c) =>
      `Intercept. ${c.timeOfDay}. ${c.borough} sector. ${N_BIN.split(" ").slice(0, 4).join(". ")}. Nominal.`,
  },
];
