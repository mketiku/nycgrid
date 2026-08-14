import type { SeverityLevel } from "@sentry/nextjs";
import { getMonitoringPublicConfig } from "./config";

const SENTRY_FLUSH_TIMEOUT_MS = 2000;

function safeStringify(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * Coerces an arbitrary captured value into a real Error so Sentry can title
 * and group it. Passing raw DOM Events, upstream-API error objects, strings,
 * or null/undefined into captureException yields untitled "Object/Event
 * captured as exception" noise — this funnels every shape into a titled Error.
 */
export function normalizeError(value: unknown): Error {
  if (value instanceof Error) return value;

  if (typeof Event !== "undefined" && value instanceof Event) {
    return new Error(`Non-Error captured: Event (${value.type})`, { cause: value });
  }

  if (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { message?: unknown }).message === "string"
  ) {
    return new Error((value as { message: string }).message, { cause: value });
  }

  if (typeof value === "string") return new Error(value);

  return new Error(`Non-Error value captured: ${safeStringify(value)}`, { cause: value });
}

export interface AppErrorContext {
  route?: string;
  feature?: string;
  level?: SeverityLevel;
  extra?: Record<string, unknown>;
}

export async function captureAppWarning(
  message: string,
  extra?: Record<string, unknown>
): Promise<void> {
  if (!getMonitoringPublicConfig().enableSentry) return;

  const { captureMessage, withScope } = await import("@sentry/nextjs");

  withScope((scope) => {
    scope.setLevel("warning");
    if (extra) scope.setExtras(extra);
    captureMessage(message);
  });
}

export async function captureAppError(
  error: unknown,
  context: AppErrorContext = {}
): Promise<string | undefined> {
  if (!getMonitoringPublicConfig().enableSentry) return undefined;

  const { captureException, withScope, flush } = await import("@sentry/nextjs");

  let eventId: string | undefined;
  withScope((scope) => {
    if (context.route) scope.setTag("route", context.route);
    if (context.feature) scope.setTag("feature", context.feature);
    if (context.level) scope.setLevel(context.level);
    if (context.extra) scope.setExtras(context.extra);

    eventId = captureException(normalizeError(error));
  });

  // Only flush on the server — Vercel freezes the lambda after the response.
  // In the browser the SDK sends via sendBeacon and does not need manual flushing.
  if (typeof window === "undefined") {
    await flush(SENTRY_FLUSH_TIMEOUT_MS);
  }

  return eventId;
}
