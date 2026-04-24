import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePodcast } from "./usePodcast";
import * as speech from "@/lib/podcast/speech";

let lastOnDone: () => void = () => {};

vi.mock("@/lib/podcast/speech", () => ({
  speakLines: vi.fn((lines, onDone) => {
    lastOnDone = onDone;
    return vi.fn();
  }),
  cancelSpeech: vi.fn(),
  initVoices: vi.fn(),
}));

describe("usePodcast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Reset Zustand store state
    act(() => {
      usePodcast.setState({
        isPlaying: false,
        channel: "daily-honk",
        camera: null,
        _cancelFn: null,
      });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts playing and calls speech functions", () => {
    const { result } = renderHook(() => usePodcast());

    act(() => {
      result.current.play();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(speech.initVoices).toHaveBeenCalled();
    expect(speech.speakLines).toHaveBeenCalled();
  });

  it("pauses and cancels speech", () => {
    const { result } = renderHook(() => usePodcast());

    act(() => {
      result.current.play();
      result.current.pause();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(speech.cancelSpeech).toHaveBeenCalled();
  });

  it("switches channels and continues playing if it was playing", () => {
    const { result } = renderHook(() => usePodcast());

    act(() => {
      result.current.play();
    });

    expect(result.current.channel).toBe("daily-honk");

    act(() => {
      result.current.switchChannel("daily-honk");
    });

    expect(result.current.channel).toBe("daily-honk");
    expect(result.current.isPlaying).toBe(true);
    expect(speech.speakLines).toHaveBeenCalledTimes(2);
  });

  it("loops to the next line after a delay", () => {
    const { result } = renderHook(() => usePodcast());

    act(() => {
      result.current.play();
    });

    // Initial speakLines called
    expect(speech.speakLines).toHaveBeenCalledTimes(1);

    // Manually trigger onDone
    act(() => {
      lastOnDone();
    });

    // Fast-forward through the delay in startLoop
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should have called speakLines again for the next loop
    expect(speech.speakLines).toHaveBeenCalledTimes(2);
  });

  it("sets camera context", () => {
    const { result } = renderHook(() => usePodcast());
    const mockCamera = {
      name: "Test",
      borough: "Queens",
      isOnline: true,
      timeOfDay: "night" as const,
    };

    act(() => {
      result.current.setCamera(mockCamera);
    });

    expect(result.current.camera).toEqual(mockCamera);
  });

  it("does nothing when play is called while already playing", () => {
    const { result } = renderHook(() => usePodcast());
    act(() => {
      result.current.play();
    });
    const firstCallCount = vi.mocked(speech.speakLines).mock.calls.length;
    act(() => {
      result.current.play();
    });
    expect(vi.mocked(speech.speakLines).mock.calls.length).toBe(firstCallCount);
  });

  it("switches channel without starting loop when not playing", () => {
    const { result } = renderHook(() => usePodcast());
    act(() => {
      result.current.switchChannel("daily-honk");
    });
    expect(result.current.channel).toBe("daily-honk");
    expect(speech.speakLines).not.toHaveBeenCalled();
  });
});
