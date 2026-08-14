import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSentryInit = vi.fn();
const mockGetMonitoringPublicConfig = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  init: mockSentryInit,
  captureRouterTransitionStart: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  consoleLoggingIntegration: vi.fn(() => ({})),
}));

vi.mock("@/lib/monitoring/config", () => ({
  getMonitoringPublicConfig: mockGetMonitoringPublicConfig,
}));

describe("instrumentation-client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not initialize Sentry when the feature flag is disabled", async () => {
    mockGetMonitoringPublicConfig.mockReturnValue({
      enableSentry: false,
      environment: "development",
    });
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://example@o0.ingest.sentry.io/0");

    await import("./instrumentation-client");

    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it("does not initialize Sentry when no DSN is configured, even if enabled", async () => {
    mockGetMonitoringPublicConfig.mockReturnValue({
      enableSentry: true,
      environment: "production",
    });
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", undefined);

    await import("./instrumentation-client");

    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it("initializes Sentry when enabled and a DSN is present", async () => {
    mockGetMonitoringPublicConfig.mockReturnValue({
      enableSentry: true,
      environment: "production",
    });
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://example@o0.ingest.sentry.io/0");

    await import("./instrumentation-client");

    expect(mockSentryInit).toHaveBeenCalledTimes(1);
    expect(mockSentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://example@o0.ingest.sentry.io/0",
        environment: "production",
      })
    );
  });
});
