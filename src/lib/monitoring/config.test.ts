import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getMonitoringPublicConfig, resolveMonitoringEnvironment } from "./config";

const ENV_KEYS = [
  "NEXT_PUBLIC_APP_ENV",
  "VERCEL_ENV",
  "NODE_ENV",
  "NEXT_PUBLIC_ENABLE_SENTRY",
] as const;

describe("resolveMonitoringEnvironment", () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("prefers NEXT_PUBLIC_APP_ENV over VERCEL_ENV and NODE_ENV", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "preview";
    process.env.VERCEL_ENV = "production";
    process.env.NODE_ENV = "production";

    expect(resolveMonitoringEnvironment()).toBe("preview");
  });

  it("falls back to VERCEL_ENV when NEXT_PUBLIC_APP_ENV is unset", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.NODE_ENV = "production";

    expect(resolveMonitoringEnvironment()).toBe("preview");
  });

  it("ignores an invalid NEXT_PUBLIC_APP_ENV value and falls through to VERCEL_ENV", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "staging";
    process.env.VERCEL_ENV = "production";

    expect(resolveMonitoringEnvironment()).toBe("production");
  });

  it("falls back to production when NODE_ENV is production and nothing else is set", () => {
    process.env.NODE_ENV = "production";

    expect(resolveMonitoringEnvironment()).toBe("production");
  });

  it("defaults to development when nothing is set", () => {
    expect(resolveMonitoringEnvironment()).toBe("development");
  });
});

describe("getMonitoringPublicConfig", () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("defaults enableSentry to false when the flag is unset", () => {
    expect(getMonitoringPublicConfig().enableSentry).toBe(false);
  });

  it("enables Sentry only when the flag is exactly 'true'", () => {
    process.env.NEXT_PUBLIC_ENABLE_SENTRY = "true";
    expect(getMonitoringPublicConfig().enableSentry).toBe(true);
  });

  it("treats any non-'true' flag value as disabled", () => {
    process.env.NEXT_PUBLIC_ENABLE_SENTRY = "yes";
    expect(getMonitoringPublicConfig().enableSentry).toBe(false);
  });

  it("includes the resolved environment in the returned config", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "preview";
    expect(getMonitoringPublicConfig().environment).toBe("preview");
  });
});
