"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { takeRateLimitToken } from "@/lib/security/rate-limit";

function sanitizeFrom(from: string | null): string {
  if (!from) return "/";
  if (!from.startsWith("/") || from.startsWith("//") || from.includes("://")) return "/";
  // Prevent redirect loop back to the gate after successful auth
  if (from.startsWith("/gate")) return "/";
  return from;
}

function passwordsMatch(input: string | null, expected: string): boolean {
  const enc = new TextEncoder();
  const a = enc.encode(input ?? "");
  const b = enc.encode(expected);
  // Pad to same length — timingSafeEqual requires equal-length buffers
  const len = Math.max(a.length, b.length);
  const pa = new Uint8Array(len);
  pa.set(a);
  const pb = new Uint8Array(len);
  pb.set(b);
  // Length check after constant-time comparison to avoid short-circuit on mismatch
  return timingSafeEqual(pa, pb) && a.length === b.length;
}

// react-doctor-disable-next-line react-doctor/server-auth-actions -- this IS the auth action; password check + rate limit are the guard
export async function enterGate(
  prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const password = formData.get("password") as string | null;
  const from = sanitizeFrom(formData.get("from") as string | null);

  const gatePassword = process.env.NYCGRID_GATE_PASSWORD;
  const gateToken = process.env.NYCGRID_GATE_TOKEN;

  if (!gatePassword || !gateToken) {
    return { error: "Gate not configured" };
  }

  const requestHeaders = await headers();
  const rateLimit = takeRateLimitToken(requestHeaders, {
    namespace: "gate-attempt",
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return { error: "Too many attempts. Try again later." };
  }

  // Short-circuit if the session cookie is already valid — no need to re-authenticate.
  const cookieStore = await cookies();
  const existing = cookieStore.get("nycgrid_session");
  if (existing?.value === gateToken) {
    redirect(from);
  }

  if (!passwordsMatch(password, gatePassword)) {
    return { error: "Incorrect password" };
  }

  cookieStore.set("nycgrid_session", gateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(from);
}
