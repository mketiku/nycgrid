interface SensitiveUrlResult {
  url: URL;
  redacted: string;
}

export function buildSensitiveUrl(
  base: string,
  params: Record<string, string | number | boolean | undefined>
): SensitiveUrlResult {
  const url = new URL(base);
  const redacted = new URL(base);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    const serialized = String(value);
    url.searchParams.set(key, serialized);
    redacted.searchParams.set(key, isSensitiveParam(key) ? "[REDACTED]" : serialized);
  }

  return { url, redacted: redacted.toString() };
}

export function ensureAllowedHttpsUrl(value: string, allowedHosts: readonly string[]): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (!allowedHosts.includes(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function isSensitiveParam(key: string): boolean {
  return /(key|token|secret|password)/i.test(key);
}
