import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockCookieGet = vi.fn();
const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: mockCookieGet, set: mockCookieSet })),
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

import { enterGate } from "./actions";
import { redirect } from "next/navigation";
import { resetRateLimitState } from "@/lib/security/rate-limit";

const mockRedirect = vi.mocked(redirect);

describe("enterGate", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockRedirect.mockReset();
    mockCookieGet.mockReset();
    mockCookieSet.mockReset();
    resetRateLimitState();
  });

  it("returns error when env vars not configured", async () => {
    const formData = new FormData();
    formData.set("password", "anything");
    const result = await enterGate({ error: null }, formData);
    expect(result).toEqual({ error: "Gate not configured" });
    expect(mockCookieSet).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("returns error on wrong password", async () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");

    const formData = new FormData();
    formData.set("password", "wrong");
    formData.set("from", "/explore");

    const result = await enterGate({ error: null }, formData);
    expect(result).toEqual({ error: "Incorrect password" });
    expect(mockCookieSet).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("sets cookie and redirects on correct password", async () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");

    const formData = new FormData();
    formData.set("password", "secret");
    formData.set("from", "/explore");

    await enterGate({ error: null }, formData);

    expect(mockCookieSet).toHaveBeenCalledWith("nycgrid_session", "tok123", {
      httpOnly: true,
      secure: false, // NODE_ENV is "test", not "production"
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    expect(mockRedirect).toHaveBeenCalledWith("/explore");
  });

  it("redirects to / when no from param", async () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");

    const formData = new FormData();
    formData.set("password", "secret");

    await enterGate({ error: null }, formData);

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("sanitizes open redirect — external URL", async () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");

    const formData = new FormData();
    formData.set("password", "secret");
    formData.set("from", "https://evil.com");

    await enterGate({ error: null }, formData);

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("sanitizes open redirect — protocol-relative", async () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");

    const formData = new FormData();
    formData.set("password", "secret");
    formData.set("from", "//evil.com");

    await enterGate({ error: null }, formData);

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("sanitizes from=/gate to prevent redirect loop back to gate", async () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");

    const formData = new FormData();
    formData.set("password", "secret");
    formData.set("from", "/gate");

    await enterGate({ error: null }, formData);

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("sanitizes from=/gate/subpath to prevent redirect loop back to gate", async () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");

    const formData = new FormData();
    formData.set("password", "secret");
    formData.set("from", "/gate/something");

    await enterGate({ error: null }, formData);

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("allows valid from path", async () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");

    const formData = new FormData();
    formData.set("password", "secret");
    formData.set("from", "/camera/abc");

    await enterGate({ error: null }, formData);

    expect(mockRedirect).toHaveBeenCalledWith("/camera/abc");
  });

  it("returns rate-limit error after 5 failed attempts", async () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");

    const formData = new FormData();
    formData.set("password", "wrong");

    for (let i = 0; i < 5; i++) {
      await enterGate({ error: null }, formData);
    }
    const result = await enterGate({ error: null }, formData);
    expect(result).toEqual({ error: "Too many attempts. Try again later." });
  });

  it("short-circuits and redirects when session cookie already matches token", async () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");
    mockCookieGet.mockReturnValue({ value: "tok123" });

    const formData = new FormData();
    formData.set("password", "wrong");
    formData.set("from", "/explore");

    await enterGate({ error: null }, formData);

    expect(mockRedirect).toHaveBeenCalledWith("/explore");
    expect(mockCookieSet).not.toHaveBeenCalled();
  });
});
