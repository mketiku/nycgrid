import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  trackSelfie,
  trackGifExport,
  trackCameraView,
  trackAmbientHeartbeat,
  readSessionStats,
} from "./session";

function makeStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}

describe("session analytics", () => {
  beforeEach(() => {
    const ls = makeStorage();
    const ss = makeStorage();
    vi.stubGlobal("localStorage", ls);
    vi.stubGlobal("sessionStorage", ss);
  });

  describe("trackSelfie", () => {
    it("increments selfies counter from zero", () => {
      trackSelfie();
      expect(readSessionStats().selfiesTaken).toBe(1);
    });

    it("accumulates across multiple calls", () => {
      trackSelfie();
      trackSelfie();
      trackSelfie();
      expect(readSessionStats().selfiesTaken).toBe(3);
    });
  });

  describe("trackGifExport", () => {
    it("increments gifs counter", () => {
      trackGifExport();
      trackGifExport();
      expect(readSessionStats().gifsExported).toBe(2);
    });
  });

  describe("trackCameraView", () => {
    it("increments camerasViewedTotal for a new camera", () => {
      trackCameraView("cam-1", "Manhattan");
      expect(readSessionStats().camerasViewedTotal).toBe(1);
    });

    it("does not double-count the same camera", () => {
      trackCameraView("cam-1", "Manhattan");
      trackCameraView("cam-1", "Manhattan");
      expect(readSessionStats().camerasViewedTotal).toBe(1);
    });

    it("counts distinct cameras independently", () => {
      trackCameraView("cam-1", "Manhattan");
      trackCameraView("cam-2", "Brooklyn");
      expect(readSessionStats().camerasViewedTotal).toBe(2);
    });

    it("sets favorite borough to the area visited most", () => {
      trackCameraView("cam-1", "Manhattan");
      trackCameraView("cam-2", "Brooklyn");
      trackCameraView("cam-3", "Brooklyn");
      const stats = readSessionStats();
      expect(stats.favoriteBorough).toBe("Brooklyn");
      expect(stats.favoriteBoroughCount).toBe(2);
    });

    it("tracks cameras this session via sessionStorage", () => {
      trackCameraView("cam-1", "Queens");
      trackCameraView("cam-2", "Queens");
      expect(readSessionStats().camerasThisSession).toBe(2);
    });

    it("does not double-count same camera in session", () => {
      trackCameraView("cam-1", "Queens");
      trackCameraView("cam-1", "Queens");
      expect(readSessionStats().camerasThisSession).toBe(1);
    });
  });

  describe("trackAmbientHeartbeat", () => {
    it("accumulates seconds", () => {
      trackAmbientHeartbeat(60);
      trackAmbientHeartbeat(60);
      expect(readSessionStats().ambientSeconds).toBe(120);
    });
  });

  describe("readSessionStats", () => {
    it("returns all zeros when storage is empty", () => {
      const stats = readSessionStats();
      expect(stats.selfiesTaken).toBe(0);
      expect(stats.gifsExported).toBe(0);
      expect(stats.camerasViewedTotal).toBe(0);
      expect(stats.camerasThisSession).toBe(0);
      expect(stats.ambientSeconds).toBe(0);
      expect(stats.favoriteBorough).toBeNull();
      expect(stats.favoriteBoroughCount).toBe(0);
    });

    it("returns EMPTY_STATS when localStorage is undefined", () => {
      vi.stubGlobal("localStorage", undefined);
      const stats = readSessionStats();
      expect(stats.selfiesTaken).toBe(0);
      expect(stats.favoriteBorough).toBeNull();
    });

    it("handles storage access errors gracefully", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => {
          throw new Error("Blocked");
        },
        setItem: () => {
          throw new Error("Blocked");
        },
      });
      // Should not throw
      trackSelfie();
      trackAmbientHeartbeat(10);
      const stats = readSessionStats();
      expect(stats.selfiesTaken).toBe(0);
    });

    it("handles malformed JSON in storage", () => {
      localStorage.setItem("nycgrid-stats-camera-ids", "not-json");
      localStorage.setItem("nycgrid-stats-boroughs", "[1, 2, 3]"); // Wrong type (should be object)
      const stats = readSessionStats();
      expect(stats.camerasViewedTotal).toBe(0);
      expect(stats.favoriteBorough).toBeNull();
    });
  });
});
