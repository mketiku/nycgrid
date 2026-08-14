import * as Sentry from "@sentry/nextjs";
import { getMonitoringPublicConfig } from "@/lib/monitoring/config";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const { enableSentry, environment } = getMonitoringPublicConfig();

if (enableSentry && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment,
    release: `${process.env.NEXT_PUBLIC_APP_VERSION}+${process.env.NEXT_PUBLIC_APP_BUILD_SHA}`,

    tracesSampleRate: process.env.CI || environment === "development" ? 0 : 0.1,

    denyUrls: [/extensions\//i, /^chrome-extension:\/\//i, /^moz-extension:\/\//i],

    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "NetworkError when attempting to fetch resource",
      "Non-Error promise rejection captured",
    ],

    maxBreadcrumbs: 50,
    attachStacktrace: true,
    debug: environment !== "production",

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
    ],
  });
}
