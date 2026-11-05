import { describe, expect, it, vi } from "vitest";

vi.mock("./cinema", () => ({ composeCinema: vi.fn(async () => "cinema") }));
vi.mock("./subway", () => ({ composeSubway: vi.fn(async () => "subway") }));

import { composeCinema } from "./cinema";
import { composeSubway } from "./subway";
import { subwayLineFor } from "@/lib/shot/subway-lines";
import { composerFor } from "./composeShot";

const camera = { id: "cam-1", name: "Canal St", area: "Manhattan" as const };
const options = {
  caption: "",
  subwayLine: "JZ",
  showBoroughStamp: true,
  showNycWatermark: false,
};
const shot = {} as HTMLImageElement;

describe("composerFor", () => {
  it("passes overlay toggles to cinema", async () => {
    await composerFor("cinema", camera, options)([shot]);
    expect(composeCinema).toHaveBeenCalledWith(shot, "Canal St", "Manhattan", {
      showBoroughStamp: true,
      showNycWatermark: false,
    });
  });

  it("resolves the subway line id into its colors", async () => {
    await composerFor("subway", camera, options)([shot]);
    expect(composeSubway).toHaveBeenCalledWith(shot, "Canal St", subwayLineFor("JZ"));
  });
});
