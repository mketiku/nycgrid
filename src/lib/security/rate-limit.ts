interface RateLimitPolicy {
  namespace: string;
  limit: number;
  windowMs: number;
}

interface BucketState {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
}

// In-memory only — does not coordinate across Vercel function instances.
// Effective as a per-instance best-effort throttle; replace with Redis for true rate limiting.
const buckets = new Map<string, BucketState>();

export function getClientAddress(headers: Headers): string {
  const cfConnectingIp = headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  // x-real-ip is set by Vercel's infra from the TCP connection; clients cannot override it
  const xRealIp = headers.get("x-real-ip")?.trim();
  if (xRealIp) return xRealIp;

  // Use the LAST entry of x-forwarded-for — appended by the CDN edge, not the client.
  // Taking the first (leftmost) entry allows IP spoofing via a crafted XFF header.
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const last = xff.split(",").at(-1)?.trim();
    if (last) return last;
  }

  return "anonymous";
}

export function takeRateLimitToken(
  headers: Headers,
  policy: RateLimitPolicy,
  now = Date.now()
): RateLimitResult {
  const clientAddress = getClientAddress(headers);
  const key = `${policy.namespace}:${clientAddress}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + policy.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: policy.limit,
      remaining: Math.max(policy.limit - 1, 0),
      retryAfterSeconds: Math.ceil(policy.windowMs / 1000),
      resetAt,
    };
  }

  if (existing.count >= policy.limit) {
    return {
      allowed: false,
      limit: policy.limit,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: true,
    limit: policy.limit,
    remaining: Math.max(policy.limit - existing.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
    resetAt: existing.resetAt,
  };
}

export function buildRateLimitHeaders(
  result: RateLimitResult,
  extra?: Record<string, string>
): Headers {
  return new Headers({
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    "Retry-After": String(result.retryAfterSeconds),
    ...extra,
  });
}

export function resetRateLimitState() {
  buckets.clear();
}
