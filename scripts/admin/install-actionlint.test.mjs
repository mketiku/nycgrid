import { describe, it, expect, vi } from "vitest";
import { getDownloadUrl, install, runCli } from "./install-actionlint.mjs";

describe("install-actionlint", () => {
  describe("getDownloadUrl", () => {
    it("returns correct URL for macOS arm64", () => {
      const url = getDownloadUrl("1.7.0", "darwin", "arm64");
      expect(url).toBe("https://github.com/rhysd/actionlint/releases/download/v1.7.0/actionlint_1.7.0_darwin_arm64.tar.gz");
    });

    it("returns correct URL for Linux x64", () => {
      const url = getDownloadUrl("1.7.0", "linux", "x64");
      expect(url).toBe("https://github.com/rhysd/actionlint/releases/download/v1.7.0/actionlint_1.7.0_linux_amd64.tar.gz");
    });

    it("returns null for unsupported platform", () => {
      const url = getDownloadUrl("1.7.0", "win32", "x64");
      expect(url).toBeNull();
    });

    it("returns null for unsupported arch", () => {
      const url = getDownloadUrl("1.7.0", "linux", "ia32");
      expect(url).toBeNull();
    });
  });

  describe("install", () => {
    it("exits 0 if CI environment is detected", async () => {
      const exit = vi.fn();
      await install({ env: { CI: "true" }, exit });
      expect(exit).toHaveBeenCalledWith(0);
    });

    it("exits 0 if target already exists", async () => {
      const exit = vi.fn();
      const fs = {
        existsSync: vi.fn().mockReturnValue(true),
      };
      const urlHelper = { fileURLToPath: vi.fn().mockReturnValue("/root/scripts/admin/file.mjs") };
      await install({ fs, exit, urlHelper, env: {} });
      expect(exit).toHaveBeenCalledWith(0);
    });

    it("successfully installs actionlint", async () => {
      const log = vi.fn();
      const exit = vi.fn();
      const fs = {
        existsSync: vi.fn().mockReturnValue(false),
        mkdtempSync: vi.fn().mockReturnValue("/tmp/work"),
        mkdirSync: vi.fn(),
        renameSync: vi.fn(),
        chmodSync: vi.fn(),
        rmSync: vi.fn(),
      };
      const fetch = vi.fn().mockResolvedValue({
        json: async () => ({ tag_name: "v1.7.0" }),
      });
      const spawnSync = vi.fn().mockReturnValue({ status: 0 });
      const urlHelper = { fileURLToPath: vi.fn().mockReturnValue("/root/scripts/admin/file.mjs") };
      const os = { platform: () => "darwin", arch: () => "arm64" };

      await install({ log, exit, fs, fetch, spawnSync, urlHelper, os, env: {} });

      expect(log).toHaveBeenCalledWith(expect.stringContaining("installed actionlint v1.7.0"));
      expect(fs.renameSync).toHaveBeenCalled();
      expect(fs.chmodSync).toHaveBeenCalled();
    });

    it("warns and exits 0 if platform is unsupported", async () => {
      const warn = vi.fn();
      const exit = vi.fn();
      const fs = {
        existsSync: vi.fn().mockReturnValue(false),
      };
      const fetch = vi.fn().mockResolvedValue({
        json: async () => ({ tag_name: "v1.7.0" }),
      });
      const urlHelper = { fileURLToPath: vi.fn().mockReturnValue("/root/scripts/admin/file.mjs") };
      const os = { platform: () => "win32", arch: () => "x64" };

      await install({ warn, exit, fs, fetch, urlHelper, os, env: {} });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Unsupported platform"));
      expect(exit).toHaveBeenCalledWith(0);
    });

    it("warns and exits 0 if download fails", async () => {
      const warn = vi.fn();
      const exit = vi.fn();
      const fs = {
        existsSync: vi.fn().mockReturnValue(false),
        mkdtempSync: vi.fn().mockReturnValue("/tmp/work"),
        rmSync: vi.fn(),
      };
      const fetch = vi.fn().mockResolvedValue({
        json: async () => ({ tag_name: "v1.7.0" }),
      });
      const spawnSync = vi.fn().mockReturnValue({ status: 1 });
      const urlHelper = { fileURLToPath: vi.fn().mockReturnValue("/root/scripts/admin/file.mjs") };
      const os = { platform: () => "darwin", arch: () => "arm64" };

      await install({ warn, exit, fs, fetch, spawnSync, urlHelper, os, env: {} });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Download failed"));
      expect(exit).toHaveBeenCalledWith(0);
    });

    it("does not have error parameter in install signature", () => {
      const installString = install.toString();
      expect(installString).not.toContain("error = console.error");
    });
  });

  describe("runCli", () => {
    it("logs error and exits 1 on failure", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
      
      // Force a failure by mocking global fetch to throw
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      try {
        await runCli({ env: {} });
      } catch {
        // Expected
      }

      expect(errorSpy).toHaveBeenCalledWith("[install-actionlint] Fatal:", "Network error");
      expect(exitSpy).toHaveBeenCalledWith(1);

      globalThis.fetch = originalFetch;
      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});
