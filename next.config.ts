import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { SECURITY_HEADERS } from "./src/lib/security/headers";

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));

let buildSha = "unknown";
try {
  buildSha = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
} catch {
  // git not available (e.g. Docker build without .git context)
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_APP_BUILD_SHA: buildSha,
  },
  images: {
    localPatterns: [{ pathname: "/api/camera-image/**" }],
    remotePatterns: [
      { protocol: "https", hostname: "webcams.nyctmc.org", pathname: "/api/cameras/*/image" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppress source map uploading logs during build
  silent: !process.env.CI,

  // Sentry-managed same-origin tunnel; avoids ad blockers intercepting client events.
  tunnelRoute: "/api/sentry-tunnel",

  org: process.env.SENTRY_ORG ?? "mketiku",
  project: process.env.SENTRY_PROJECT ?? "nycgrid",

  // Disable SDK telemetry
  telemetry: false,

  // Only create Sentry releases for production deployments — preview
  // deployments are throwaway and should not pollute the release timeline.
  release: {
    name: `${pkg.version}+${buildSha}`,
    create: process.env.VERCEL_ENV === "production",
  },

  // Include Next.js-internal code and code from dependencies when uploading source maps
  widenClientFileUpload: process.env.VERCEL_ENV === "production",

  // Only upload source maps if Sentry is enabled, and delete them from the
  // build output afterward so they aren't publicly fetchable.
  sourcemaps: {
    disable: process.env.NEXT_PUBLIC_ENABLE_SENTRY !== "true",
    deleteSourcemapsAfterUpload: true,
  },

  webpack: {
    treeshake: { removeDebugLogging: true },
    unstable_sentryWebpackPluginOptions: { applicationKey: "nycgrid" },
  },
});
