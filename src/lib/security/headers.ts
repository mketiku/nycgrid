// 'unsafe-inline' is required by Next.js App Router (inline bootstrap scripts).
// Removing it requires per-request nonce middleware — tracked as a follow-up.
// 'unsafe-eval' is added in dev only: React dev mode uses eval() for callstack reconstruction.
// upgrade-insecure-requests is added in prod only: it forces HTTPS and must not be sent on
// localhost — Safari (unlike Chrome/Edge) persists the upgrade and refuses HTTP even for local dev.

export function buildCSP(isProd: boolean): string {
  const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://webcams.nyctmc.org https://api.maptiler.com https://*.cartocdn.com https://*.basemaps.cartocdn.com https://img.youtube.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.maptiler.com https://*.cartocdn.com https://*.basemaps.cartocdn.com https://tiles.openfreemap.org https://api.open-meteo.com",
    "worker-src blob:",
    "media-src 'self' blob: https://fm939.wnyc.org https://stream.wqxr.org https://cdn.jsdelivr.net/gh/mketiku/nycgrid-assets@v1.3.0/",
    "frame-src 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export const CONTENT_SECURITY_POLICY = buildCSP(!!process.env.VERCEL_ENV);

export const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS must not be sent on localhost — browsers persist it for 2 years and will
  // force HTTPS even on subsequent local dev sessions. VERCEL_ENV is set on all
  // Vercel deployments (production + preview) and undefined locally.
  ...(process.env.VERCEL_ENV
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];
