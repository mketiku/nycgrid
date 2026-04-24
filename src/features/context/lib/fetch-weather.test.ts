import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWeather } from "./fetch-weather";

describe("fetchWeather", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns weather data when API calls succeed", async () => {
    const mockPoints = {
      properties: { forecast: "https://api.weather.gov/gridpoints/ABC/123/forecast" },
    };
    const mockForecast = {
      properties: {
        periods: [{ temperature: 72, shortForecast: "Sunny", isDaytime: true }],
      },
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockPoints } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockForecast } as Response);

    const data = await fetchWeather(40.7128, -74.006);
    expect(data?.temperature).toBe(72);
    expect(data?.description).toBe("Sunny");
    expect(data?.isDaytime).toBe(true);
  });

  it("returns null when points API fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const data = await fetchWeather(40.7128, -74.006);
    expect(data).toBeNull();
  });

  it("returns null when forecast API fails", async () => {
    const mockPoints = {
      properties: { forecast: "https://api.weather.gov/gridpoints/ABC/123/forecast" },
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockPoints } as Response)
      .mockResolvedValueOnce({ ok: false } as Response);

    const data = await fetchWeather(40.7128, -74.006);
    expect(data).toBeNull();
  });

  it("returns null on fetch throw", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network"));
    const data = await fetchWeather(40.7, -74.0);
    expect(data).toBeNull();
  });

  it("returns null if forecast URL is missing", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ properties: {} }),
    } as Response);
    const data = await fetchWeather(40.7, -74.0);
    expect(data).toBeNull();
  });

  it("returns null if no forecast periods are available", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ properties: { forecast: "http://api.weather.gov/forecast" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ properties: { periods: [] } }),
      } as Response);
    const data = await fetchWeather(40.7, -74.0);
    expect(data).toBeNull();
  });

  it("returns null when the forecast url points to a non-allowlisted host", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ properties: { forecast: "https://evil.example.com/forecast" } }),
    } as Response);

    const data = await fetchWeather(40.7, -74.0);
    expect(data).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("passes an AbortSignal to each fetch to enforce the timeout", async () => {
    const mockPoints = {
      properties: { forecast: "https://api.weather.gov/gridpoints/ABC/123/forecast" },
    };
    const mockForecast = {
      properties: {
        periods: [{ temperature: 72, shortForecast: "Sunny", isDaytime: true }],
      },
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockPoints } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockForecast } as Response);

    await fetchWeather(40.7128, -74.006);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    // Second call uses a URL object (returned by ensureAllowedHttpsUrl)
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.any(URL),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("returns null when a fetch times out", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException("signal timed out", "TimeoutError"));
    const data = await fetchWeather(40.7128, -74.006);
    expect(data).toBeNull();
  });
});
