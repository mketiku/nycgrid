import * as Sentry from "@sentry/nextjs";
import { getMonitoringPublicConfig } from "@/lib/monitoring/config";

const { enableSentry, environment } = getMonitoringPublicConfig();

if (enableSentry && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment,
    release: `${process.env.NEXT_PUBLIC_APP_VERSION}+${process.env.NEXT_PUBLIC_APP_BUILD_SHA}`,
    tracesSampleRate: process.env.CI || environment === "development" ? 0 : 0.1,
    debug: environment !== "production",

    integrations: [Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] })],
  });
}
