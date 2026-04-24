import { describe, expect, it } from "vitest";
import { buildSensitiveUrl, ensureAllowedHttpsUrl } from "./url";

describe("security url helpers", () => {
  it("redacts sensitive query params while preserving the request url", () => {
    const { url, redacted } = buildSensitiveUrl("https://api.example.com/resource", {
      api_key: "secret-value",
      agency: "MTA",
    });

    expect(url.toString()).toBe("https://api.example.com/resource?api_key=secret-value&agency=MTA");
    expect(redacted).toBe("https://api.example.com/resource?api_key=%5BREDACTED%5D&agency=MTA");
  });

  it("accepts only allowed https hosts", () => {
    const allowed = ensureAllowedHttpsUrl("https://api.weather.gov/gridpoints/OKX/33,35/forecast", [
      "api.weather.gov",
    ]);
    expect(allowed).not.toBeNull();
    const wrongHost = ensureAllowedHttpsUrl("https://evil.example.com/forecast", [
      "api.weather.gov",
    ]);
    const wrongProtocol = ensureAllowedHttpsUrl("http://api.weather.gov/forecast", [
      "api.weather.gov",
    ]);
    expect(wrongHost).toBeNull();
    expect(wrongProtocol).toBeNull();
    expect(ensureAllowedHttpsUrl("not-a-url", [])).toBeNull();
  });

  it("handles undefined params in buildSensitiveUrl", () => {
    const { url } = buildSensitiveUrl("https://example.com", {
      q: "test",
      missing: undefined,
      token: "123",
      secret: "abc",
      password: "pass",
    });
    expect(url.searchParams.has("missing")).toBe(false);
    expect(url.searchParams.get("q")).toBe("test");
  });
});
