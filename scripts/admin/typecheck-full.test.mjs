import { describe, it, expect, vi } from "vitest";
import { generateBuildInfoPath, runTypecheck } from "./typecheck-full.mjs";

describe("typecheck-full", () => {
  describe("generateBuildInfoPath", () => {
    it("generates a path in tmpdir", () => {
      const path = generateBuildInfoPath("test");
      expect(path).toContain("typecheck-test.tsbuildinfo");
    });
  });

  describe("runTypecheck", () => {
    it("runs tsc and exits with status", () => {
      const spawnSync = vi.fn().mockReturnValue({ status: 0 });
      const rmSync = vi.fn();
      const exit = vi.fn();
      const generatePath = () => "/tmp/test.tsbuildinfo";
      const tscBin = "/fake/tsc";

      runTypecheck({ spawnSync, rmSync, exit, generatePath, tscBin });

      expect(spawnSync).toHaveBeenCalledWith(
        "/fake/tsc",
        ["--noEmit", "--tsBuildInfoFile", "/tmp/test.tsbuildinfo"],
        { stdio: "inherit" }
      );
      expect(rmSync).toHaveBeenCalledWith("/tmp/test.tsbuildinfo", { force: true });
      expect(exit).toHaveBeenCalledWith(0);
    });

    it("exits with 1 if status is null", () => {
      const spawnSync = vi.fn().mockReturnValue({ status: null });
      const rmSync = vi.fn();
      const exit = vi.fn();

      runTypecheck({ spawnSync, rmSync, exit });

      expect(exit).toHaveBeenCalledWith(1);
    });
  });
});
