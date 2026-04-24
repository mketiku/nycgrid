import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAmbientAudio } from "./useAmbientAudio";

function createMockAudioContext() {
  const gainNode = {
    gain: { value: 0, setTargetAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  return {
    currentTime: 10,
    sampleRate: 44100,
    destination: {},
    createGain: vi.fn(() => ({ ...gainNode, gain: { ...gainNode.gain } })),
    createBiquadFilter: vi.fn(() => ({
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(),
    })),
    createBuffer: vi.fn(() => ({
      getChannelData: vi.fn(() => new Float32Array(100)),
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
    })),
  } as unknown as AudioContext;
}

describe("useAmbientAudio", () => {
  it("initializes and returns controls", () => {
    const mockCtx = createMockAudioContext();
    const { result } = renderHook(() => useAmbientAudio(mockCtx));
    expect(result.current.isMuted).toBe(true);
    expect(result.current.toggleMute).toBeDefined();
    expect(result.current.updateScene).toBeDefined();
  });

  it("toggles mute", () => {
    const mockCtx = createMockAudioContext();
    const { result } = renderHook(() => useAmbientAudio(mockCtx));
    act(() => {
      result.current.toggleMute();
    });
    expect(result.current.isMuted).toBe(false);
  });

  it("updates scene parameters", () => {
    const mockCtx = createMockAudioContext();
    const { result } = renderHook(() => useAmbientAudio(mockCtx));
    act(() => {
      result.current.updateScene({
        area: "Manhattan",
        tags: ["tunnel"],
        hour: 8, // Rush hour
      });
    });
    // The master gain and layer gains should have been created
    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it("silences the audio", () => {
    const mockCtx = createMockAudioContext();
    const { result } = renderHook(() => useAmbientAudio(mockCtx));
    act(() => {
      result.current.silence();
    });
    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it("calculates different traffic multipliers based on the hour of day", () => {
    const mockCtx = createMockAudioContext();
    const { result } = renderHook(() => useAmbientAudio(mockCtx));

    act(() => {
      // Rush hour
      result.current.updateScene({ area: "Manhattan", tags: [], hour: 8 });
      // Normal hour
      result.current.updateScene({ area: "Manhattan", tags: [], hour: 12 });
      // Late night
      result.current.updateScene({ area: "Manhattan", tags: [], hour: 2 });
    });

    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it("handles rainy and snowy weather", () => {
    const mockCtx = createMockAudioContext();
    const { result } = renderHook(() => useAmbientAudio(mockCtx));

    act(() => {
      // Rainy
      result.current.updateScene({ area: "Brooklyn", tags: [], hour: 12, weatherCode: 51 });
      // Snowy
      result.current.updateScene({ area: "Bronx", tags: [], hour: 12, weatherCode: 71 });
    });

    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it("handles specialized tags like park, beach, and waterfront", () => {
    const mockCtx = createMockAudioContext();
    const { result } = renderHook(() => useAmbientAudio(mockCtx));

    act(() => {
      result.current.updateScene({ area: "Queens", tags: ["park"], hour: 12 });
      result.current.updateScene({ area: "Staten Island", tags: ["beach"], hour: 12 });
      result.current.updateScene({ area: "Manhattan", tags: ["waterfront"], hour: 12 });
    });

    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it("handles brown noise buffer generation", () => {
    const mockCtx = createMockAudioContext();
    renderHook(() => useAmbientAudio(mockCtx));
    // trafficGainRef uses "brown" noise
    expect(mockCtx.createBuffer).toHaveBeenCalled();
  });
});
