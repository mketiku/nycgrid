import { describe, it, expect } from "vitest";
import { classifyCameraType } from "@/lib/cameras/classify";

describe("classifyCameraType", () => {
  it("correctly identifies bridges from camera names", () => {
    expect(classifyCameraType("BROOKLYN BRIDGE")).toBe("bridge");
    expect(classifyCameraType("WBB - Williamsburg Bridge")).toBe("bridge");
    expect(classifyCameraType("MHB-01")).toBe("bridge");
    expect(classifyCameraType("TRIBORO BRIDGE")).toBe("bridge");
    expect(classifyCameraType("BB-01")).toBe("bridge");
  });

  it("correctly identifies tunnels from camera names", () => {
    expect(classifyCameraType("LINCOLN TUNNEL")).toBe("tunnel");
    expect(classifyCameraType("HOLLAND TUNNEL")).toBe("tunnel");
    expect(classifyCameraType("DYER AVE")).toBe("tunnel");
    expect(classifyCameraType("QMT Entrance")).toBe("tunnel");
  });

  it("correctly identifies highways/expressways/parkways", () => {
    expect(classifyCameraType("BQE at Broadway")).toBe("highway");
    expect(classifyCameraType("FDR Drive at 42nd St")).toBe("highway");
    expect(classifyCameraType("LIE at Exit 30")).toBe("highway");
    expect(classifyCameraType("GCP at Utopia Pkwy")).toBe("highway");
    expect(classifyCameraType("HENRY HUDSON PKWY")).toBe("highway");
    expect(classifyCameraType("CROSS BRONX EXPY")).toBe("highway");
    expect(classifyCameraType("JACKIE ROBINSON PKWY")).toBe("highway");
  });

  it("defaults to street for other locations", () => {
    expect(classifyCameraType("5th Ave at 42nd St")).toBe("street");
    expect(classifyCameraType("Broadway & Wall St")).toBe("street");
    expect(classifyCameraType("Somewhere in Queens")).toBe("street");
  });
});
