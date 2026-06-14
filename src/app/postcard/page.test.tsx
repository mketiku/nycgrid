// src/app/postcard/page.test.tsx
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/context/lib/fetch-weather", () => ({
  fetchWeather: vi.fn(async () => ({ temperature: 48, description: "Overcast", isDaytime: false })),
}));

import { generateMetadata } from "./page";
import { dayKey, selectDailyCamera } from "@/lib/postcard/select";
import { FEATURED_CAMERAS } from "@/features/context/lib/featured-cameras";

describe("/postcard generateMetadata", () => {
  it("includes today's camera name in the title", async () => {
    const today = selectDailyCamera(dayKey(new Date()), FEATURED_CAMERAS);
    const meta = await generateMetadata();
    expect(String(meta.title)).toContain(today.displayName);
  });
});
