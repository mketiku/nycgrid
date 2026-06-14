import { describe, expect, it, vi } from "vitest";
import { createMockImage } from "../../../test/canvas-composer-test-helpers";
import { renderFrame, FRAME_SHOT_COUNT } from "./renderFrame";

vi.mock("./filmstrip", () => ({ composeFilmstrip: vi.fn(async () => "filmstrip-canvas") }));
vi.mock("./polaroid", () => ({ composePolaroid: vi.fn(async () => "polaroid-canvas") }));
vi.mock("./strip3", () => ({ composeStrip3: vi.fn(async () => "strip3-canvas") }));
vi.mock("./cinema", () => ({ composeCinema: vi.fn(async () => "cinema-canvas") }));

import { composeFilmstrip } from "./filmstrip";
import { composePolaroid } from "./polaroid";
import { composeStrip3 } from "./strip3";
import { composeCinema } from "./cinema";

const META = { name: "9th Ave @ 42 St", area: "Manhattan", caption: "midtown" };

describe("renderFrame", () => {
  it("repeats the image to fill multi-shot frames", () => {
    expect(FRAME_SHOT_COUNT).toEqual({ filmstrip: 4, polaroid: 1, strip3: 3, cinema: 1 });
  });

  it("routes filmstrip to composeFilmstrip with a 4-element array", async () => {
    const img = createMockImage(1600, 900);
    const result = await renderFrame(img, "filmstrip", META);
    expect(result).toBe("filmstrip-canvas");
    const [shots, name, area] = vi.mocked(composeFilmstrip).mock.calls[0];
    expect(shots).toHaveLength(4);
    expect(shots.every((s) => s === img)).toBe(true);
    expect(name).toBe(META.name);
    expect(area).toBe(META.area);
  });

  it("routes polaroid to composePolaroid with the caption", async () => {
    const img = createMockImage(1600, 900);
    await renderFrame(img, "polaroid", META);
    expect(composePolaroid).toHaveBeenCalledWith(img, "midtown", META.name);
  });

  it("routes strip3 with a 3-element array", async () => {
    const img = createMockImage(1600, 900);
    await renderFrame(img, "strip3", META);
    const [shots] = vi.mocked(composeStrip3).mock.calls[0];
    expect(shots).toHaveLength(3);
  });

  it("routes cinema to composeCinema", async () => {
    const img = createMockImage(1600, 900);
    await renderFrame(img, "cinema", META);
    expect(composeCinema).toHaveBeenCalledWith(img, META.name, META.area, {});
  });
});
