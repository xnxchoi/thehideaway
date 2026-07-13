import { afterEach, describe, expect, it } from "vitest";
import {
  createLostGateCookieValue,
  hasLostGateCookie,
  isLostGatePassword,
  LOST_GATE_COOKIE_MAX_AGE_SECONDS,
  LOST_GATE_COOKIE_NAME
} from "./gate";

const previousBetterAuthSecret = process.env.BETTER_AUTH_SECRET;

function requestWithCookie(value?: string) {
  return {
    cookies: {
      get: (name: string) =>
        name === LOST_GATE_COOKIE_NAME && value ? { value } : undefined
    }
  };
}

afterEach(() => {
  if (previousBetterAuthSecret === undefined) {
    delete process.env.BETTER_AUTH_SECRET;
  } else {
    process.env.BETTER_AUTH_SECRET = previousBetterAuthSecret;
  }
});

describe("LOST gate session cookie", () => {
  it("accepts a server-signed, unexpired cookie", async () => {
    process.env.BETTER_AUTH_SECRET = "test-gate-secret";
    const value = await createLostGateCookieValue(1_700_000_000_000);

    expect(value).not.toBeNull();
    expect(
      await hasLostGateCookie(
        requestWithCookie(value ?? undefined),
        1_700_000_000_001
      )
    ).toBe(true);
  });

  it("rejects a forged legacy bearer value", async () => {
    process.env.BETTER_AUTH_SECRET = "test-gate-secret";

    expect(
      await hasLostGateCookie(
        requestWithCookie(
          "3f9c89c8a38beabc1fc84adc476cfe230f276da8223682ecfbd1e6b500bfd722"
        )
      )
    ).toBe(false);
  });

  it("rejects an expired signed cookie", async () => {
    process.env.BETTER_AUTH_SECRET = "test-gate-secret";
    const issuedAt = 1_700_000_000_000;
    const value = await createLostGateCookieValue(issuedAt);
    const expiredAt = issuedAt + LOST_GATE_COOKIE_MAX_AGE_SECONDS * 1000 + 1;

    expect(
      await hasLostGateCookie(requestWithCookie(value ?? undefined), expiredAt)
    ).toBe(false);
  });

  it("fails closed when no server secret is configured", async () => {
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.LOSTINSEOUL_GATE_SESSION_SECRET;

    expect(await createLostGateCookieValue()).toBeNull();
    expect(await hasLostGateCookie(requestWithCookie("anything"))).toBe(false);
  });

  it("fails closed when no gate password hash is configured", async () => {
    delete process.env.LOSTINSEOUL_GATE_PASSWORD_SHA256;

    expect(await isLostGatePassword("anything")).toBe(false);
  });
});
