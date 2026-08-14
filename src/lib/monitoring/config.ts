export type MonitoringEnvironment = "development" | "preview" | "production";

export interface MonitoringPublicConfig {
  environment: MonitoringEnvironment;
  enableSentry: boolean;
}

const VALID_ENVIRONMENTS = new Set<MonitoringEnvironment>(["development", "preview", "production"]);

function toMonitoringEnv(value: string | undefined): MonitoringEnvironment | undefined {
  const trimmed = value?.trim() as MonitoringEnvironment | undefined;
  return trimmed && VALID_ENVIRONMENTS.has(trimmed) ? trimmed : undefined;
}

export function resolveMonitoringEnvironment(): MonitoringEnvironment {
  return (
    toMonitoringEnv(process.env.NEXT_PUBLIC_APP_ENV) ??
    toMonitoringEnv(process.env.VERCEL_ENV) ??
    (process.env.NODE_ENV === "production" ? "production" : "development")
  );
}

export function getMonitoringPublicConfig(): MonitoringPublicConfig {
  return {
    environment: resolveMonitoringEnvironment(),
    enableSentry: process.env.NEXT_PUBLIC_ENABLE_SENTRY === "true",
  };
}
