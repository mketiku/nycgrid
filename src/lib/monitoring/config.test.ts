import { afterEach, describe, expect, it, vi } from "vitest";
import { getMonitoringPublicConfig, resolveMonitoringEnvironment } from "./config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveMonitoringEnvironment", () => {
  it("prefers NEXT_PUBLIC_APP_ENV over VERCEL_ENV and NODE_ENV", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "preview");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");

    expect(resolveMonitoringEnvironment()).toBe("preview");
  });

  it("falls back to VERCEL_ENV when NEXT_PUBLIC_APP_ENV is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", undefined);
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NODE_ENV", "production");

    expect(resolveMonitoringEnvironment()).toBe("preview");
  });

  it("ignores an invalid NEXT_PUBLIC_APP_ENV value and falls through to VERCEL_ENV", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging");
    vi.stubEnv("VERCEL_ENV", "production");

    expect(resolveMonitoringEnvironment()).toBe("production");
  });

  it("falls back to production when NODE_ENV is production and nothing else is set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", undefined);
    vi.stubEnv("VERCEL_ENV", undefined);
    vi.stubEnv("NODE_ENV", "production");

    expect(resolveMonitoringEnvironment()).toBe("production");
  });

  it("defaults to development when nothing is set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", undefined);
    vi.stubEnv("VERCEL_ENV", undefined);
    vi.stubEnv("NODE_ENV", undefined);

    expect(resolveMonitoringEnvironment()).toBe("development");
  });
});

describe("getMonitoringPublicConfig", () => {
  it("defaults enableSentry to false when the flag is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SENTRY", undefined);
    expect(getMonitoringPublicConfig().enableSentry).toBe(false);
  });

  it("enables Sentry only when the flag is exactly 'true'", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SENTRY", "true");
    expect(getMonitoringPublicConfig().enableSentry).toBe(true);
  });

  it("treats any non-'true' flag value as disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_SENTRY", "yes");
    expect(getMonitoringPublicConfig().enableSentry).toBe(false);
  });

  it("includes the resolved environment in the returned config", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "preview");
    expect(getMonitoringPublicConfig().environment).toBe("preview");
  });
});
