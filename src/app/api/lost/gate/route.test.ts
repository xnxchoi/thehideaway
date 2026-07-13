import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LOST_GATE_COOKIE_NAME, sha256Hex } from "@/lib/lostinseoul/gate";
import { POST } from "./route";

const previousPasswordHash = process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256;
const previousBetterAuthSecret = process.env.BETTER_AUTH_SECRET;
const previousGateSessionSecret = process.env.LOSTINSEOUL_GATE_SESSION_SECRET;

function gateRequest(
  body: Record<string, string>,
  host = "lostinseoul.com",
  forwardedHost?: string
): NextRequest {
  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
    host
  };

  if (forwardedHost) {
    headers["x-forwarded-host"] = forwardedHost;
    headers["x-forwarded-proto"] = "https";
  }

  return new NextRequest("https://[::]:3000/api/lost/gate", {
    body: new URLSearchParams(body),
    headers,
    method: "POST"
  });
}

afterEach(() => {
  if (previousPasswordHash === undefined) {
    delete process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256;
  } else {
    process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256 = previousPasswordHash;
  }
  if (previousBetterAuthSecret === undefined) {
    delete process.env.BETTER_AUTH_SECRET;
  } else {
    process.env.BETTER_AUTH_SECRET = previousBetterAuthSecret;
  }
  if (previousGateSessionSecret === undefined) {
    delete process.env.LOSTINSEOUL_GATE_SESSION_SECRET;
  } else {
    process.env.LOSTINSEOUL_GATE_SESSION_SECRET = previousGateSessionSecret;
  }
});

describe("POST /api/lost/gate", () => {
  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = "gate-route-test-secret";
  });

  it("sets the LOST gate cookie and redirects to the requested public path", async () => {
    process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256 =
      await sha256Hex("test-password");

    const res = await POST(
      gateRequest({
        password: "test-password",
        returnTo: "/privacy"
      })
    );

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://lostinseoul.com/privacy");
    expect(res.headers.get("set-cookie")).toContain(LOST_GATE_COOKIE_NAME);
    expect(res.headers.get("set-cookie")).toContain("HttpOnly");
    expect(res.headers.get("set-cookie")).toContain("Path=/");
    expect(res.headers.get("set-cookie")).not.toContain(
      "3f9c89c8a38beabc1fc84adc476cfe230f276da8223682ecfbd1e6b500bfd722"
    );
  });

  it("fails closed when the server session secret is missing", async () => {
    process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256 =
      await sha256Hex("test-password");
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.LOSTINSEOUL_GATE_SESSION_SECRET;

    const res = await POST(
      gateRequest({ password: "test-password", returnTo: "/privacy" })
    );

    expect(res.status).toBe(503);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("does not set the gate cookie when the password is invalid", async () => {
    process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256 =
      await sha256Hex("test-password");

    const res = await POST(
      gateRequest({
        password: "wrong-password",
        returnTo: "/terms"
      })
    );

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(
      "https://lostinseoul.com/gate?returnTo=%2Fterms&error=invalid"
    );
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("cleans internal LOST return paths on the public LOST host", async () => {
    process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256 =
      await sha256Hex("test-password");

    const res = await POST(
      gateRequest({
        password: "test-password",
        returnTo: "/lostinseoul/refund"
      })
    );

    expect(res.headers.get("location")).toBe("https://lostinseoul.com/refund");
  });

  it("uses forwarded public host for production redirects behind the proxy", async () => {
    process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256 =
      await sha256Hex("test-password");

    const res = await POST(
      gateRequest(
        {
          password: "test-password",
          returnTo: "/privacy"
        },
        "[::]:3000",
        "lostinseoul.com"
      )
    );

    expect(res.headers.get("location")).toBe("https://lostinseoul.com/privacy");
  });

  it("rejects external return paths", async () => {
    process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256 =
      await sha256Hex("test-password");

    const res = await POST(
      gateRequest({
        password: "test-password",
        returnTo: "https://example.com"
      })
    );

    expect(res.headers.get("location")).toBe("https://lostinseoul.com/");
  });
});
