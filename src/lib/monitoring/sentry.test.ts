import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { captureExceptionMock, captureMessageMock, withScopeMock, flushMock } = vi.hoisted(() => ({
  captureExceptionMock: vi.fn(() => "mock-event-id"),
  captureMessageMock: vi.fn(() => "mock-message-event-id"),
  withScopeMock: vi.fn((callback: (scope: unknown) => void) => {
    callback({
      setTag: vi.fn(),
      setLevel: vi.fn(),
      setExtras: vi.fn(),
    });
  }),
  flushMock: vi.fn(async () => true),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: captureExceptionMock,
  captureMessage: captureMessageMock,
  withScope: withScopeMock,
  flush: flushMock,
}));

describe("normalizeError", () => {
  let normalizeError: typeof import("./sentry").normalizeError;

  beforeEach(async () => {
    ({ normalizeError } = await import("./sentry"));
  });

  it("passes an existing Error through unchanged", () => {
    const error = new Error("boom");
    expect(normalizeError(error)).toBe(error);
  });

  it("wraps a DOM Event into a titled Error, preserving it as the cause", () => {
    const event = new Event("error");
    const result = normalizeError(event);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("Non-Error captured: Event");
    expect(result.cause).toBe(event);
  });

  it("wraps a message-shaped object (e.g. a fetch/Response-style error) into a titled Error", () => {
    const shaped = { message: "upstream failed", code: "UPSTREAM_502" };
    const result = normalizeError(shaped);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("upstream failed");
    expect(result.cause).toBe(shaped);
  });

  it("wraps a bare string into an Error", () => {
    const result = normalizeError("something broke");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("something broke");
  });

  it("wraps undefined into a titled Error", () => {
    const result = normalizeError(undefined);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("Non-Error value captured");
  });
});

describe("captureAppError", () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_SENTRY;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_ENABLE_SENTRY;
    else process.env.NEXT_PUBLIC_ENABLE_SENTRY = originalEnv;
  });

  it("is a no-op and returns undefined when Sentry is disabled", async () => {
    delete process.env.NEXT_PUBLIC_ENABLE_SENTRY;
    const { captureAppError } = await import("./sentry");

    const result = await captureAppError(new Error("boom"));

    expect(result).toBeUndefined();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("captures a normalized error and flushes when Sentry is enabled", async () => {
    process.env.NEXT_PUBLIC_ENABLE_SENTRY = "true";
    const { captureAppError } = await import("./sentry");

    const eventId = await captureAppError(new Error("boom"), { route: "/api/coverage-gap" });

    expect(eventId).toBe("mock-event-id");
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(flushMock).toHaveBeenCalledTimes(1);
  });
});

describe("captureAppWarning", () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_SENTRY;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_ENABLE_SENTRY;
    else process.env.NEXT_PUBLIC_ENABLE_SENTRY = originalEnv;
  });

  it("is a no-op when Sentry is disabled", async () => {
    delete process.env.NEXT_PUBLIC_ENABLE_SENTRY;
    const { captureAppWarning } = await import("./sentry");

    await captureAppWarning("upstream degraded");

    expect(captureMessageMock).not.toHaveBeenCalled();
  });

  it("captures a warning message when Sentry is enabled", async () => {
    process.env.NEXT_PUBLIC_ENABLE_SENTRY = "true";
    const { captureAppWarning } = await import("./sentry");

    await captureAppWarning("upstream degraded", { status: 502 });

    expect(captureMessageMock).toHaveBeenCalledTimes(1);
  });

  it("flushes on the server so the warning isn't dropped when the lambda freezes after the response", async () => {
    process.env.NEXT_PUBLIC_ENABLE_SENTRY = "true";
    const { captureAppWarning } = await import("./sentry");

    await captureAppWarning("upstream degraded");

    expect(flushMock).toHaveBeenCalledTimes(1);
  });
});
