import { describe, expect, it } from "vitest";
import { buildCSP, CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from "./headers";

describe("security headers", () => {
  it("includes a baseline CSP with frame restrictions", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
  });

  it("publishes anti-clickjacking and mime-sniffing protections", () => {
    const entries = Object.fromEntries(
      SECURITY_HEADERS.map((header) => [header.key, header.value])
    );

    expect(entries["X-Frame-Options"]).toBe("DENY");
    expect(entries["X-Content-Type-Options"]).toBe("nosniff");
    expect(entries["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("allows the pinned nycgrid-assets CDN release in media-src", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("cdn.jsdelivr.net/gh/mketiku/nycgrid-assets@v1.3.0/");
  });

  describe("buildCSP — production", () => {
    const prodCSP = buildCSP(true);

    it("does not include 'unsafe-eval' in script-src", () => {
      expect(prodCSP).not.toContain("'unsafe-eval'");
    });

    it("includes upgrade-insecure-requests", () => {
      expect(prodCSP).toContain("upgrade-insecure-requests");
    });
  });

  describe("buildCSP — development", () => {
    const devCSP = buildCSP(false);

    it("includes 'unsafe-eval' so React dev tools can reconstruct callstacks", () => {
      expect(devCSP).toContain("'unsafe-eval'");
    });

    it("omits upgrade-insecure-requests to avoid forcing HTTPS on localhost", () => {
      expect(devCSP).not.toContain("upgrade-insecure-requests");
    });
  });
});
