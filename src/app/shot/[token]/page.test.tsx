import { describe, expect, it, vi } from "vitest";
import { CAMERAS } from "@/lib/cameras/data";
import { encodeShotToken } from "@/lib/shot/token";
import { generateMetadata } from "./page";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

const cam = CAMERAS[0]!;

describe("/shot/[token] generateMetadata", () => {
  it("builds a title from the camera and sanitized caption", async () => {
    const token = encodeShotToken(cam.id, "cinema", "midtown 3am");
    const meta = await generateMetadata({ params: Promise.resolve({ token }) });
    expect(String(meta.title)).toContain(cam.name);
    expect(String(meta.title)).toContain("midtown 3am");
  });

  it("returns a safe fallback for a bad token", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ token: "not-a-camera.cinema" }),
    });
    expect(meta).toEqual({ title: "nycgrid" });
  });
});
