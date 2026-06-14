import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShareUrl } from "./useShareUrl";

afterEach(() => {
  vi.restoreAllMocks();
  // @ts-expect-error reset between tests
  delete navigator.share;
});

describe("useShareUrl", () => {
  it("uses navigator.share when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true, writable: true });

    const { result } = renderHook(() => useShareUrl("https://nycgrid.test/shot/abc"));
    await act(async () => {
      await result.current.share();
    });

    expect(share).toHaveBeenCalledWith({ url: "https://nycgrid.test/shot/abc" });
  });

  it("falls back to clipboard and sets copied when share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue({ writeText } as unknown as Clipboard);

    const { result } = renderHook(() => useShareUrl("https://nycgrid.test/shot/abc"));
    await act(async () => {
      await result.current.share();
    });

    expect(writeText).toHaveBeenCalledWith("https://nycgrid.test/shot/abc");
    expect(result.current.copied).toBe(true);
  });

  it("falls back to prompt when share and clipboard both fail", async () => {
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue({
      writeText: vi.fn().mockRejectedValue(new Error("no")),
    } as unknown as Clipboard);
    window.prompt = vi.fn().mockReturnValue(null);
    const promptSpy = window.prompt as ReturnType<typeof vi.fn>;

    const { result } = renderHook(() => useShareUrl("https://nycgrid.test/shot/abc"));
    await act(async () => {
      await result.current.share();
    });

    expect(promptSpy).toHaveBeenCalled();
    window.prompt = undefined as unknown as typeof window.prompt;
  });
});
